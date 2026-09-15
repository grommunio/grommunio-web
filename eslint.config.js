// Flat config (ESLint 9). Replaces .eslintrc.js; rules carried over unchanged
// except where noted below.
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	{
		ignores: ["client/extjs/**", "client/extjs-mod/**", "client/third-party/**", "client/tinymce/**", "client/dompurify/**"],
	},
	js.configs.recommended,
	{
		languageOptions: {
			// The client uses optional chaining and regexp lookbehind, so the old
			// "es6" setting left several files unparsed and therefore unchecked.
			ecmaVersion: "latest",
			// Plain scripts, not modules: the files share one global Ext/Grommunio.
			sourceType: "script",
			globals: {
				...globals.browser,
				"DOMPurify": "writable",
				"Ext": "writable",
				"inlineCSS": "writable",
				"Grommunio": "writable",
				"_": "writable",
				"container": "writable",
				"ngettext": "writable",
				"npgettext": "writable",
				"pgettext": "writable",
				"resizeLoginBox": "writable",
				"tinymce": "writable",
				"urlActionData": "writable",
				"userManager": "writable",
			},
		},
		rules: {
			"accessor-pairs": "error",
			"array-bracket-newline": "off",
			"array-bracket-spacing": "off",
			"array-callback-return": "warn",
			"array-element-newline": "off",
			"arrow-body-style": "error",
			"arrow-parens": "error",
			"arrow-spacing": "error",
			"block-scoped-var": "off",
			"block-spacing": "warn",
			"brace-style": "off",
			"callback-return": "off",
			// identifiers mirror MAPI property names (display_name, is_html)
			"camelcase": "off",
			"capitalized-comments": "off",
			"class-methods-use-this": "error",
			"comma-dangle": "warn",
			"comma-spacing": "off",
			"comma-style": [
				"error",
				"last"
			],
			"complexity": "off",
			"computed-property-spacing": [
				"warn",
				"never"
			],
			"consistent-return": "off",
			"consistent-this": "off",
			"curly": "error",
			"default-case": "off",
			"dot-location": [
				"error",
				"property"
			],
			"dot-notation": "off",
			"eol-last": "warn",
			"eqeqeq": "off",
			"for-direction": "error",
			"func-call-spacing": "error",
			"func-name-matching": "error",
			"func-names": [
				"warn",
				"never"
			],
			// both declarations and expressions are used
			"func-style": "off",
			"generator-star-spacing": "error",
			"getter-return": "warn",
			"global-require": "error",
			"guard-for-in": "off",
			"handle-callback-err": "error",
			"id-blacklist": "error",
			"id-length": "off",
			"id-match": "error",
			"indent": "off",
			"indent-legacy": "off",
			"init-declarations": "off",
			"jsx-quotes": "error",
			"key-spacing": "off",
			"keyword-spacing": "off",
			"line-comment-position": "off",
			"linebreak-style": [
				"error",
				"unix"
			],
			"lines-around-comment": "off",
			"lines-around-directive": "error",
			// style preference
			"max-depth": "off",
			"max-len": "off",
			"max-lines": "off",
			"max-nested-callbacks": "error",
			"max-params": [
				"error",
				9
			],
			"max-statements": "off",
			// single-line guards are the house style
			"max-statements-per-line": "off",
			"new-cap": "off",
			"new-parens": "error",
			"newline-after-var": "off",
			"newline-before-return": "off",
			"newline-per-chained-call": "off",
			"no-alert": "error",
			"no-array-constructor": "error",
			"no-bitwise": "off",
			"no-buffer-constructor": "error",
			"no-caller": "error",
			"no-catch-shadow": "error",
			"no-case-declarations": "warn",
			"no-confusing-arrow": "error",
			// continue is the normal early-skip in these loops
			"no-continue": "off",
			"no-console": "warn",
			"no-constant-condition": [
				"warn",
				{
					"checkLoops": "none"
				}
			],
			"no-cond-assign": "warn",
			"no-div-regex": "error",
			"no-delete-var": "off",
			"no-duplicate-imports": "error",
			// style preference, and its fix leaves the former else body mis-indented
			"no-else-return": "off",
			"no-empty-function": "warn",
			"no-eq-null": "error",
			"no-eval": "error",
			"no-extend-native": "off",
			"no-extra-bind": "error",
			"no-extra-label": "error",
			"no-extra-parens": "off",
			"no-extra-boolean-cast": "warn",
			"no-floating-decimal": "error",
			// !!x and +x are used deliberately
			"no-implicit-coercion": "off",
			"no-implicit-globals": "error",
			"no-implied-eval": "error",
			"no-inline-comments": "off",
			"no-inner-declarations": [
				"warn",
				"functions"
			],
			"no-invalid-this": "error",
			"no-iterator": "error",
			"no-label-var": "error",
			"no-labels": "error",
			"no-lone-blocks": "error",
			// style preference
			"no-lonely-if": "off",
			"no-loop-func": "warn",
			"no-magic-numbers": "off",
			"no-mixed-operators": "off",
			"no-multi-assign": "off",
			"no-multi-spaces": "off",
			"no-multi-str": "error",
			"no-multiple-empty-lines": "off",
			// tabs to indent, spaces to align a continuation under what it lines up
			// with, which is what smart-tabs permits. Spaces before a tab stay an error.
			"no-mixed-spaces-and-tabs": [
				"warn",
				"smart-tabs"
			],
			"no-native-reassign": "error",
			// if (!x) ... else ... is used throughout
			"no-negated-condition": "off",
			"no-negated-in-lhs": "error",
			// style preference
			"no-nested-ternary": "off",
			"no-new": "off",
			"no-new-func": "error",
			"no-new-object": "error",
			"no-new-require": "error",
			"no-new-wrappers": "error",
			"no-octal-escape": "error",
			"no-param-reassign": "off",
			"no-path-concat": "error",
			"no-plusplus": "off",
			"no-process-env": "error",
			"no-process-exit": "error",
			"no-proto": "error",
			"no-prototype-builtins": "warn",
			"no-restricted-globals": "error",
			"no-restricted-imports": "error",
			"no-restricted-modules": "error",
			"no-restricted-properties": "error",
			"no-restricted-syntax": "error",
			"no-return-assign": "error",
			// var-scoped ES5: for (var i ...) recurs inside one function
			"no-redeclare": "off",
			"no-script-url": "error",
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-shadow": "off",
			"no-shadow-restricted-names": "error",
			"no-spaced-func": "error",
			"no-sync": "error",
			"no-tabs": "off",
			"no-template-curly-in-string": "error",
			"no-ternary": "off",
			"no-throw-literal": "warn",
			"no-trailing-spaces": "off",
			"no-undef-init": "warn",
			"no-undefined": "off",
			// _private naming, and Ext uses it on its own members
			"no-underscore-dangle": "off",
			"no-unmodified-loop-condition": "error",
			"no-unneeded-ternary": "warn",
			"no-unused-expressions": "error",
			"no-unused-vars": [
				"error",
				{
					"vars": "all",
					"args": "none",
					"caughtErrors": "none"
				}
			],
			"no-use-before-define": "warn",
			"no-useless-escape": "warn",
			"no-useless-call": "warn",
			"no-useless-computed-key": "error",
			"no-useless-concat": "off",
			"no-useless-constructor": "error",
			"no-useless-rename": "error",
			"no-useless-return": "off",
			"no-var": "off",
			"no-void": "error",
			"no-warning-comments": "off",
			"no-whitespace-before-property": "warn",
			"no-with": "error",
			"nonblock-statement-body-position": "error",
			"object-curly-newline": "off",
			"object-curly-spacing": "off",
			"object-property-newline": [
				"error",
				{
					"allowMultiplePropertiesPerLine": true
				}
			],
			"object-shorthand": "off",
			"one-var": "off",
			// var a, b; on one line is normal here; the fix does not indent the split
			"one-var-declaration-per-line": "off",
			"operator-assignment": [
				"warn",
				"always"
			],
			"operator-linebreak": "warn",
			"padded-blocks": "off",
			"padding-line-between-statements": "error",
			"prefer-arrow-callback": "off",
			"prefer-numeric-literals": "error",
			"prefer-promise-reject-errors": "error",
			"prefer-spread": "off",
			"prefer-template": "off",
			"quote-props": "off",
			"quotes": "off",
			"radix": "warn",
			"rest-spread-spacing": "error",
			"semi": "error",
			"semi-spacing": "warn",
			"semi-style": [
				"error",
				"last"
			],
			"sort-imports": "error",
			"sort-keys": "off",
			"sort-vars": "off",
			"space-before-blocks": "off",
			"space-before-function-paren": "off",
			"space-in-parens": "off",
			"space-infix-ops": "off",
			"space-unary-ops": "warn",
			"spaced-comment": "off",
			"strict": [
				"error",
				"never"
			],
			"switch-colon-spacing": "warn",
			"symbol-description": "error",
			"template-curly-spacing": "error",
			"template-tag-spacing": "error",
			"unicode-bom": [
				"error",
				"never"
			],
			"vars-on-top": "off",
			"wrap-iife": "off",
			// requires (/re/); nothing in the tree writes that
			"wrap-regex": "off",
			"yield-star-spacing": "error",
			"yoda": [
				"error",
				"never"
			],
			"prefer-const": "off"
		},
	},
];
