import path from "path";
import fs from "fs/promises";
import { openSync } from "fs";
import { fork } from "child_process";
const projectRoot = path.resolve();
const TSC = path.resolve(projectRoot, "node_modules/typescript/bin/tsc");
const InvokeTSC = {
    withConfigurationFile: async function (pathToConfig, pathToStdOut = "") {
        pathToConfig = path.resolve(projectRoot, pathToConfig);
        let stdout = "inherit";
        if (pathToStdOut) {
            stdout = openSync(path.resolve(projectRoot, pathToStdOut), "w");
        }
        const args = [
            "--project", pathToConfig
        ];
        const child = fork(TSC, args, {
            stdio: ["ignore", stdout, "inherit", "ipc"]
        });
        const p = new Promise((resolve, reject) => {
            child.on("exit", (code) => {
                code ? reject(code) : resolve();
            });
        });
        try {
            await p;
        }
        catch (code) {
            console.warn(await fs.readFile(pathToStdOut, { encoding: "utf-8" }));
            throw new Error(`Failed on "${TSC} ${args.join(" ")}" with code ${code}`);
        }
    },
    withCustomConfiguration: async function (configLocation, removeConfigAfter, 
    // eslint-disable-next-line
    modifier, pathToStdOut = "") {
        const config = InvokeTSC.defaultConfiguration();
        modifier(config);
        configLocation = path.resolve(projectRoot, configLocation);
        await fs.writeFile(configLocation, JSON.stringify(config, null, 2) + "\n", { "encoding": "utf-8" });
        await this.withConfigurationFile(configLocation, pathToStdOut);
        if (removeConfigAfter) {
            await fs.rm(configLocation);
        }
    },
    // eslint-disable-next-line
    defaultConfiguration: function () {
        return {
            "compilerOptions": {
                "lib": ["es2022"],
                "module": "es2022",
                "target": "es2022",
                "moduleResolution": "node",
                "sourceMap": true,
                "declaration": true,
                /*
                "experimentalDecorators": true,
                "emitDecoratorMetadata": true,
                */
            },
        };
    }
};
export default InvokeTSC;
//# sourceMappingURL=InvokeTSC.mjs.map