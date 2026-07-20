import { readConfig, setUser, validateConfig } from "./config";

type CommandHandler = (cmdName: string, ...args: string[]) => void;

type CommandsRegistry = Record<string, CommandHandler>

function handlerLogin(cmdName: string, ...args: string[]){
    const username = args[0]
    if (!username){
        throw new Error('The login handler expects a single argument, the username')
    }
    setUser(username)
    console.log(`User has been successfully set to: "${username}"`)
}


function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler){
    registry[cmdName]=handler
}

function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
    const handler = registry[cmdName]
    if(!handler){
        throw new Error (`Unknown command: "${cmdName}"`)
    }
    handler(cmdName, ...args);
}

function main (){
    const registry: CommandsRegistry = {}
    registerCommand(registry, 'login', handlerLogin)
    const CLIArgs = process.argv.slice(2)
    
    if(CLIArgs.length < 1){
        console.log("Error: no enough arguments provided.")
        process.exit(1)
    }

    const cmdName = CLIArgs[0]
    const cmdParams = CLIArgs.slice(1)

    try{
        runCommand(registry, cmdName, ...cmdParams)
    }catch(err:any){
        console.log(`Error: ${err.message}`)
        process.exit(1)
    }
}
main();