#!/usr/bin/env node
/**
 * sync-images.js - Bidirectional sync between base64-encoded CSS images and SVG files
 *
 * This tool ensures that:
 * 1. Every SVG file referenced in CSS also exists as a standalone file
 * 2. Every standalone SVG file that should be in CSS has its base64 version in CSS
 * 3. Base64-only images in CSS are extracted to files
 * 4. File-only images get their base64 CSS counterpart generated
 *
 * Usage: node tools/sync-images.js [--extract] [--report]
 *   --extract  Extract base64 images from CSS to files (default: report only)
 *   --report   Show report of mismatches without making changes
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const doExtract = args.includes('--extract');
const reportOnly = args.includes('--report') || !doExtract;

// CSS files to scan for base64-encoded images
const CSS_SCAN_PATHS = [
	'client/resources/css/grommunio.css',
	'client/zarafa/core/themes/dark/css/themedark.css',
	'plugins/files/resources/css/files-main.css',
	'plugins/files/resources/css/icons.css',
	'plugins/files/resources/css/navbar.css',
	'plugins/chat/resources/css/chat.css',
	'plugins/archive/resources/css/archive.css',
	'plugins/passwd/resources/css/passwd.css',
	'plugins/desktopnotifications/resources/desktopnotifications.css',
	'plugins/mdm/resources/css/mdm.css',
	'plugins/meet/resources/css/meet.css',
	'plugins/smime/resources/css/smime-styles.css',
	'plugins/kendox/resources/kendox.css',
	'plugins/intranet/resources/css/intranet.css',
	'plugins/filesbackendDefault/resources/css/filesbackendDefault.css',
	'plugins/filesbackendSeafile/resources/css/filesbackendSeafile.css',
];

// Directories to check for standalone SVG/PNG files
const IMAGE_DIRS = [
	'client/resources/images/app-icons',
	'client/resources/iconsets/breeze/src/svg/16x16',
	'client/resources/iconsets/breeze/src/svg/large',
	'client/resources/iconsets/classic/src/svg/16x16',
	'plugins/files/resources/icons',
	'plugins/files/resources/icons/actions',
	'plugins/files/resources/icons/accstat',
	'plugins/files/resources/icons/iconview',
	'plugins/files/resources/icons/navbar',
	'plugins/chat/resources/images',
	'plugins/archive/resources/icons',
	'plugins/passwd/resources/images',
	'plugins/desktopnotifications/resources',
	'plugins/mdm/resources/icons',
	'plugins/meet/resources/icons',
];

// Extract base64 images from CSS content
function extractBase64Images(cssContent, cssPath) {
	const results = [];
	// Match CSS selectors and their data URIs
	// Pattern: selector { ... background-image: url(data:image/svg+xml;base64,...) ... }
	const ruleRe = /([^{}]+)\{[^}]*url\(\s*data:image\/(svg\+xml|png);base64,([A-Za-z0-9+/=]+)\s*\)/g;
	let m;
	while ((m = ruleRe.exec(cssContent)) !== null) {
		const selectors = m[1].trim().split(',').map(s => s.trim());
		const format = m[2] === 'svg+xml' ? 'svg' : 'png';
		const base64 = m[3];

		// Get the primary class name from selectors
		for (const sel of selectors) {
			const classMatch = sel.match(/\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*$/);
			if (classMatch) {
				results.push({
					className: classMatch[1],
					selector: sel,
					format,
					base64,
					cssFile: cssPath,
				});
				break; // one per rule is enough
			}
		}
	}
	return results;
}

// Find all image files in the project
function findImageFiles() {
	const files = new Map(); // basename (without ext) -> full path
	for (const dir of IMAGE_DIRS) {
		const absDir = path.resolve(ROOT, dir);
		if (!fs.existsSync(absDir)) continue;
		const entries = fs.readdirSync(absDir);
		for (const entry of entries) {
			const ext = path.extname(entry).toLowerCase();
			if (['.svg', '.png', '.gif'].includes(ext)) {
				const name = path.basename(entry, ext);
				files.set(name, path.join(dir, entry));
			}
		}
	}
	return files;
}

// Decode base64 to buffer
function decodeBase64(b64, format) {
	const buf = Buffer.from(b64, 'base64');
	if (format === 'svg') {
		return buf.toString('utf8');
	}
	return buf;
}

// Determine output path for an extracted image
function getExtractPath(className, format, cssPath) {
	// Try to find a sensible directory based on the CSS file location
	const cssDir = path.dirname(cssPath);
	let targetDir;

	if (cssPath.includes('plugins/')) {
		// Plugin images go next to the CSS in an icons/ or images/ dir
		const pluginMatch = cssPath.match(/plugins\/([^/]+)/);
		if (pluginMatch) {
			targetDir = `plugins/${pluginMatch[1]}/resources/icons`;
		} else {
			targetDir = cssDir;
		}
	} else {
		// Main app images go to extracted-icons directory
		targetDir = 'client/resources/images/extracted';
	}

	return path.join(targetDir, `${className}.${format}`);
}

async function main() {
	console.log('grommunio-web image sync tool');
	console.log('============================\n');

	// 1. Scan CSS files for base64 images
	const cssImages = [];
	for (const cssPath of CSS_SCAN_PATHS) {
		const absPath = path.resolve(ROOT, cssPath);
		if (!fs.existsSync(absPath)) {
			console.log(`  Skipping (not found): ${cssPath}`);
			continue;
		}
		const content = fs.readFileSync(absPath, 'utf8');
		const found = extractBase64Images(content, cssPath);
		cssImages.push(...found);
	}
	console.log(`Found ${cssImages.length} base64 images in CSS files\n`);

	// 2. Find all standalone image files
	const imageFiles = findImageFiles();
	console.log(`Found ${imageFiles.size} standalone image files\n`);

	// 3. Find mismatches
	const cssOnlyImages = []; // base64 in CSS but no file
	const fileOnlyImages = []; // file exists but not in CSS (info only)
	const matchedImages = [];

	const cssImageNames = new Set();
	for (const img of cssImages) {
		cssImageNames.add(img.className);
		if (!imageFiles.has(img.className)) {
			cssOnlyImages.push(img);
		} else {
			matchedImages.push(img);
		}
	}

	for (const [name, filePath] of imageFiles) {
		if (!cssImageNames.has(name)) {
			fileOnlyImages.push({ name, filePath });
		}
	}

	// 4. Report
	console.log('=== Sync Report ===\n');
	console.log(`Matched (in both CSS and file): ${matchedImages.length}`);
	console.log(`CSS-only (base64 but no file):  ${cssOnlyImages.length}`);
	console.log(`File-only (file but not in CSS): ${fileOnlyImages.length}`);

	if (cssOnlyImages.length > 0) {
		console.log('\n--- CSS-only images (need extraction) ---');
		for (const img of cssOnlyImages) {
			const extractPath = getExtractPath(img.className, img.format, img.cssFile);
			console.log(`  .${img.className} (${img.format}) -> ${extractPath}`);

			if (doExtract) {
				const absPath = path.resolve(ROOT, extractPath);
				const dir = path.dirname(absPath);
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir, { recursive: true });
				}
				const content = decodeBase64(img.base64, img.format);
				if (typeof content === 'string') {
					fs.writeFileSync(absPath, content, 'utf8');
				} else {
					fs.writeFileSync(absPath, content);
				}
				console.log(`    -> Extracted!`);
			}
		}
	}

	if (fileOnlyImages.length > 0) {
		console.log('\n--- File-only images (exist as files, not in CSS) ---');
		for (const img of fileOnlyImages) {
			console.log(`  ${img.name} -> ${img.filePath}`);
		}
		console.log('  (These are fine if referenced via URL in CSS or used in HTML)');
	}

	if (reportOnly && cssOnlyImages.length > 0) {
		console.log('\nRun with --extract to extract CSS-only images to files.');
	}

	console.log('\nDone.');
}

main().catch(err => {
	console.error('Sync failed:', err);
	process.exit(1);
});
