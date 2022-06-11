// @ts-check
import os from "os"
import fs from "fs"
import path from "path"
import { execSync, spawnSync } from "child_process"
import { performance } from "perf_hooks"
import clr from "picocolors"
import { cleanDir, mkdir, printElapsed } from "@signalchain/utils/node"

// Mapping between Node's "process.platform" to Golang's "$GOOS"
// https://nodejs.org/api/process.html#process_process_platform
const PLATFORM_MAPPING = {
	darwin: "darwin",
	freebsd: "freebsd",
	linux: "linux",
	win32: "windows",
}

// Mapping from Node's "process.arch" to Golang's "$GOARCH"
// https://nodejs.org/api/process.html#process_process_arch
const ARCH_MAPPING = {
	arm: "arm",
	arm64: "arm64",
	ia32: "386",
	x64: "amd64",
	mips64le: "mips64le",
	ppc64: "ppc64",
}

/**
 * @param {string} inputDir - directory of main.go
 * @param {string} destDir - directory for built binaries
 * @param {string} binName - directory for built binaries
 * @param {boolean} dev - env is development
 */
export default async function buildBinary(inputDir, destDir, binName, dev) {
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
		runBuildCMD(inputDir, binDirPath, subDir, goos, goarch, binPath)
		printElapsed(start, "[bin-utils] Build all binaries completed")
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

async function runBuildCMD(inputDir, binDirPath, subDir, platform, arch, binPath) {
	if (!fs.existsSync(binDirPath)) {
		mkdir(binDirPath)
	}

	cleanDir(binDirPath)

	const stdout = execSync(`env GOOS=${platform} GOARCH=${arch} go build -o ${binPath}`, {
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
 * @return {[stdout, stderr]}
 */
export function runPlatformBin(cmd, cwd, args, logName) {
	const goos = PLATFORM_MAPPING[os.platform()]
	const goarch = ARCH_MAPPING[os.arch()]
	const subDir = `${goos}-${goarch}`
	const binPath = path.join(cwd, subDir, cmd)

	const { stdout, stderr } = spawnSync(binPath, args, {
		cwd,
	})
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
