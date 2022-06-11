/* eslint-disable import/no-commonjs, @typescript-eslint/no-var-requires */
const fs = require("fs")
const path = require("path")

/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	env: {
		es2021: true,
		node: true,
	},
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: "module",
		allowImportExportEverywhere: true, // dynamic import
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
	globals: {
		Atomics: "readonly",
		SharedArrayBuffer: "readonly",
		self: true,
		caches: true,
		fetch: true,
	},
	plugins: ["@typescript-eslint", "node", "import", "json", "prettier"],
	settings: {
		"import/parsers": {
			"@typescript-eslint/parser": [".js", ".cjs", ".mjs", ".ts"],
		},
		"import/resolver": {
			typescript: {
				project: path.join(__dirname, "tsconfig.json"),
			},
		},
	},
	rules: {
		// ENV Specific
		"@typescript-eslint/ban-ts-comment": 0,
		"@typescript-eslint/explicit-module-boundary-types": 0,
		"@typescript-eslint/no-extra-semi": 0,
		"@typescript-eslint/no-explicit-any": 0,
		"@typescript-eslint/no-unused-vars": [
			"error",
			{
				argsIgnorePattern: "^_|req|res|next|args|ctx|__",
				varsIgnorePattern: "^_|req|res|next|args|ctx|__",
			},
		],
		// END

		"arrow-body-style": ["error", "as-needed", { requireReturnForObjectLiteral: true }],
		"arrow-parens": ["error", "as-needed"],
		camelcase: 0,
		"comma-dangle": ["error", "always-multiline"],
		"consistent-return": "error",
		"func-style": ["error", "declaration", { allowArrowFunctions: false }],
		"import/default": 0,
		"import/export": "error",
		"import/extensions": [
			"error",
			"ignorePackages",
			{
				js: "always",
				ts: "never", // Should be set to always. Prevented by Typescript error.
			},
		],
		"import/first": "error",
		"import/named": "error",
		"import/namespace": "error",
		"import/newline-after-import": ["error", { count: 1 }],
		"import/no-anonymous-default-export": [
			2,
			{
				allowArray: true,
				allowObject: true,
			},
		],
		"import/no-commonjs": 2,
		"no-confusing-arrow": "error",
		"no-constant-condition": ["error", { checkLoops: false }],
		"import/no-cycle": [2, { ignoreExternal: true }],
		"import/no-deprecated": "error",
		"import/no-duplicates": "error",
		"import/no-extraneous-dependencies": "error",
		"import/no-internal-modules": 0,
		"import/no-mutable-exports": "error",
		"import/no-named-as-default-member": "error",
		"import/no-named-as-default": "error",
		"import/no-named-default": "error",
		"import/no-self-import": "error",
		"import/no-unresolved": "error",
		"import/no-unused-modules": "error",
		"import/no-useless-path-segments": "error",
		"import/order": [
			"error",
			{ groups: ["builtin", "external", "internal", "index", "sibling", "parent", "object", "type"] },
		],
		indent: "off", // Fix conflict with Prettier
		"keyword-spacing": [
			"error",
			{
				after: true,
				before: true,
			},
		],
		"linebreak-style": ["error", "unix"],
		"node/no-deprecated-api": [
			"error",
			{
				version: ">=14.0.0",
				ignoreModuleItems: [],
				ignoreGlobalItems: [],
			},
		],
		"no-fallthrough": 1,
		"no-inner-declarations": 1,
		"no-labels": "error",
		"no-mixed-operators": 1,
		"no-multi-spaces": "error",
		"no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
		"no-restricted-syntax": ["error", "LabeledStatement", "WithStatement", "BinaryExpression[operator='in']"],
		"no-self-assign": "error",
		"no-sequences": 0,
		"no-shadow": "error",
		"no-tabs": 0,
		"no-undef": "error",
		"no-underscore-dangle": ["error", { allow: ["_id", "__dirname"] }],
		"no-unused-labels": "error",
		"no-unexpected-multiline": "error",
		"no-unreachable": "warn",
		"no-unused-vars": [
			"error",
			{
				argsIgnorePattern: "^_|req|res|next|args|ctx|__",
				varsIgnorePattern: "^_|req|res|next|args|ctx|__",
			},
		],
		"no-use-before-define": [
			"error",
			{
				functions: false,
				classes: false,
				variables: true,
			},
		],
		"no-var": "error",
		"object-shorthand": ["error", "always"],
		"padded-blocks": [
			"error",
			{
				blocks: "never",
				classes: "never",
				switches: "never",
			},
			{ allowSingleLineBlocks: false },
		],
		"padding-line-between-statements": [
			"error",
			{
				blankLine: "always",
				prev: "*",
				next: "function",
			},
			{
				blankLine: "always",
				prev: "function",
				next: ["block", "block-like", "class", "const", "let", "var"],
			},
			{
				blankLine: "always",
				prev: "block",
				next: "*",
			},
			{
				blankLine: "always",
				prev: "*",
				next: "block",
			},
			{
				blankLine: "always",
				prev: "import",
				next: [
					"block",
					"block-like",
					"function",
					"class",
					"const",
					"let",
					"var",
					"expression",
					"empty",
					"for",
					"if",
					"iife",
					"switch",
					"while",
				],
			},
		],
		"prefer-arrow-callback": "error",
		"prefer-const": 0,
		"prefer-template": 0,
		"prettier/prettier": ["error", JSON.parse(fs.readFileSync(path.join(__dirname, ".prettierrc"), "utf8"))],
		semi: ["error", "never"],
		"space-before-function-paren": [
			"error",
			{
				anonymous: "always",
				named: "never",
				asyncArrow: "always",
			},
		],
		"spaced-comment": [
			"error",
			"always",
			{
				line: {
					markers: ["!", "?", "*", "/"],
					exceptions: ["-", "*"],
				},
				block: {
					markers: ["!", "?", "*"],
					exceptions: ["-", "*"],
					balanced: true,
				},
			},
		],
		quotes: [
			"error",
			"double",
			{
				avoidEscape: true,
			},
		],
	},
}
