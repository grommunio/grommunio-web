#!/usr/bin/env node
/**
 * build-icons.js - Icon build pipeline for grommunio-web
 *
 * Scans SVG icon sources, classifies them as monochrome or colored,
 * optimizes with SVGO, and generates CSS files using mask-image for
 * monochrome icons (so they follow CSS `color`) and background-image
 * for colored icons.
 *
 * Usage: node tools/build-icons.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');
const { glob } = require('glob');

// ── Project root ──────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');

// ── Source directories ────────────────────────────────────────────────
const ICON_SOURCES = [
	{
		id: 'app-icons',
		dirs: ['client/resources/images/app-icons'],
		extensionFiles: ['client/resources/images/app-icons.extensions.json'],
		output: null, // goes into the main CSS
	},
	{
		id: 'breeze',
		dirs: [
			'client/resources/iconsets/breeze/src/svg/16x16',
			'client/resources/iconsets/breeze/src/svg/large',
		],
		extensionFiles: [
			'client/resources/iconsets/extensions.json',
			'client/resources/iconsets/breeze/extensions-breeze.json',
		],
		output: null,
	},
];

const PLUGIN_GLOB = 'plugins/*/resources/icons/*.svg';

const OUTPUT_MAIN = 'client/resources/css/icon-masks.css';
const OUTPUT_PLUGINS = 'client/resources/css/plugin-icons.css';

// ── SVGO configuration ───────────────────────────────────────────────
const SVGO_CONFIG = {
	multipass: true,
	plugins: [
		{
			name: 'preset-default',
			params: {
				overrides: {
					// Keep viewBox for proper scaling
					removeViewBox: false,
					// Don't remove xmlns - needed for data URIs
					removeXMLNS: false,
				},
			},
		},
		// Remove comments, metadata, editor data
		'removeComments',
		'removeMetadata',
		'removeEditorsNSData',
	],
};

// ── Fill colors considered monochrome ────────────────────────────────
const MONOCHROME_FILLS = new Set([
	'#000',
	'#000000',
	'#212121',
	'currentcolor',
	'currentColor',
	'none',
]);

// Some icons use very dark grays that are effectively monochrome UI icons.
// We treat single-dark-color fills as monochrome too.
function isMonochromeFill(fill) {
	if (!fill) return true;
	const lower = fill.toLowerCase().trim();
	if (MONOCHROME_FILLS.has(lower)) return true;
	// Treat "none" as not a color contribution
	if (lower === 'none') return true;
	return false;
}

// ── Classify an SVG as monochrome or colored ─────────────────────────
// Extracts all fill= attribute values and fill from style attributes.
// If every meaningful fill is in the monochrome set, it's monochrome.
function classifySvg(svgContent) {
	const fills = new Set();

	// Match fill="..." attributes (not inside <style> blocks)
	const fillAttrRe = /\bfill\s*=\s*["']([^"']+)["']/gi;
	let m;
	while ((m = fillAttrRe.exec(svgContent)) !== null) {
		const val = m[1].trim();
		if (val.toLowerCase() !== 'none') {
			fills.add(val);
		}
	}

	// Match fill: ... in inline style attributes
	const styleFillRe = /\bfill\s*:\s*([^;"']+)/gi;
	while ((m = styleFillRe.exec(svgContent)) !== null) {
		const val = m[1].trim();
		if (val.toLowerCase() !== 'none') {
			fills.add(val);
		}
	}

	// If no explicit fills found, treat as monochrome (defaults to black)
	if (fills.size === 0) {
		return 'monochrome';
	}

	// Check if all fills are in the monochrome set
	for (const fill of fills) {
		if (!isMonochromeFill(fill)) {
			return 'colored';
		}
	}

	return 'monochrome';
}

// ── Convert monochrome SVG fills to currentColor ─────────────────────
function convertToCurrentColor(svgContent) {
	// Replace fill attribute values that are monochrome dark colors with currentColor
	let result = svgContent.replace(
		/(\bfill\s*=\s*["'])([^"']+)(["'])/gi,
		(match, pre, val, post) => {
			const lower = val.trim().toLowerCase();
			if (lower === 'none' || lower === 'currentcolor') {
				return match; // leave as-is
			}
			if (MONOCHROME_FILLS.has(lower)) {
				return pre + 'currentColor' + post;
			}
			return match;
		}
	);

	// Replace fill in inline styles
	result = result.replace(
		/(\bfill\s*:\s*)([^;"']+)/gi,
		(match, pre, val) => {
			const lower = val.trim().toLowerCase();
			if (lower === 'none' || lower === 'currentcolor') {
				return match;
			}
			if (MONOCHROME_FILLS.has(lower)) {
				return pre + 'currentColor';
			}
			return match;
		}
	);

	return result;
}

// ── Optimize SVG with SVGO ───────────────────────────────────────────
function optimizeSvg(svgContent, filePath) {
	try {
		const result = optimize(svgContent, {
			...SVGO_CONFIG,
			path: filePath,
		});
		return result.data;
	} catch (err) {
		console.warn(`  Warning: SVGO failed for ${filePath}: ${err.message}`);
		return svgContent;
	}
}

// ── Encode SVG as base64 data URI ────────────────────────────────────
function svgToBase64DataUri(svgContent) {
	return 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
}

// ── Derive CSS class name from file path ─────────────────────────────
// e.g. "icon_mail_read.svg" -> ".icon_mail_read"
//      "arrow_down_s.svg"   -> ".arrow_down_s"
function classNameFromFile(filePath) {
	const base = path.basename(filePath, '.svg');
	return '.' + base;
}

// ── Load extension mapping JSON ──────────────────────────────────────
function loadExtensions(extFile) {
	const absPath = path.resolve(ROOT, extFile);
	if (!fs.existsSync(absPath)) {
		console.warn(`  Warning: Extension file not found: ${extFile}`);
		return {};
	}
	try {
		const raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
		// Filter out comment-like keys (e.g. keys with "=" or descriptive text)
		const result = {};
		for (const [key, value] of Object.entries(raw)) {
			if (key.startsWith('.')) {
				result[key] = value;
			}
		}
		return result;
	} catch (err) {
		console.warn(`  Warning: Failed to parse ${extFile}: ${err.message}`);
		return {};
	}
}

// ── Collect all SVG files from a directory ───────────────────────────
function collectSvgFiles(dir) {
	const absDir = path.resolve(ROOT, dir);
	if (!fs.existsSync(absDir)) {
		console.warn(`  Warning: Directory not found: ${dir}`);
		return [];
	}
	return fs.readdirSync(absDir)
		.filter(f => f.endsWith('.svg'))
		.map(f => path.join(absDir, f));
}

// ── Generate CSS rule for a single icon ──────────────────────────────
function generateCssRule(className, dataUri, type) {
	if (type === 'monochrome') {
		return [
			`${className} {`,
			`  -webkit-mask-image: url(${dataUri});`,
			`  mask-image: url(${dataUri});`,
			`  -webkit-mask-repeat: no-repeat;`,
			`  mask-repeat: no-repeat;`,
			`  -webkit-mask-position: center center;`,
			`  mask-position: center center;`,
			`  -webkit-mask-size: contain;`,
			`  mask-size: contain;`,
			`  background-color: currentColor;`,
			`  background-image: none !important;`,
			`}`,
		].join('\n');
	}

	// colored
	return [
		`${className} {`,
		`  background-image: url(${dataUri}) !important;`,
		`  background-repeat: no-repeat !important;`,
		`  background-position: center center !important;`,
		`  background-size: contain;`,
		`}`,
	].join('\n');
}

// ── Generate alias selectors from extension mappings ─────────────────
// An extension maps a source selector (e.g. ".icon_mail_read") to one
// or more alias selectors. We emit rules that copy the same style.
function generateAliasRules(extensions, processedIcons) {
	const rules = [];

	for (const [source, aliases] of Object.entries(extensions)) {
		const iconInfo = processedIcons.get(source);
		if (!iconInfo) continue;

		const aliasList = Array.isArray(aliases) ? aliases : [aliases];
		for (const alias of aliasList) {
			rules.push(generateCssRule(alias, iconInfo.dataUri, iconInfo.type));
		}
	}

	return rules;
}

// ── Process a set of icon sources ────────────────────────────────────
function processIconSource(source) {
	const processedIcons = new Map(); // className -> { dataUri, type }
	const cssRules = [];
	let monoCount = 0;
	let colorCount = 0;

	for (const dir of source.dirs) {
		const files = collectSvgFiles(dir);
		console.log(`  ${dir}: ${files.length} SVG files`);

		for (const filePath of files) {
			const className = classNameFromFile(filePath);
			let svgContent = fs.readFileSync(filePath, 'utf8');

			// Classify
			const type = classifySvg(svgContent);

			// For monochrome: convert fills to currentColor
			if (type === 'monochrome') {
				svgContent = convertToCurrentColor(svgContent);
				monoCount++;
			} else {
				colorCount++;
			}

			// Optimize with SVGO
			const optimized = optimizeSvg(svgContent, filePath);

			// Write optimized SVG back
			fs.writeFileSync(filePath, optimized, 'utf8');

			// Generate data URI and CSS
			const dataUri = svgToBase64DataUri(optimized);
			const rule = generateCssRule(className, dataUri, type);
			cssRules.push(rule);

			processedIcons.set(className, { dataUri, type });
		}
	}

	// Process extension/alias mappings
	const allExtensions = {};
	for (const extFile of source.extensionFiles) {
		Object.assign(allExtensions, loadExtensions(extFile));
	}

	const aliasRules = generateAliasRules(allExtensions, processedIcons);
	cssRules.push(...aliasRules);

	console.log(`  Classified: ${monoCount} monochrome, ${colorCount} colored`);
	console.log(`  Extension aliases: ${aliasRules.length} rules`);

	return { cssRules, processedIcons };
}

// ── Process plugin icons ─────────────────────────────────────────────
async function processPluginIcons() {
	const cssRules = [];
	let monoCount = 0;
	let colorCount = 0;

	const files = await glob(PLUGIN_GLOB, { cwd: ROOT, absolute: false });
	console.log(`\nPlugin icons: ${files.length} SVG files`);

	for (const relPath of files) {
		const filePath = path.resolve(ROOT, relPath);
		const className = classNameFromFile(filePath);

		// Prefix plugin icons with the plugin name for namespacing
		const parts = relPath.split(path.sep);
		// parts: [ 'plugins', '<name>', 'resources', 'icons', 'file.svg' ]
		const pluginName = parts[1] || 'unknown';
		const namespacedClass = `.plugin_${pluginName}_${path.basename(filePath, '.svg')}`;

		let svgContent = fs.readFileSync(filePath, 'utf8');

		const type = classifySvg(svgContent);

		if (type === 'monochrome') {
			svgContent = convertToCurrentColor(svgContent);
			monoCount++;
		} else {
			colorCount++;
		}

		const optimized = optimizeSvg(svgContent, filePath);
		fs.writeFileSync(filePath, optimized, 'utf8');

		const dataUri = svgToBase64DataUri(optimized);

		// Emit rule for both the bare filename class and namespaced class
		cssRules.push(generateCssRule(className, dataUri, type));
		if (namespacedClass !== className) {
			cssRules.push(generateCssRule(namespacedClass, dataUri, type));
		}
	}

	console.log(`  Classified: ${monoCount} monochrome, ${colorCount} colored`);

	return cssRules;
}

// ── Write CSS output file ────────────────────────────────────────────
function writeCssFile(outputPath, rules, header) {
	const absPath = path.resolve(ROOT, outputPath);
	const dir = path.dirname(absPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const content = [
		`/* ${header} */`,
		`/* Generated by tools/build-icons.js — do not edit manually */`,
		`/*`,
		` * Monochrome icons use CSS mask-image so they follow the CSS \`color\` property.`,
		` * This enables automatic light/dark mode support via CSS custom properties.`,
		` * Colored icons use regular background-image to preserve their original colors.`,
		` */`,
		'',
		...rules,
		'',
	].join('\n');

	fs.writeFileSync(absPath, content, 'utf8');
	console.log(`\nWritten: ${outputPath} (${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
	console.log('grommunio-web icon build pipeline');
	console.log('=================================\n');

	const allMainRules = [];

	// Process main icon sources
	for (const source of ICON_SOURCES) {
		console.log(`Processing: ${source.id}`);
		const { cssRules } = processIconSource(source);
		allMainRules.push(`\n/* ── ${source.id} ${'─'.repeat(60 - source.id.length)} */\n`);
		allMainRules.push(...cssRules);
	}

	// Write main CSS
	writeCssFile(OUTPUT_MAIN, allMainRules, 'grommunio-web Icon Masks');

	// Process plugin icons
	const pluginRules = await processPluginIcons();
	if (pluginRules.length > 0) {
		writeCssFile(OUTPUT_PLUGINS, pluginRules, 'grommunio-web Plugin Icons');
	} else {
		console.log('\nNo plugin icons found — skipping plugin-icons.css');
	}

	console.log('\nDone.');
}

main().catch(err => {
	console.error('Build failed:', err);
	process.exit(1);
});
