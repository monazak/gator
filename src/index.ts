import { setUser } from "./config";
import { createUser, getUserByName } from "./lib/db/queries/users"; // Adjust this relative path as needed

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type CommandsRegistry = Record<string, CommandHandler>;

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

    setUser(username);
    console.log(`User '${username}' has been successfully created!`);
    console.log(newUser);
}

function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
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
