import {build} from 'esbuild';
import {copyFile, mkdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'plugins/pgp/resources/vendor');
const versions = {openpgp: '6.3.1', 'postal-mime': '2.7.5', fflate: '0.8.3'};
for (const [name, expected] of Object.entries(versions)) {
	const found = JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
	if (found !== expected) {
		throw new Error(`Expected pinned ${name}@${expected}; run npm ci.`);
	}
}
await mkdir(output, {recursive: true});
await build({
	absWorkingDir: root,
	entryPoints: ['plugins/pgp/js/crypto/vendor.mjs'],
	outfile: path.join(output, 'pgp-vendor.js'),
	bundle: true, minify: true, platform: 'browser', format: 'iife', target: ['es2020'],
	legalComments: 'linked', sourcemap: false,
	banner: {js: '/* Local dependencies: OpenPGP.js 6.3.1 (LGPL-3.0+), postal-mime 2.7.5 (MIT), fflate 0.8.3 (MIT). See accompanying license files. */'}
});
await copyFile(path.join(root, 'node_modules/openpgp/LICENSE'), path.join(output, 'openpgp.LICENSE'));
await copyFile(path.join(root, 'node_modules/postal-mime/LICENSE.txt'), path.join(output, 'postal-mime.LICENSE'));
await copyFile(path.join(root, 'node_modules/fflate/LICENSE'), path.join(output, 'fflate.LICENSE'));
