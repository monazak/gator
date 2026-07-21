import { config } from "process";
import { readConfig, setUser } from "./config";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./lib/db/queries/users"; // Adjust this relative path as needed
import { fetchFeed } from "./lib/rss";
import { createFeed, getAllFeedsWithUsers, getFeedByUrl } from "./lib/db/queries/feeds";
import { Feed, User } from "./lib/db/schema";
import { createFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feed_follows";
type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type CommandsRegistry = Record<string, CommandHandler>;

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export function  middlewareLoggedIn(handler: UserCommandHandler) : CommandHandler{
        return async (cmdName: string, ...args: string[]):  Promise<void> => {
            const currentUserName = readConfig().currentUserName;
            if(!currentUserName){
                console.error("Error: No user logged in.")
                process.exit(1)
            }
            const user = await getUserByName(currentUserName);
            if (!user){
                console.error(`Error: Active user '${currentUserName}' not found in the database.`);            
                process.exit(1);
            }
            await handler(cmdName, user, ...args)
        }
};



async function handlerLogin(cmdName: string, ...args: string[]) {
    const username = args[0];
    if (!username) {
        throw new Error("The login handler expects a single argument, the username");
    }
    const user = await getUserByName(username);
    if (!user) {
        throw new Error("User does not exist.");
    }
    setUser(username);
    console.log(`User has been successfully set to: "${username}"`);
}
async function handlerRegister(cmdName: string, ...args: string[]) {
    const username = args[0];
    if (!username) {
        throw new Error("The register handler expects a single argument, the username");
    }
    const existingUser = await getUserByName(username);
    if (existingUser) {
        throw new Error("User already exists.");
    }
    const newUser = await createUser(username);

    setUser(newUser.name);
    console.log(`User '${newUser.name}' has been successfully created!`);
    console.log(newUser);
}
async function handlerReset() {
    try {
        await deleteAllUsers();
        console.log("Database state has been successfully reset. All user records cleared.");
        process.exit(0);
    } catch (error) {
        console.error("Critical: Failed to reset database tables:", error);
        process.exit(1);
    }
}
async function handlerUsers() {
    try {
        const allUsers = await getUsers();
        const currenUserName = readConfig().currentUserName;

        allUsers.forEach((user) => {
            if (user.name == currenUserName) {
                console.log(`* ${user.name} (current)`);
            } else {
                console.log(`* ${user.name}`);
            }
        });
        process.exit(0);
    } catch (error) {
        console.error("Failed to retrieve user list from the database:", error);
        process.exit(1);
    }
}
async function handlerAgg() {
    try {
        const targetURL = "https://www.wagslane.dev/index.xml";
        const feedData = await fetchFeed(targetURL);
        console.dir(feedData, { depth: null, colors: true });
        process.exit(0);
    } catch (error) {
        console.error("Execution failure during RSS aggregation command:", error);
        process.exit(1);
    }
}
function printFeed(feed: Feed, user: User) {
    console.log("=== Feed Added Successfully ===");
    console.log(`ID:         ${feed.id}`);
    console.log(`Name:       ${feed.name}`);
    console.log(`URL:        ${feed.url}`);
    console.log(`Added By:   ${user.name} (${feed.user_id})`);
    console.log(`Created At: ${feed.createdAt}`);
}
async function handlerAddFeed(cmdName: string, user:User, ...args: string[]): Promise<void> {
    if (args.length < 2) {
        console.error("Error: 'addfeed' requires two arguments: <name> <url>");
        process.exit(1);
    }
    const [name, url] = args;

    try {
        const newFeed = await createFeed(name, url, user.id);
        const followResult = await createFeedFollow(newFeed.id, user.id);
        printFeed(newFeed, user);
        console.log(`User '${followResult.userName}' is now following '${followResult.feedName}'.`);
        process.exit(0);
    } catch (error: any) {
        if (error.code === "23505") {
            console.error(`Error: A feed with the URL '${url}' already exists.`);
        } else {
            console.error("Execution failure during addfeed processing:", error);
        }
        process.exit(1);
    }
}
async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
    try {
        const records = await getAllFeedsWithUsers();

        records.forEach((record) => {
            console.log("========================================");
            console.log(`* Feed Name: ${record.name}`);
            console.log(`* URL:       ${record.url}`);
            console.log(`* Added By:  ${record.userName}`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Failed to retrieve feeds list:", error);
        process.exit(1);
    }
}
async function handlerFollow(cmdName: string, user:User,...args: string[]): Promise<void> {
    if (args.length < 1) {
        console.error("Error: 'follow' requires one argument:<url>");
        process.exit(1);
    }
    const [url] = args;

    try {
        const feed = await getFeedByUrl(url);
        if (!feed) {
            console.error(`Error: No feed found with URL '${url}'.`);
            process.exit(1);
        }
        const followResult = await createFeedFollow(feed.id, user.id);
        console.log(`User '${followResult.userName}' is now following '${followResult.feedName}'.`);
        process.exit(0);
    } catch (error: any) {
        if (error.code === "23505") {
            console.error(`Error: You are already following this feed.`);
        } else {
            console.error("Execution failure during follow operation:", error);
        }
        process.exit(1);
    }
}
async function handlerFollowing(cmdName: string, user:User, ...args: string[]): Promise<void> {
    try {

        const follows = await getFeedFollowsForUser(user.id);
        if (follows.length == 0) {
            console.error("Not following any feeds.");
            process.exit(0);
        }
        console.log(`=========== ${readConfig().currentUserName} follows: ===========`);
        follows.forEach((item) => {
            console.log(`* ${item.feedName}`);
        });
        process.exit(0);
    } catch (error: any) {
        console.error("Failed to fetch followed feeds:", error);
        process.exit(1);
    }
}
function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}
async function runCommand(
    registry: CommandsRegistry,
    cmdName: string,
    ...args: string[]
): Promise<void> {
    const handler = registry[cmdName];
    if (!handler) {
        throw new Error(`Unknown command: "${cmdName}"`);
    }
    await handler(cmdName, ...args);
}
async function main() {
    const registry: CommandsRegistry = {};
    registerCommand(registry, "login", handlerLogin);
    registerCommand(registry, "register", handlerRegister);
    registerCommand(registry, "reset", handlerReset);
    registerCommand(registry, "users", handlerUsers);
    registerCommand(registry, "agg", handlerAgg);
    registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
    registerCommand(registry, "feeds", handlerFeeds);
    registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
    registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
    const CLIArgs = process.argv.slice(2);

    if (CLIArgs.length < 1) {
        console.log("Error: no enough arguments provided.");
        process.exit(1);
    }

    const cmdName = CLIArgs[0];
    const cmdParams = CLIArgs.slice(1);

    try {
        await runCommand(registry, cmdName, ...cmdParams);
        process.exit(0);
    } catch (err: any) {
        console.log(`Error: ${err.message}`);
        process.exit(1);
    }
}
main();
