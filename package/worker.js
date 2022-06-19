// @ts-check
import os from "os"
import path from "path"
import { spawn } from "child_process"
import { parentPort } from "worker_threads"
import { PLATFORM_MAPPING, ARCH_MAPPING } from "./main.js"

async function worker({ cmd, cwd, args, logName, spaceMultiplier }) {
	try {
		const goos = PLATFORM_MAPPING[os.platform()]
		const goarch = ARCH_MAPPING[os.arch()]
		const subDir = `${goos}-${goarch}`
		const binPath = path.join(cwd, subDir)

		parentPort?.postMessage(logName)

		spawn(path.join(binPath, cmd), [...args, `--max-old-space-size=${1024 * spaceMultiplier}`], {
			cwd,
			stdio: "inherit",
		})
	} catch (err) {
		console.error(err)
	}
}

parentPort?.on("message", message => {
	worker(message)
})
