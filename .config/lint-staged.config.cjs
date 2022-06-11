const fs = require("fs")
const path = require("path")

// Git and Lint Staged have different globbing rules
// https://linuxize.com/post/gitignore-ignoring-files-in-git/
// https://github.com/okonet/lint-staged#filtering-files

function gatherIgnoreFiles() {
	try {
		const ignoreFiles = collectIgnoreFiles(process.cwd(), fs.readdirSync(process.cwd()))

		let str = ""
		let input = []

		for (const p of ignoreFiles) {
			input.push(path.join("./", p.split("/").join(path.sep)))
		}

		let ignored = {}
		for (const file of input) {
			const dir = file.split(path.sep)
			const lines = fs.readFileSync(file, { encoding: "utf8" }).split(/\r?\n/g)

			for (let line of lines.filter(Boolean)) {
				if (line[0] === "/") {
					line = line.slice(1, line.length)
				}
				if (!!ignored[dir.slice(0, dir.length - 1).join("/")] === false) {
					ignored[dir.slice(0, dir.length - 1).join("/")] = []
				}
				ignored[dir.slice(0, dir.length - 1).join("/")].push(line)
			}
		}

		for (const [dir, lines] of Object.entries(ignored)) {
			for (let line of lines) {
				if (!!dir === false) {
					str += `|${line}`
					continue
				}
				str += `|${dir}/**/${line}/**/\*`
			}
		}

		// Remove leading pipe
		return str.slice(1, str.length)
	} catch (err) {
		console.error(err)
	}
}

function collectIgnoreFiles(root, dirs) {
	let ignoreFiles = []

	function walk(root, dirs) {
		try {
			for (const dir of dirs) {
				if (fs.lstatSync(path.join(root, dir)).isFile() && dir === ".eslintignore") {
					ignoreFiles.push(path.join(root, dir).split(process.cwd())[1].slice(1))
					continue
				}
				if (fs.lstatSync(path.join(root, dir)).isFile()) {
					continue
				}
				if (dir === "node_modules") {
					continue
				}
				walk(path.join(root, dir), fs.readdirSync(path.join(root, dir)))
			}
		} catch (err) {
			console.error(err)
		}
	}
	walk(root, dirs)

	return ignoreFiles
}

module.exports = {
	[`!(${gatherIgnoreFiles()}).{js,cjs,mjs,ts,json,graphql}`]: ["eslint"],
}
