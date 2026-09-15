#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Generates the bills of material, bom.json (CycloneDX 1.6) and
// bom.spdx.json (SPDX 2.3), from the sources that already describe our
// dependencies: package-lock.json, the composer trees vendored under
// plugins/, and tools/bom-vendored.json for the libraries we vendor by
// hand and which therefore carry no package manager metadata.
//
// Every component is either RUNTIME or BUILD. Runtime code is shipped in
// the deploy tree and executes for users, in the browser or on the PHP
// server; build code only runs to produce that tree. The two formats spell
// the distinction differently, so it is expressed twice: CycloneDX marks
// build-only components scope "excluded" (not part of the distributed
// artifact), SPDX relates them with BUILD_TOOL_OF instead of
// RUNTIME_DEPENDENCY_OF.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const RUNTIME = 'runtime';
const BUILD = 'build';

const pkg = readJSON('package.json');
const check = process.argv.includes('--check');
// --check regenerates with the version the committed BOM records, so a build
// that rewrote the version file does not fail the comparison.
let version = read('version').trim();
if (check && exists('bom.json')) {
	version = readJSON('bom.json').metadata?.component?.version ?? version;
}

// ── collect ─────────────────────────────────────────────────────────

const components = [];

function add(c) {
	// A component can legitimately arrive twice (the same composer package is
	// vendored under two plugins); keep the first and merge the paths.
	const key = `${c.type}|${c.name}|${c.version}`;
	const seen = components.find((o) => `${o.type}|${o.name}|${o.version}` === key);
	if (seen) {
		seen.paths = [...new Set([...(seen.paths || []), ...(c.paths || [])])];
		seen.direct = seen.direct || c.direct;
		// A curated runtime entry knows the shipped copy better than the lock file.
		const curated = c.scope === RUNTIME;
		if (curated) {
			seen.scope = RUNTIME;
		}
		for (const k of ['copyright', 'website', 'license']) {
			seen[k] = curated ? c[k] || seen[k] : seen[k] || c[k];
		}

		return;
	}
	components.push(c);
}

// npm: everything in the lock file. The Makefile runs terser, postcss,
// html-minifier-terser and svgo out of node_modules and copies none of it
// into $(DESTDIR); the packages esbuild bundles into the pgp plugin are
// flipped to runtime by their entries in tools/bom-vendored.json.
function collectNpm() {
	if (!exists('package-lock.json')) {
		return;
	}
	const lock = readJSON('package-lock.json');
	const root = lock.packages?.[''] ?? {};
	const direct = new Set([
		...Object.keys(root.dependencies ?? {}),
		...Object.keys(root.devDependencies ?? {}),
	]);
	for (const [key, entry] of Object.entries(lock.packages ?? {})) {
		if (!key.startsWith('node_modules/')) {
			continue;
		}
		const name = key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);
		add({
			type: 'library',
			ecosystem: 'npm',
			name,
			version: entry.version,
			license: entry.license,
			purl: `pkg:npm/${name.startsWith('@') ? '%40' + name.slice(1) : name}@${entry.version}`,
			scope: BUILD,
			direct: direct.has(name),
			paths: [],
		});
	}
}

// composer: the vendor trees are committed, so their code ships and runs.
function collectComposer() {
	const trees = [
		'plugins/files/php/vendor',
		'plugins/kendox/php/vendor',
		'plugins/files/php/Files/Backend/Webdav/sabredav/vendor',
	];
	for (const tree of trees) {
		const manifest = `${tree}/composer/installed.json`;
		if (!exists(manifest)) {
			continue;
		}
		const data = readJSON(manifest);
		for (const p of data.packages ?? data) {
			add({
				type: 'library',
				ecosystem: 'composer',
				name: p.name,
				version: (p.version ?? p.version_normalized ?? '').replace(/^v/, ''),
				license: Array.isArray(p.license) ? p.license.join(' OR ') : p.license,
				purl: `pkg:composer/${p.name}@${(p.version ?? '').replace(/^v/, '')}`,
				website: p.homepage ?? p.source?.url,
				scope: RUNTIME,
				direct: true,
				paths: [`${tree}/${p.name}`],
			});
		}
	}
}

// hand-vendored libraries and the external runtime requirements, neither of
// which any package manager knows about.
function collectCurated() {
	if (!exists('tools/bom-vendored.json')) {
		return;
	}
	for (const c of readJSON('tools/bom-vendored.json').components ?? []) {
		add({ direct: true, ...c });
	}
}

collectNpm();
collectComposer();
collectCurated();

const sortKey = (c) => `${c.ecosystem}|${c.name}|${c.version}`;
components.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));

// ── CycloneDX 1.6 ───────────────────────────────────────────────────

const bomRef = (c) => c.purl || `${c.ecosystem}:${c.name}@${c.version}`;

function cycloneDX() {
	return {
		bomFormat: 'CycloneDX',
		specVersion: '1.6',
		version: 1,
		metadata: {
			component: {
				'bom-ref': `pkg:generic/grommunio-web@${version}`,
				type: 'application',
				name: pkg.name,
				version,
				description: pkg.description,
				licenses: [{ license: { id: 'AGPL-3.0-or-later' } }],
				purl: `pkg:generic/grommunio-web@${version}`,
				externalReferences: [{ type: 'vcs', url: pkg.repository }],
			},
			tools: { components: [{ type: 'application', name: 'tools/build-bom.mjs' }] },
		},
		components: components.map((c) => ({
			'bom-ref': bomRef(c),
			type: c.type ?? 'library',
			name: c.name,
			version: c.version,
			...(c.description ? { description: c.description } : {}),
			// "excluded" is CycloneDX for "not part of the distributed artifact",
			// which is exactly what a build-only dependency is.
			scope: c.scope === BUILD ? 'excluded' : 'required',
			// CycloneDX has no NOASSERTION for licences; an absent field says the same.
			...(c.license && c.license !== 'NOASSERTION' ? { licenses: [licenseNode(c.license)] } : {}),
			...(c.copyright ? { copyright: c.copyright } : {}),
			...(c.purl ? { purl: c.purl } : {}),
			properties: [
				{ name: 'grommunio:dependencyScope', value: c.scope },
				{ name: 'grommunio:ecosystem', value: c.ecosystem },
				{ name: 'grommunio:direct', value: String(Boolean(c.direct)) },
				...(c.paths ?? []).map((p) => ({ name: 'grommunio:path', value: p })),
			],
			...(c.website ? { externalReferences: [{ type: 'website', url: c.website }] } : {}),
		})),
		dependencies: [
			{
				ref: `pkg:generic/grommunio-web@${version}`,
				dependsOn: components.filter((c) => c.direct).map(bomRef),
			},
		],
	};
}

// A licence field is either an SPDX id or free text; CycloneDX wants those
// in different keys, and an expression in a third.
const SPDX_ID = /^[A-Za-z0-9.+-]+$/;
function licenseNode(value) {
	if (/ (OR|AND|WITH) /.test(value)) {
		return { expression: value };
	}

	return SPDX_ID.test(value) ? { license: { id: value } } : { license: { name: value } };
}

// ── SPDX 2.3 ────────────────────────────────────────────────────────

const spdxId = (c) => 'SPDXRef-' + `${c.ecosystem}-${c.name}-${c.version}`.replace(/[^A-Za-z0-9.-]/g, '-');

function spdx() {
	const rootId = 'SPDXRef-Package-grommunio-web';
	const packages = [
		{
			SPDXID: rootId,
			name: pkg.name,
			versionInfo: version,
			downloadLocation: pkg.repository ?? 'NOASSERTION',
			filesAnalyzed: false,
			licenseConcluded: 'AGPL-3.0-or-later',
			licenseDeclared: 'AGPL-3.0-or-later',
			copyrightText: 'Copyright 2020 - 2026 grommunio GmbH',
		},
		...components.map((c) => ({
			SPDXID: spdxId(c),
			name: c.name,
			versionInfo: c.version || 'NOASSERTION',
			downloadLocation: c.website ?? 'NOASSERTION',
			filesAnalyzed: false,
			licenseConcluded: c.license || 'NOASSERTION',
			licenseDeclared: c.license || 'NOASSERTION',
			copyrightText: c.copyright || 'NOASSERTION',
			...(c.purl
				? { externalRefs: [{ referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: c.purl }] }
				: {}),
		})),
	];

	return {
		spdxVersion: 'SPDX-2.3',
		dataLicense: 'CC0-1.0',
		SPDXID: 'SPDXRef-DOCUMENT',
		name: `${pkg.name}-${version}`,
		documentNamespace: `https://github.com/grommunio/grommunio-web/spdx/${version}-${stableId()}`,
		creationInfo: {
			created: buildTimestamp(),
			creators: ['Tool: tools/build-bom.mjs', 'Organization: grommunio GmbH'],
		},
		packages,
		relationships: [
			{ spdxElementId: 'SPDXRef-DOCUMENT', relationshipType: 'DESCRIBES', relatedSpdxElement: rootId },
			...components.map((c) => ({
				spdxElementId: spdxId(c),
				// SPDX spells the runtime/build split as two relationship types.
				relationshipType: c.scope === BUILD ? 'BUILD_TOOL_OF' : 'RUNTIME_DEPENDENCY_OF',
				relatedSpdxElement: rootId,
			})),
		],
	};
}

// The document namespace has to be unique per document but must not churn on
// every run, or the BOM would never compare equal to the committed one. Derive
// it from the content instead of a clock.
function stableId() {
	return crypto.createHash('sha256').update(JSON.stringify(components)).digest('hex').slice(0, 16);
}

// Honour SOURCE_DATE_EPOCH so a package build is reproducible.
function buildTimestamp() {
	const epoch = process.env.SOURCE_DATE_EPOCH;
	const date = epoch ? new Date(Number(epoch) * 1000) : new Date();

	return date.toISOString().replace(/\.\d+Z$/, 'Z');
}

// ── write ───────────────────────────────────────────────────────────

const outputs = [
	['bom.json', cycloneDX()],
	['bom.spdx.json', spdx()],
];
const render = (doc) => JSON.stringify(doc, null, '\t') + '\n';
const volatile = (s) => s.replace(/"(created|timestamp)": "[^"]*"/g, '"$1": ""');
if (check) {
	let stale = 0;
	for (const [name, doc] of outputs) {
		if (!exists(name) || volatile(read(name)) !== volatile(render(doc))) {
			console.error(`${name} is out of date, run 'make bom'`);
			stale = 1;
		}
	}
	if (!stale) {
		console.log('BOMs are up to date');
	}
	process.exit(stale);
}
for (const [name, doc] of outputs) {
	fs.writeFileSync(path.join(ROOT, name), render(doc));
	console.log(`Written: ${name} (${components.length} components)`);
}

const runtime = components.filter((c) => c.scope === RUNTIME).length;
console.log(`  runtime: ${runtime}   build: ${components.length - runtime}`);
