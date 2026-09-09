/* RFC 3156 framing. Never decode and reserialize the bytes being verified. */
(function(root, factory) {
	'use strict';
	if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('./BrowserCrypto.js'));
	} else {
		root.Zarafa.plugins.pgp.crypto.PgpMime = factory(root.Zarafa.plugins.pgp.crypto.BrowserCrypto);
	}
})(typeof globalThis !== 'undefined' ? globalThis : this, function(Crypto) {
	'use strict';
	var LIMIT = 100 * 1024 * 1024;
	function invalid(message) { throw new Error(message || 'Invalid OpenPGP MIME entity.'); }
	function binary(value) {
		if (!(value instanceof Uint8Array) || value.length > LIMIT) { invalid('MIME input must be a bounded byte array.'); }
		return Crypto.binaryString(value);
	}
	function split(value) {
		var match = /\r?\n\r?\n/.exec(value);
		if (!match || match.index > 65536) { invalid('MIME headers are missing or too large.'); }
		return [value.slice(0, match.index), value.slice(match.index + match[0].length)];
	}
	function headers(value) {
		if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|\r(?!\n)/.test(value)) { invalid('Invalid MIME header control character.'); }
		var result = Object.create(null);
		value.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach(function(line) {
			var match = /^([!-9;-~]+):[ \t]*(.*)$/.exec(line);
			if (!match) { invalid('Malformed MIME header.'); }
			var name = match[1].toLowerCase();
			if (result[name] !== undefined && ['content-type', 'content-transfer-encoding'].includes(name)) { invalid('Ambiguous MIME headers.'); }
			result[name] = match[2];
		});
		return result;
	}
	function token(value) { return !!value && !/[\x00-\x20\x7f-\xff()<>@,;:\\"/\[\]?=]/.test(value); }
	function contentType(value) {
		if (/[\x00-\x08\x0a-\x1f\x7f]/.test(value)) { invalid('Invalid MIME content type.'); }
		var semicolon = value.indexOf(';');
		var type = (semicolon < 0 ? value : value.slice(0, semicolon)).trim().toLowerCase();
		var types = type.split('/');
		if (types.length !== 2 || !types.every(token)) { invalid('Malformed MIME content type.'); }
		var params = Object.create(null), offset = semicolon < 0 ? value.length : semicolon;
		function whitespace() { while (offset < value.length && /[ \t]/.test(value[offset])) { offset++; } }
		while (offset < value.length) {
			if (value[offset++] !== ';') { invalid('Malformed MIME parameter.'); }
			whitespace();
			var start = offset;
			while (offset < value.length && !/[=; \t]/.test(value[offset])) { offset++; }
			var name = value.slice(start, offset).toLowerCase();
			whitespace();
			if (!token(name) || value[offset++] !== '=' || params[name] !== undefined) { invalid('Malformed or duplicate MIME parameter.'); }
			whitespace();
			var parameter = '';
			if (value[offset] === '"') {
				offset++;
				var closed = false;
				while (offset < value.length) {
					var character = value[offset++];
					if (character === '"') { closed = true; break; }
					if (character === '\\') { if (offset >= value.length) { break; } character = value[offset++]; }
					parameter += character;
				}
				if (!closed) { invalid('Unclosed MIME quoted parameter.'); }
			} else {
				start = offset;
				while (offset < value.length && !/[; \t]/.test(value[offset])) { offset++; }
				parameter = value.slice(start, offset);
				if (!token(parameter)) { invalid('Malformed MIME parameter value.'); }
			}
			whitespace();
			params[name] = parameter;
		}
		return {type: type, params: params};
	}
	function boundary() {
		return '=_grommunio_pgp_' + Array.from(globalThis.crypto.getRandomValues(new Uint8Array(18)), function(byte) { return byte.toString(16).padStart(2, '0'); }).join('');
	}
	function decode(value, encoding) {
		switch (encoding.trim().toLowerCase()) {
			case 'base64': return Crypto.binaryString(Crypto.fromBase64(value.replace(/[ \t\r\n]/g, '')));
			case 'quoted-printable':
				if (/=(?![a-fA-F0-9]{2}|\r?\n)/.test(value)) { invalid('Invalid MIME quoted-printable encoding.'); }
				return value.replace(/=\r?\n/g, '').replace(/=([a-fA-F0-9]{2})/g, function(match, hex) { return String.fromCharCode(parseInt(hex, 16)); });
			case '7bit': case '8bit': case 'binary': return value;
			default: invalid('Unsupported MIME transfer encoding.');
		}
	}
	function kind(parsed) {
		var protocol = (parsed.params.protocol || '').toLowerCase();
		if (parsed.type === 'multipart/encrypted' && protocol === 'application/pgp-encrypted') { return 'encrypted'; }
		if (parsed.type === 'multipart/signed' && protocol === 'application/pgp-signature') { return 'signed'; }
		return 'plain';
	}
	function assertEntity(value) {
		var map = headers(split(value)[0]);
		Object.keys(map).forEach(function(name) {
			if (name !== 'mime-version' && !name.startsWith('content-')) { invalid('SMTP envelope headers are not allowed inside outgoing protected MIME.'); }
		});
		var parsed = contentType(map['content-type'] || 'text/plain');
		if (PgpMime.isSmimeType(parsed)) { invalid('S/MIME and OpenPGP cannot protect the same message.'); }
	}
	var PgpMime = {
		/** SEND canonicalization only. Incoming entities MUST pass false. */
		entity: function(input, canonicalize) {
			var value = binary(input);
			if (canonicalize !== false) { value = value.replace(/\r\n|\r|\n/g, '\r\n').replace(/[ \t]+(?=\r\n|$)/g, ''); }
			var sections = split(value);
			headers(sections[0]);
			var content = sections[0].split(/\r?\n(?![ \t])/).filter(function(line) { return /^Content-[A-Za-z-]+:/i.test(line); });
			if (!content.length) { content.push('Content-Type: text/plain; charset=utf-8'); }
			var result = content.join('\r\n') + '\r\n\r\n' + sections[1];
			assertEntity(result);
			return Crypto.fromBinaryString(result);
		},
		contentType: function(input) { return contentType(headers(split(binary(input))[0])['content-type'] || 'text/plain'); },
		parseContentType: contentType,
		isSmimeType: function(parsed) {
			return /^(?:application\/(?:x-)?pkcs7-(?:mime|signature))$/.test(parsed.type) ||
				(parsed.type === 'multipart/signed' && /^(?:application\/(?:x-)?pkcs7-signature)$/.test((parsed.params.protocol || '').toLowerCase()));
		},
		signed: function(entity, signature, micalg) {
			var value = binary(entity);
			assertEntity(value);
			micalg = micalg || 'pgp-sha256';
			if (!/^pgp-(?:sha256|sha384|sha512|sha3-256|sha3-512)$/.test(micalg)) { invalid('Unsupported OpenPGP signature digest.'); }
			if (typeof signature !== 'string' || !signature.trim().startsWith('-----BEGIN PGP SIGNATURE-----') || signature.length > 10 * 1024 * 1024) { invalid('Invalid OpenPGP signature armor.'); }
			var separator = boundary();
			return Crypto.fromBinaryString('Content-Type: multipart/signed; protocol="application/pgp-signature";\r\n' +
				' micalg=' + micalg + '; boundary="' + separator + '"\r\n\r\n--' + separator + '\r\n' + value + '\r\n--' + separator + '\r\n' +
				'Content-Type: application/pgp-signature; name="signature.asc"\r\n' +
				'Content-Description: OpenPGP digital signature\r\nContent-Disposition: attachment; filename="signature.asc"\r\n\r\n' +
				signature + '\r\n--' + separator + '--\r\n');
		},
		encrypted: function(ciphertext) {
			if (typeof ciphertext !== 'string' || !ciphertext.trim().startsWith('-----BEGIN PGP MESSAGE-----') || ciphertext.length > LIMIT) { invalid('Invalid OpenPGP message armor.'); }
			var separator = boundary();
			return Crypto.fromBinaryString('Content-Type: multipart/encrypted; protocol="application/pgp-encrypted";\r\n boundary="' + separator + '"\r\n\r\n' +
				'--' + separator + '\r\nContent-Type: application/pgp-encrypted\r\n\r\nVersion: 1\r\n' +
				'--' + separator + '\r\nContent-Type: application/octet-stream; name="encrypted.asc"\r\n' +
				'Content-Disposition: inline; filename="encrypted.asc"\r\n\r\n' + ciphertext + '\r\n--' + separator + '--\r\n');
		},
		parse: function(input) {
			var value = binary(input), sections = split(value), map = headers(sections[0]);
			var parsed = contentType(map['content-type'] || 'text/plain'), type = kind(parsed);
			if (PgpMime.isSmimeType(parsed)) { return {type: 'smime', kind: 'smime', entity: input}; }
			if (type === 'plain') { return {type: 'plain', kind: 'plain', entity: input}; }
			var separator = parsed.params.boundary;
			if (!separator || separator.length > 70 || !/^[0-9A-Za-z'()+_,.\/:=? -]*[0-9A-Za-z'()+_,.\/:=?-]$/.test(separator)) { invalid('Invalid OpenPGP multipart boundary.'); }
			if (map['content-transfer-encoding'] && !['7bit', '8bit', 'binary'].includes(map['content-transfer-encoding'].toLowerCase())) { invalid('Invalid OpenPGP multipart transfer encoding.'); }
			var pattern = new RegExp('^--' + separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(--)?[ \\t]*(?:\\r?\\n|$)', 'gm');
			var matches = [], match;
			while ((match = pattern.exec(sections[1])) !== null) {
				matches.push(match);
				if (matches.length > 3) { invalid('OpenPGP multipart must contain exactly two parts.'); }
			}
			if (matches.length !== 3 || matches[0][1] || matches[1][1] || matches[2][1] !== '--') { invalid('OpenPGP multipart must contain exactly two parts.'); }
			var parts = [0, 1].map(function(index) { return sections[1].slice(matches[index].index + matches[index][0].length, matches[index + 1].index).replace(/\r?\n$/, ''); });
			var second = split(parts[1]), secondHeaders = headers(second[0]), secondType = contentType(secondHeaders['content-type'] || '').type;
			var decoded = decode(second[1], secondHeaders['content-transfer-encoding'] || '7bit');
			if (type === 'signed') {
				if (secondType !== 'application/pgp-signature') { invalid('Missing OpenPGP signature MIME part.'); }
				return {type: type, kind: type, entity: Crypto.fromBinaryString(parts[0]), signature: decoded, micalg: parsed.params.micalg || ''};
			}
			var first = split(parts[0]), firstHeaders = headers(first[0]), firstType = contentType(firstHeaders['content-type'] || '').type;
			var version = decode(first[1], firstHeaders['content-transfer-encoding'] || '7bit');
			if (firstType !== 'application/pgp-encrypted' || !/^Version:\s*1\s*$/i.test(version.trim()) || secondType !== 'application/octet-stream') { invalid('Invalid OpenPGP encrypted MIME parts.'); }
			var armored = decoded.replace(/^\s+/, '');
			return {type: type, kind: type, ciphertext: armored.startsWith('-----BEGIN PGP MESSAGE-----') ? armored : Crypto.fromBinaryString(decoded)};
		},
		unwrap: function(input) { return PgpMime.parse(input); }
	};
	return PgpMime;
});
