import * as fs from "fs";

import { exec } from "child_process";
import { config } from "dotenv";
import pc from "picocolors";

config();

import processor from "./processor/Processor";
import { getEnvValue, getEnvValueAsBoolean } from "./utils/EnvUtil";

const scriptDir = getEnvValue("SCRIPT_DIR");
const processedDir = getEnvValue("PROCESSED_DIR");
const scriptEntry = getEnvValue("SCRIPT_ENTRY");
const scriptHeader = getEnvValue("SCRIPT_HEADER");
const output = getEnvValue("OUTPUT");

const darkluaConfig = getEnvValue("DARKLUA_CONFIG");

const reprocess = getEnvValueAsBoolean("REPROCESS");
const headerNewline = getEnvValueAsBoolean("HEADER_NEWLINE");

if (fs.existsSync(processedDir)) {
    fs.rmSync(processedDir, { recursive: true });
}
fs.mkdirSync(processedDir);

// Process all LuaU files (LuaU -> Lua 5.1)
const expectedFiles: string[] = [];

const processWalk = (dir: string) => {
    const files = fs.readdirSync(dir);

    files.forEach((file: string) => {
        const path = dir + "/" + file;
        const stat = fs.statSync(path);
        
        if (stat.isDirectory()) {
            processWalk(path);
        } else {
            const relativePath = path.replace(scriptDir, "");
            exec(`darklua process --config ${darkluaConfig} ${path} ${processedDir + relativePath}`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (stderr) {
                    console.error(stderr);
                    return;
                }
            });
            expectedFiles.push(processedDir + relativePath);
        }
    });
}

console.log(pc.white("Pre-processing scripts..."));
processWalk(scriptDir);

// Generate the script
const generateScript = () => {
    console.log(pc.white("Generating script..."));

    let header = "";
    if (fs.existsSync(scriptDir + scriptHeader)) {
        header = fs.readFileSync(scriptDir + scriptHeader, "utf-8");
    } else {
        console.warn(pc.yellow("No header found!"));
    }
    
    let script = processor.process(processedDir + scriptEntry);
    if (fs.existsSync(scriptDir + scriptHeader)) {
        script = fs.readFileSync(scriptDir + scriptHeader) + (headerNewline ? "\n" : "") + script;
    }
    fs.writeFileSync(output, script);
    
    console.log(pc.greenBright("Script generated!"));

    if (reprocess) {
        console.log(pc.white("Re-processing script..."));

        exec(`darklua process --config ${darkluaConfig} ${output} ${output}`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            if (stderr) {
                console.error(stderr);
                return;
            }
        }).on("exit", () => {
            let script = fs.readFileSync(output, "utf-8");
            fs.rmSync(output);
            fs.writeFileSync(output, header + (headerNewline ? "\n" : "") + script);
            console.log(" " + pc.green("Header re-appended!"));
            console.log(pc.greenBright("Script re-processed!"));
        });
    }
}

// Wait for all files to be processed
while (true) {
    let done = true;
    expectedFiles.forEach((file: string) => {
        if (!fs.existsSync(file)) {
            done = false;
        }
    });

    if (done) {
        console.log(pc.greenBright("Pre-processed scripts!"));
        generateScript();
        break;
    }
}
