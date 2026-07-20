import os from "os"
import path from "path"
import fs from "fs"

type Config = {
    dbUrl:string,
    currentUserName: string
}
type RawConfig = {
    db_url: string,
    current_user_name: string
}


function getConfigFilePath(): string {
    const homeDir = os.homedir()
    return path.join(homeDir, ".gatorconfig.json")
}

export function validateConfig(rawConfig: any): Config {
    if (!rawConfig || typeof rawConfig.db_url!== "string")
        throw new Error ("Invalid configuration file: 'db_url' is required and must be a string.")

    return {
        dbUrl:rawConfig.db_url,
        currentUserName:rawConfig.current_user_name
    }
}

export function readConfig():Config {
    const filePath = getConfigFilePath()
    const jsonContent = fs.readFileSync(filePath, 'utf-8')
    const unverifiedData = JSON.parse(jsonContent)
    return validateConfig(unverifiedData) 
}

export function writeConfig(cfg:Config):void {
    const filePath = getConfigFilePath()

    const rawConfig= {
        db_url:cfg.dbUrl,
        current_user_name:cfg.currentUserName
    }
    const jsonText= JSON.stringify(rawConfig)
   
    fs.writeFileSync(filePath, jsonText)
}


export function setUser(userName:string){
   const currentConfig = readConfig()
   currentConfig.currentUserName = userName

   writeConfig(currentConfig)
}
