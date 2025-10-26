import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { config } from "dotenv";
import pc from "picocolors";
import chokidar from "chokidar";

config();

import processor from "./processor/Processor";
import { getEnvValue, getEnvValueAsBoolean } from "./utils/EnvUtil";

//#region Environment Variables
const scriptDir = getEnvValue("SCRIPT_DIR");
const processedDir = getEnvValue("PROCESSED_DIR");
const scriptEntry = getEnvValue("SCRIPT_ENTRY");
const scriptHeader = getEnvValue("SCRIPT_HEADER");
const output = getEnvValue("OUTPUT");

const darkluaConfig = getEnvValue("DARKLUA_CONFIG");

const reprocess = getEnvValueAsBoolean("REPROCESS");
const headerNewline = getEnvValueAsBoolean("HEADER_NEWLINE");
//#endregion

// Clean processed directory
if (fs.existsSync(processedDir)) {
    fs.rmSync(processedDir, { recursive: true });
}
fs.mkdirSync(processedDir, { recursive: true });

//#region Helpers
const execAsync = (command: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (stdout) console.log(pc.gray(stdout.trim()));
            if (stderr) console.error(pc.red(stderr.trim()));
            if (err) return reject(err);
            resolve();
        });
    });
};
//#endregion

//#region Build Process
const build = async () => {
    console.log(pc.white("Pre-processing scripts..."));

    const expectedFiles: string[] = [];

    const processWalk = async (dir: string): Promise<void> => {
        const files = fs.readdirSync(dir);

        await Promise.all(
            files.map(async (file: string) => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    await processWalk(fullPath);
                } else {
                    const relativePath = path.relative(scriptDir, fullPath);
                    const outputPath = path.join(processedDir, relativePath);

                    // Ensure output subdirectory exists
                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

                    expectedFiles.push(outputPath);

                    try {
                        await execAsync(
                            `darklua process --config ${darkluaConfig} "${fullPath}" "${outputPath}"`
                        );
                    } catch (err) {
                        console.error(pc.red(`Error processing ${relativePath}:`), err);
                    }
                }
            })
        );
    };

    await processWalk(scriptDir);
    console.log(pc.greenBright("Pre-processed scripts!"));

    // Generate the final script
    console.log(pc.white("Generating script..."));

    let header = "";
    if (fs.existsSync(path.join(scriptDir, scriptHeader))) {
        header = fs.readFileSync(path.join(scriptDir, scriptHeader), "utf-8");
    } else {
        console.warn(pc.yellow("No header found!"));
    }

    let script = processor.process(path.join(processedDir, scriptEntry));
    script = header + (headerNewline ? "\n" : "") + script;
    fs.writeFileSync(output, script);
    console.log(pc.greenBright("Script generated!"));

    // Optional reprocess pass
    if (reprocess) {
        console.log(pc.white("Re-processing script..."));
        try {
            await execAsync(`darklua process --config ${darkluaConfig} "${output}" "${output}"`);
            let script = fs.readFileSync(output, "utf-8");
            fs.writeFileSync(output, header + (headerNewline ? "\n" : "") + script);
            console.log(" " + pc.green("Header re-appended!"));
            console.log(pc.greenBright("Script re-processed!"));
        } catch (err) {
            console.error(pc.red("Reprocess failed:"), err);
        }
    }
};
//#endregion

//#region Watch Process
const watch = () => {
    console.log(pc.cyan("Watching for changes..."));

    let buildInProgress = false;
    let buildQueued = false;
    let abortController: AbortController | null = null;

    const runBuild = async () => {
        if (buildInProgress) {
            buildQueued = true;
            if (abortController) {
                abortController.abort(); // cancel previous build
            }
            return;
        }

        buildInProgress = true;
        abortController = new AbortController();
        const signal = abortController.signal;

        console.log(pc.cyan("Starting build..."));

        try {
            await build();
        } catch (err) {
            console.error(pc.red("Build failed:"), err);
        } finally {
            buildInProgress = false;

            if (buildQueued) {
                buildQueued = false;
                runBuild();
            }
        }
    };

    chokidar
        .watch(scriptDir, { ignoreInitial: true })
        .on("all", (event, changedPath) => {
            console.log(pc.yellow(`File change detected (${event}): ${changedPath}`));
            runBuild();
        });

    runBuild();
};
//#endregion

//#region CLI
const command = process.argv[2];

switch (command) {
    case "build":
        console.log(pc.cyan("Starting build..."));
        build();
        break;
    case "watch":
        console.log(pc.cyan("Starting watch..."));
        watch();
        break;
    default:
        console.log(pc.cyan("Usage:"));
        console.log(pc.white(" - build") + pc.gray("  → one-time build"));
        console.log(pc.white(" - watch") + pc.gray("  → watch and rebuild on changes"));
        break;
}
//#endregion
