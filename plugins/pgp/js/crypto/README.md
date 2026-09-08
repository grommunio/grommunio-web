# Browser cryptography

`BrowserCrypto` performs all private-key and message cryptography locally. It has
no network, session, DOM, filesystem or persistent-storage API. The UI transports
only public certificates, already-encrypted private-key armor and encrypted MIME.
Passphrases are never part of its returned values or serialized state.

The service retains decrypted private-key objects in a closure-owned `WeakMap`,
with a default ten-minute lifetime and a maximum one-hour lifetime. Lock,
expiration, pagehide and destroy discard the keys. Lock also invalidates pending
unlock/decryption results. Integrators must call `lock()` on logout and clear
rendered messages, attachment object URLs, dialog fields and other plaintext UI
state. JavaScript does not guarantee physical zeroization of garbage-collected
strings, temporary copies, browser swap, WebCrypto state or crash dumps.

This architecture prevents ordinary PHP/server storage code from receiving the
passphrase or a decrypted private key. It does **not** defend against a malicious
server replacing the JavaScript, same-origin XSS, compromised browser extensions,
or a compromised endpoint. The protected key in the mailbox can still be subject
to offline passphrase attacks. This is not a classified-system certification.

## API

All methods except locks/status and static byte helpers return promises.

- `new BrowserCrypto({ttlSeconds:600, maxMessageBytes:52428800})`
- `generate({name,email,passphrase,algorithm:'rsa3072',expiresDays:730})`
- `inspect(armorOrBytes, updatedPublicArmor?)`
- `protect(unprotectedPrivateArmor, newPassphrase)` — local reprotection only.
- `changePassphrase(protectedArmor, oldPassphrase, newPassphrase, updatedPublicArmor?)`
- `unlock(protectedArmor, passphrase, ttlSeconds?, updatedPublicArmor?)`
- `lock(fingerprint?)`, `unlocked()`, `destroy()`
- `onLock(callback)` → unsubscribe function; callback receives a fingerprint or
  `undefined` for all keys, after key destruction. Observer errors are isolated.
- `sign(bytes, signerFingerprint)` → `{signature,micalg}`
- `encrypt(bytes, recipientPublicArmors, signerFingerprint?)` → armored message
- `decrypt(armorOrBytes, verificationPublicArmors?)` → `{data,signatures,valid,integrity}`
- `verify(bytes, signatureArmor, verificationPublicArmors)` → `{data,signatures,valid}`
- `verifyCleartext(armor, verificationPublicArmors)` → same verification result

Key methods return `{fingerprint,public_key,encrypted_private_key,private_key,
metadata}`. `private_key` is a compatibility alias for the *encrypted* private
armor; it never contains an unlocked export. Generation also returns a local
revocation-certificate backup. New passphrases require at least twelve characters.
Unlock accepts existing nonempty passphrases. Metadata includes certified UIDs,
capabilities, expiration and revocation status but does not establish trust.
Recipient selection must require an explicitly pinned full fingerprint and a
valid certified matching email address. Do not infer trust from a short key ID.

Always pass the separately stored current `public_key` to `unlock` and private
key inspection/reprotection. It is merged by matching full fingerprint before
private operations so a newer revocation or identity update cannot be silently
ignored by an old encrypted private-key export. Revalidate certificate metadata
in the browser rather than treating server-supplied metadata as authoritative.

The byte helpers are `utf8`, `decodeUtf8`, `binaryString`, `fromBinaryString`,
`toBase64` and `fromBase64`. Cryptographic payload APIs accept `Uint8Array`, never
implicitly UTF-8 encode arbitrary MIME. All recipient key IDs are hidden.
Outgoing generated keys use interoperable version-4 RSA3072/RSA4096 or legacy
Ed25519/Curve25519. AES256/SHA256 are preferred, with incoming integrity checking
mandatory. The actual detached-signature digest is returned as `micalg` (legacy
Ed25519 certificates can choose SHA512). Respect this value when building MIME.
Public-key encryption respects recipient algorithm preferences, including AEAD
when all recipient certificates advertise it; no unsafe downgrade is forced.

## MIME and rendering

`PgpMime.entity(bytes)` canonicalizes outgoing converter-produced, transport-safe
MIME to CRLF and removes trailing whitespace per RFC 3156, excluding SMTP
envelope headers such as Bcc. It assumes binary attachments have already been
transfer-encoded by the outgoing MAPI converter. On incoming data, pass `false`
to preserve binary MIME body octets. `signed(entity,signature,micalg)` and
`encrypted(armor)` wrap the exact entity. `parse(bytes)` returns `signed`,
`encrypted`, `plain` or `smime`, preserving the first signed MIME part byte for
byte. Do not use a general MIME parser to recreate bytes for verification.

Only after full decryption integrity verification should `PostalMime.parse` see
the plaintext. The transport uses `attachmentEncoding:'arraybuffer'`,
`maxNestingDepth:32`, `maxHeadersSize:65536` and `forceRfc822Attachments:true`.
Sanitize HTML with a dedicated DOMPurify instance, leave remote-picture blocking
to the renderer, isolate document rendering and make attachment downloads
entirely local. Unauthenticated MIME
preamble/epilogue is never rendered by this parser. S/MIME/OpenPGP nesting is
unsupported; a message must use exactly one protection protocol.

## Dependencies and tests

`npm ci && npm run build:pgp-vendor` reproducibly bundles the exact versions from
the lock file into `resources/vendor/pgp-vendor.js`, with local license files.
There are no CDN imports. The build verifies the expected dependency versions.
The globals are `openpgp`, `PostalMime` and `fflate.{zipSync,unzipSync}`.

- [OpenPGP.js 6.3.1](https://github.com/openpgpjs/openpgpjs/releases/tag/v6.3.1)
  (LGPL-3.0-or-later), including the fix for
  [CVE-2025-47934](https://github.com/openpgpjs/openpgpjs/security/advisories/GHSA-8qff-qr5q-5pr8).
- [postal-mime 2.7.5](https://github.com/postalsys/postal-mime/releases/tag/v2.7.5)
  (MIT), for local body/attachment extraction, not cryptographic framing.
- [fflate 0.8.3](https://github.com/101arrowz/fflate/releases/tag/v0.8.3) (MIT),
  for local attachment ZIP downloads.

`node plugins/pgp/test/testBrowserCrypto.cjs` tests the real pinned library
against GnuPG in an isolated temporary keyring, and loads the actual browser
bundle in a separate runtime with network and persistent-storage traps. It
covers sign/encrypt/decrypt in both directions, exact binary MIME/attachments,
tampering, missing keys, stale/revoked/expired keys, protected import/export,
wrong passphrases, timers, page lifecycle and concurrent-lock invalidation.
