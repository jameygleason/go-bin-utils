// @ts-check
import os from "os"
import path from "path"
import { spawn } from "child_process"
import { parentPort } from "worker_threads"
import clr from "picocolors"
import { PLATFORM_MAPPING, ARCH_MAPPING } from "./main.js"

async function worker({ cmd, cwd, args, logName, spaceMultiplier }) {
	try {
		const goos = PLATFORM_MAPPING[os.platform()]
		const goarch = ARCH_MAPPING[os.arch()]
		const subDir = `${goos}-${goarch}`
		const binPath = path.join(cwd, subDir)

		const prog = spawn(path.join(binPath, cmd), [...args, `--max-old-space-size=${1024 * spaceMultiplier}`], {
			cwd,
		})

		let data = ""
		for await (const chunk of prog.stdout) {
			data += chunk.toString()
		}

		if (data) {
			process.stdout.write(`${clr.blue(logName)} ${data}\n`)
			parentPort?.postMessage(`${logName} ${data}\n`)
		}

		if (logName) {
			prog.stderr.on("data", se => {
				let err, ts
				;[ts, err] = se.split("+~+~+")

				if (ts && se.split("+~+~+").length === 2) {
					const delim = ts.indexOf(".")
					const nums = ts.split(/[a-zA-Zµ]/)[0]

					let unit = ts.match(/[a-zA-Zµ]/gi)
					if (!unit) {
						// @ts-ignore
						unit = "ms"
					} else {
						// @ts-ignore
						unit = unit.join("")
					}

					console.log(
						`${clr.blue(logName + " ran")} ${clr.green("in")} ${clr.blue(
							nums.slice(0, delim + 2) + nums.slice(delim + 6, ts.length) + unit,
						)}`,
					)
				} else {
					console.error(clr.red(ts))
				}

				if (err) {
					console.error(clr.red(err))
				}
			})
		}
	} catch (err) {
		console.error(err)
	}
}

parentPort?.on("message", message => {
	worker(message)
})
