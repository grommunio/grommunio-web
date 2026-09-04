import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Appends ?v=<content hash> to every local url() so images and fonts can be
// cached for a long time yet never go stale after an upgrade
const URL_RE = /url\((\s*)(["']?)([^"')]+)\2(\s*)\)/g;

const plugin = () => ({
	postcssPlugin: 'asset-version',
	Declaration(decl, { result }) {
		if (!decl.value.includes('url(') || !result.opts.from) {
			return;
		}
		const base = dirname(result.opts.from);
		decl.value = decl.value.replace(URL_RE, (match, s1, quote, url, s2) => {
			if (/^(data:|https?:|\/\/|#)/.test(url) || url.includes('?')) {
				return match;
			}
			const [file, fragment] = url.split('#');
			let hash;
			try {
				hash = createHash('md5').update(readFileSync(resolve(base, file))).digest('hex').slice(0, 8);
			} catch {
				return match;
			}
			return `url(${s1}${quote}${file}?v=${hash}${fragment === undefined ? '' : '#' + fragment}${quote}${s2})`;
		});
	},
});
plugin.postcss = true;

export default plugin;
