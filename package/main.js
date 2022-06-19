// @ts-check
import os from "os"
import fs from "fs"
import path, { dirname } from "path"
import { execSync, spawnSync } from "child_process"
import { Worker } from "worker_threads"
import { performance } from "perf_hooks"
import { fileURLToPath } from "url"
import clr from "picocolors"
import { cleanDir, mkdir, printElapsed } from "@signalchain/utils/node"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Mapping between Node's "process.platform" to Golang's "$GOOS"
// https://nodejs.org/api/process.html#process_process_platform
export const PLATFORM_MAPPING = {
	darwin: "darwin",
	freebsd: "freebsd",
	linux: "linux",
	win32: "windows",
}

// Mapping from Node's "process.arch" to Golang's "$GOARCH"
// https://nodejs.org/api/process.html#process_process_arch
export const ARCH_MAPPING = {
	arm: "arm",
	arm64: "arm64",
	ia32: "386",
	x64: "amd64",
	mips64le: "mips64le",
	ppc64: "ppc64",
}

// node --max-old-space-size=1024 index.js #increase to 1gb
// node --max-old-space-size=2048 index.js #increase to 2gb
// node --max-old-space-size=3072 index.js #increase to 3gb
// node --max-old-space-size=4096 index.js #increase to 4gb
// node --max-old-space-size=5120 index.js #increase to 5gb
// node --max-old-space-size=6144 index.js #increase to 6gb
// node --max-old-space-size=7168 index.js #increase to 7gb
// node --max-old-space-size=8192 index.js #increase to 8gb

/**
 * @param {string} inputDir - directory of main.go
 * @param {string} destDir - directory for built binaries
 * @param {string} binName - directory for built binaries
 * @param {boolean} dev - env is development
 * @param {number} [spaceMultiplier] - pass a number to be multiplied by 1024 to increase heap size
 */
export default async function buildBinary(inputDir, destDir, binName, dev, spaceMultiplier = 4096) {
	const start = performance.now()

	const goos = PLATFORM_MAPPING[os.platform()]
	const goarch = ARCH_MAPPING[os.arch()]
	const subDir = `${goos}-${goarch}`
	const binDirPath = path.join(destDir, subDir)

	let binPath = path.join(binDirPath, binName)

	if (goos === "windows") {
		binPath = path.join(binDirPath, `${binName}.exe`)
	}

	if (dev) {
		runBuildCMD(inputDir, binDirPath, subDir, goos, goarch, binPath, spaceMultiplier)
		printElapsed(start, `[bin-utils] Build ${binName} complete`)
		return
	}

	for (const platform of Object.values(PLATFORM_MAPPING)) {
		for (const arch of Object.values(ARCH_MAPPING)) {
			if (platform === "darwin" || platform === "freebsd") {
				if (arch === "386" || arch === "arm" || arch === "mips64le" || arch === "ppc64") {
					continue
				}
			}

			if (platform === "windows") {
				if (arch === "arm" || arch === "arm64" || arch === "mips64le" || arch === "ppc64") {
					continue
				}
			}

			runBuildCMD(inputDir, binDirPath, subDir, platform, arch, binPath)
		}
	}

	printElapsed(start, `[bin-utils] Build ${binName} complete`)
}

async function runBuildCMD(inputDir, binDirPath, subDir, platform, arch, binPath, spaceMultiplier) {
	if (!fs.existsSync(binDirPath)) {
		mkdir(binDirPath)
	}

	cleanDir(binDirPath)

	const stdout = execSync(`env GOOS=${platform} GOARCH=${arch} go build -o ${binPath}`, {
		maxBuffer: 1024 * spaceMultiplier,
		cwd: inputDir,
	})

	if (stdout.toString()) {
		process.stdout.write(`${stdout.toString()}\n`)
	}
}

/**
 * @typedef stdout
 * @type {string} stdout
 */

/**
 * @typedef stderr
 * @type {string} stdout
 */

/**
 * @typedef StdOut
 * @type {Array<stdout, stderr>}
 */

/**
 * @param {string} cmd
 * @param {string} cwd - current working directory
 * @param {Array<string>} args - command options
 * @param {string} logName - prefix logs (ex. [compiler])
 * @param {number} [spaceMultiplier] - pass a number to be multiplied by 1024 to increase heap size
 * @return {[stdout, stderr]}
 */
export function runPlatformBin(cmd, cwd, args, logName, spaceMultiplier = 4096) {
	const goos = PLATFORM_MAPPING[os.platform()]
	const goarch = ARCH_MAPPING[os.arch()]
	const subDir = `${goos}-${goarch}`
	const binPath = path.join(cwd, subDir)

	const { stdout, stderr } = spawnSync(
		path.join(binPath, cmd),
		[...args, `--max-old-space-size=${1024 * spaceMultiplier}`],
		{
			maxBuffer: 4096,
			cwd,
		},
	)
	if (!!stdout?.toString() === true) {
		process.stdout.write(`${clr.blue(logName)} ${stdout.toString()}\n`)
	}

	if (!!stderr?.toString() === true && logName) {
		const se = stderr.toString()

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
	}

	return [stdout?.toString(), stderr?.toString()]
}

/**
 * @param {string} cmd
 * @param {string} cwd - current working directory
 * @param {Array<string>} args - command options
 * @param {string} logName - prefix logs (ex. [compiler])
 * @param {number} [spaceMultiplier] - pass a number to be multiplied by 1024 to increase heap size
 */
export async function runPlatformBinInWorker(cmd, cwd, args, logName, spaceMultiplier = 4096) {
	try {
		// https://spectrumstutz.com/nodejs/nodejs-child-process-worker-threads/
		const worker = new Worker(path.join(__dirname, "worker.js"))

		// Set worker thread event handlers
		worker.on("message", result => {
			process.stdout.write(`${clr.blue(result)}\n`)
		})

		worker.on("exit", code => {
			process.stdout.write(`Worker exited with code ${code}`)
		})

		// Post message to the worker thread.
		worker.postMessage({ cmd, cwd, args, logName, spaceMultiplier })
	} catch (err) {
		console.error(err)
	}
}
