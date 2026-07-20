import { readConfig, setUser, validateConfig } from "./config";

function main (){
   
    console.log("Setting the current user...");
    setUser('mona')
    console.log("User updated successfully on disk!\n");

    console.log("Reading the configuration back from disk...");
    const config = readConfig()
   
    console.log("Current Configuration Object in Memory:");
    console.log(config);
}
main();