#!/usr/bin/env node
// Writes <file>.br and <file>.gz next to static assets for nginx
// brotli_static/gzip_static and removes stale or orphaned ones.
// Usage: precompress.mjs [--ext list] [--formats br,gz] [--min-size n] [--jobs n] [--skip regex] [--force] <dir>...
import { readdirSync, statSync, readFileSync, writeFileSync, unlinkSync, renameSync } from "node:fs";
import { join, extname } from "node:path";
import os from "node:os";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const DEFAULT_EXT = "js,mjs,css,map,json,svg,webmanifest,wasm,html,ftl";

function parseArgs(argv) {
	const o = { ext: DEFAULT_EXT, formats: "br,gz", min: 512, jobs: os.availableParallelism?.() ?? os.cpus().length, force: false, quiet: false, dirs: [], skip: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--ext") o.ext = argv[++i];
		else if (a === "--formats") o.formats = argv[++i];
		else if (a === "--min-size") o.min = Number(argv[++i]);
		else if (a === "--jobs") o.jobs = Number(argv[++i]);
		else if (a === "--skip") o.skip.push(new RegExp(argv[++i]));
		else if (a === "--force") o.force = true;
		else if (a === "--quiet") o.quiet = true;
		else if (a.startsWith("-")) throw new Error("unknown option " + a);
		else o.dirs.push(a);
	}
	if (!o.dirs.length) throw new Error("usage: precompress.mjs [options] <dir>...");
	o.exts = new Set(o.ext.split(",").map(e => "." + e.trim()));
	o.br = o.formats.includes("br");
	o.gz = o.formats.includes("gz");
	return o;
}

function walk(dir, out) {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (e.isFile()) out.push(p);
	}
	return out;
}

function writeAtomic(path, data) {
	const tmp = path + ".tmp";
	writeFileSync(tmp, data);
	renameSync(tmp, path);
}

function compress(file, doBr, doGz) {
	const src = readFileSync(file);
	const br = doBr ? zlib.brotliCompressSync(src, { params: {
		[zlib.constants.BROTLI_PARAM_QUALITY]: 11,
		[zlib.constants.BROTLI_PARAM_LGWIN]: 24,
		[zlib.constants.BROTLI_PARAM_SIZE_HINT]: src.length,
	} }) : null;
	const gz = doGz ? zlib.gzipSync(src, { level: 9 }) : null;
	return { src, br, gz };
}

if (!isMainThread) {
	const { files, doBr, doGz } = workerData;
	const stats = [];
	for (const f of files) {
		const r = compress(f, doBr, doGz);
		// a sibling larger than the source is worse than runtime compression
		const keepBr = doBr && r.br.length < r.src.length;
		const keepGz = doGz && r.gz.length < r.src.length;
		if (keepBr) writeAtomic(f + ".br", r.br); else try { unlinkSync(f + ".br"); } catch {}
		if (keepGz) writeAtomic(f + ".gz", r.gz); else try { unlinkSync(f + ".gz"); } catch {}
		stats.push({ raw: r.src.length, br: keepBr ? r.br.length : 0, gz: keepGz ? r.gz.length : 0 });
	}
	parentPort.postMessage(stats);
} else {
	const o = parseArgs(process.argv.slice(2));
	const t0 = performance.now();
	const all = [];
	for (const d of o.dirs) walk(d, all);
	const byPath = new Map(all.map(p => [p, statSync(p)]));
	const isCandidate = p => o.exts.has(extname(p)) && byPath.get(p).size >= o.min && !o.skip.some(re => re.test(p));
	let removed = 0, fresh = 0;
	const todo = [];
	for (const p of all) {
		if (p.endsWith(".br.tmp") || p.endsWith(".gz.tmp")) { unlinkSync(p); continue; }
		if (p.endsWith(".br") || p.endsWith(".gz")) {
			const base = p.slice(0, -3);
			const wanted = p.endsWith(".br") ? o.br : o.gz;
			if (!wanted || !byPath.has(base) || !isCandidate(base)) { unlinkSync(p); removed++; }
			continue;
		}
		if (!isCandidate(p)) continue;
		const br = byPath.get(p + ".br"), gz = byPath.get(p + ".gz");
		const m = byPath.get(p).mtimeMs;
		const brOk = !o.br || (br && br.mtimeMs >= m), gzOk = !o.gz || (gz && gz.mtimeMs >= m);
		if (!o.force && brOk && gzOk) { fresh++; continue; }
		todo.push(p);
	}
	// largest first so the run does not end on one big file
	todo.sort((a, b) => byPath.get(b).size - byPath.get(a).size);
	const jobs = Math.max(1, Math.min(o.jobs, todo.length));
	const buckets = Array.from({ length: jobs }, () => []);
	todo.forEach((p, i) => buckets[i % jobs].push(p));
	const results = await Promise.all(buckets.map(files => new Promise((res, rej) => {
		const w = new Worker(fileURLToPath(import.meta.url), { workerData: { files, doBr: o.br, doGz: o.gz } });
		w.once("message", res);
		w.once("error", rej);
	})));
	const stats = results.flat();
	const sum = k => stats.reduce((a, s) => a + s[k], 0);
	if (!o.quiet) {
		const mb = n => (n / 1048576).toFixed(2) + " MB";
		console.log(`precompress: ${stats.length} files (${fresh} up to date, ${removed} stale removed), ` +
			`${mb(sum("raw"))} -> br ${mb(sum("br"))} / gz ${mb(sum("gz"))}, ${((performance.now() - t0) / 1000).toFixed(1)}s`);
	}
}
