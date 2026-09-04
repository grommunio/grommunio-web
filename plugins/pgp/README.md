# OpenPGP mail

This plugin integrates OpenPGP.js with grommunio-web's compose, reading, settings, attachment and MAPI transport infrastructure. Key generation, passphrase changes, unlocking, signing, encryption, decryption and signature verification run **in the browser**. Private keys are stored in the user's mailbox only as already passphrase-encrypted OpenPGP armor. Normal requests never send private-key passphrases or unlocked secret parameters to PHP.

S/MIME and OpenPGP share the compose security controls and are mutually exclusive for each outgoing message. Selecting one disables the other; mixed-protocol nesting is not supported. The encrypted/signed list column distinguishes OpenPGP using GpgOL-compatible transport metadata.

Browser-side cryptography does not make the web server untrusted in every respect. A compromised server can serve malicious JavaScript, and a compromised browser can expose unlocked keys and received plaintext. JavaScript key clearing is best effort, not a guarantee of physical memory zeroization. HTTPS, application integrity, browser/session security, mailbox authorization and strong private-key passphrases remain essential.

## Installation

Requirements:

- The normal grommunio-web/PHP-MAPI environment and a modern HTTPS browser with WebCrypto.
- PHP cURL for the optional allowlisted HTTPS keyserver proxy.
- A mailbox provider supporting root folder-associated information and binary named-property streams.
- A Gromox MIME converter with the OpenPGP changes below. Installing the web plugin alone cannot repair an older converter's loss of signed MIME bytes.

The production OpenPGP path does not need a GnuPG executable, writable filesystem keyring, server-side agent, or server passphrase cache. It uses locally bundled, pinned OpenPGP.js and MIME dependencies; there is no runtime CDN script dependency. Install the locked JavaScript dependencies with `npm ci`, build them with `npm run build:pgp-vendor`, and include `plugins/pgp` in the repository's normal asset build and deployment.

Configure before plugin defaults are loaded, normally in `/etc/grommunio-web/config.php`:

```php
define('PLUGIN_PGP_ENABLE', true);
define('PLUGIN_PGP_USER_DEFAULT_ENABLE', true);
define('PLUGIN_PGP_UNLOCK_TTL', 300);
define('PLUGIN_PGP_MAX_KEY_BYTES', 1048576);
define('PLUGIN_PGP_MAX_MESSAGE_BYTES', 52428800);
define('PLUGIN_PGP_KEYSERVER_ALLOWLIST', [
    'https://keys.openpgp.org',
    'https://keyserver.ubuntu.com',
]);
```

The plugin is disabled by default. Users can also enable it through normal plugin settings; the server-side message hooks follow that per-user switch. Unlock state exists in browser memory for a bounded lifetime; **Lock all** removes the browser's unlocked-key references. Reloading the browser requires unlocking again.

Keys and trust policy are stored in the authenticated user's default mailbox root as hidden, non-transmittable associated messages. The exact classes, private GUID, named-property types, update revisions and limits are documented in [MAPI key storage](docs/mapi-key-storage.md). Neither `PR_USER_X509_CERTIFICATE` nor `PR_USER_CERTIFICATE` is repurposed for OpenPGP or private keys. Include associated information and named-property mappings in mailbox backups, and keep a separate encrypted private-key backup.

Old `PLUGIN_PGP_HOME`, `PLUGIN_PGP_GPG` and server-passphrase-cache configuration do not configure this browser architecture. Existing filesystem keyrings are left untouched; migration is explicit, never automatic. Export protected historical keys through a trusted workflow, import them in the browser, verify fingerprints and retain old decryption keys until historical mail and backups are accounted for.

## Gromox MIME transport

The Gromox MIME converter must preserve OpenPGP/MIME entities so the browser can verify and decrypt exactly the bytes that were signed or encrypted. This support is part of Gromox (`lib/mapi/oxcmail.cpp`, "oxcmail: preserve OpenPGP MIME and GpgOL transport metadata") and is covered by its `tests/oxcmail_ie` round trip. Deploy a Gromox build that includes it to every service that imports or exports mail. Updating only PHP-MAPI is insufficient; conversion happens in the Gromox services.

The transport mapping is:

| MIME | MAPI message class on import | Preserved attachment |
| --- | --- | --- |
| `multipart/signed; protocol="application/pgp-signature"` | `IPM.Note.SMIME.MultipartSigned` | Complete MIME entity, including its Content-Type header; `PR_ATTACH_MIME_TAG=multipart/signed` |
| `multipart/encrypted; protocol="application/pgp-encrypted"` | `IPM.Note.GpgOL.MultipartEncrypted` | Complete MIME entity; `PR_ATTACH_MIME_TAG=multipart/encrypted` |

Both use one `ATTACH_BY_VALUE` attachment with the original entity in `PR_ATTACH_DATA_BIN`. The converter also sets GpgOL's `GpgOL Msg Class` named property, type `PT_STRING8`, in property set `{31805AB8-3E92-11DC-879C-00061B031004}`. Its value is `IPM.Note.GpgOL.MultipartSigned` or `IPM.Note.GpgOL.MultipartEncrypted`. This identifies OpenPGP in folder tables while retaining the standard clear-signed class. It is a GpgOL interoperability convention, not a Microsoft-assigned OpenPGP property.

For outgoing signing, the web plugin uses the GpgOL-native `IPM.Note.GpgOL.MultipartSigned` transport class with the same named override. This keeps the S/MIME submit handler from applying CMS to an already protected OpenPGP envelope; the converter exports the standard `multipart/signed` OpenPGP wire format. An incoming copy uses the clear-signed storage class shown above.

The converter accepts GpgOL's outgoing `IPM.Note.InfoPathForm.GpgOL.SMIME.MultipartSigned` and `IPM.Note.InfoPathForm.GpgOLS.SMIME.MultipartSigned` transport classes as well. Encrypted MIME must retain the `application/pgp-encrypted` protocol. It must never be relabeled `application/pkcs7-mime`, which describes CMS rather than OpenPGP.

For OpenPGP wrappers, the converter omits the outer Bcc header while retaining the MAPI Bcc recipient table for envelope delivery and Sent Items. The protected inner MIME entity also excludes Bcc. This prevents disclosure of hidden addresses through MIME headers independently of any MTA cleanup rules.

Older Gromox versions can import OpenPGP as ordinary body parts and attachments, losing the exact MIME bytes protected by a detached signature. Re-exporting that MAPI item cannot reliably recreate those bytes. An updated converter preserves new arrivals; it cannot repair historical signatures. Such messages keep their stored body and attachments in the web client and show an advisory OpenPGP status instead of a verification result. Where available, an administrator can recover such items by reimporting their original RFC822 source. Encrypted legacy messages can often still be read from their intact ciphertext attachment.

## Using keys

Open **Settings → OpenPGP** to generate/import keys, inspect fingerprints and expiration, select a default private key, set compose defaults, manage HTTPS keyservers, change a private-key passphrase, and export protected backups. Key operations and passphrase entry occur locally in the browser. Unprotected private keys can be protected locally before upload; the server rejects unencrypted secret-key packets.

Before encrypting to a contact, import their public key and independently compare its complete fingerprint, for example in person or by an authenticated voice call. **Details / verify** pins that fingerprint to the contact's address. An email string in a user ID, a successful keyserver download, or a valid signature from an unknown key is not proof of ownership.

Signature validity, signer identity matching, and explicitly verified fingerprints are distinct results. OpenPGP.js checks certifications, key usability and revocation from the actual public material, not database display booleans. Public-key refreshes preserve encrypted private material; browser operations merge updated public certificates before using an older private-key export so revocations are not ignored.

Encryption requires usable verified recipient keys and includes the selected sender's key for Sent Items recovery. Expand distribution lists into individual recipients before preparing OpenPGP protection; unresolved lists are rejected rather than guessing which members need keys. Deleting a private key can make historical mail permanently unreadable. Keep revocation certificates and encrypted backups secure; the plugin does not publish keys automatically.

Keyserver access is a read-only HTTPS proxy by full fingerprint. Users choose only administrator-allowed origins. Redirects, insecure protocols, credentials in URLs, private/local targets and nonstandard ports are rejected. The returned armor is inspected in the browser before a separate explicit import; downloading alone neither imports nor trusts it. An empty allowlist disables network lookup. Keyservers may omit user IDs or serve stale material, and their operators can observe lookups.

## Message format and limitations

Outgoing messages use [RFC 3156 OpenPGP/MIME](https://www.rfc-editor.org/rfc/rfc3156.html): detached signing covers the canonical content headers and transfer-encoded MIME body; encryption protects the complete MIME body, including HTML alternatives and attachments. Sign-and-encrypt uses the combined OpenPGP operation inside `multipart/encrypted`. Recipient key IDs are hidden so encrypted packets do not disclose Bcc recipient identifiers.

The generated compatibility profile uses version-4 RSA 3072/RSA 4096 or Ed25519/Curve25519 keys, SHA-256, AES-256 and integrity-protected encryption. Protected secret-key exports use passphrase-based encryption compatible with GnuPG. [RFC 9580](https://www.rfc-editor.org/info/rfc9580/) supersedes RFC 4880; support for every algorithm, version-6 key profile or AEAD combination is not claimed. The pinned browser library determines supported cryptographic formats.

Ordinary outer Subject, From, To, Date and routing headers are not encrypted. Protected-header extensions, automatic WKD/Autocrypt discovery, and smartcard interaction are not implemented. Inline OpenPGP protects only body text, not ordinary attachments or outer headers.

Protection is applied at submission. **Autosaved compose drafts and their attachments remain plaintext in the mailbox**, even when OpenPGP is selected. The web server also handles the unprotected draft while preparing canonical MIME for browser protection. Secure mailbox storage, backups and retention accordingly. Incoming decryption and decrypted attachment handling run in browser memory; no decrypted incoming body is imported back into a saved MAPI item. Replies/forwards that quote decrypted content can become new plaintext drafts and require their own protection choice.

A short-lived preparation receipt binds the browser's protected result to the saved draft, sender, recipient addresses and To/Cc/Bcc types, selected key, and protection mode. The final outbox copy is checked with a streamed content digest, including nested message bodies/headers and attachments. Changed content fails closed and requires a fresh preparation. Receipts are consumed once under the PHP session handler's exclusive lock; deployments must use a session handler with working locking semantics. The receipt contains hashes and routing metadata, not MIME, private keys or passphrases.

The clear-signed MAPI convention is described by [Microsoft MS-OXOSMIME](https://learn.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-oxosmime/6d0deda8-4e31-4949-bdd6-8c2e54d04736). GpgOL's corresponding transport classes and named properties are documented in its [message-conversion notes](https://wiki.gnupg.org/GpgOL/MessageConversion), [MIME writer](https://github.com/gpg/gpgol/blob/master/src/mimemaker.cpp), and [MAPI implementation](https://github.com/gpg/gpgol/blob/master/src/mapihelp.cpp).

## Validation and rollout

Run the browser crypto/MIME tests, transport/session failure tests and mailbox store tests:

```sh
node plugins/pgp/test/testBrowserCrypto.cjs
node plugins/pgp/test/testBrowserTransport.cjs
node plugins/pgp/test/frontend-test.js
php -n plugins/pgp/test/testTransport.php
php -n plugins/pgp/test/testMapiKeyStore.php
php -n plugins/pgp/test/testKeyserver.php
php server/test/encryptionStoreTakeTest.php
php server/test/operationsInlineAttachmentTest.php
# Dedicated QA mailbox; JSON fixture contains browser-generated encrypted armor.
PGP_TEST_USER=openpgp-qa@example.test \
PGP_TEST_PASSWORD_FILE=/private/path/qa-login-password \
PGP_TEST_KEY_RECORD=/private/path/protected-key-fixture.json \
    php plugins/pgp/test/testMapiKeyStoreLive.php
```

The live mailbox test creates a previously absent fixture fingerprint, verifies named binary-stream readback and associated-only visibility, and deletes only its fixture record and newly created empty policy. Use a disposable QA mailbox without an existing OpenPGP policy. The fixture contains no private-key passphrase; the optional password file is solely the QA mailbox login credential.

The browser cryptography suite passed 96 assertions, including interoperability with real GnuPG, integrity and signature failures, protected-key import/export, and revocation refresh. Browser transport/lifecycle/rendering tests passed 94 assertions and frontend tests passed 27. The PHP browser-transport suite passed 136 fault-injected assertions, the real concurrent session-receipt test passed 11, inline-attachment upload tests passed 15, and keyserver SSRF policy passed 26. The mailbox storage suite passed 49 assertions using fault-injected MAPI and real protected-key packets. On the demo, a protected key generated by OpenPGP.js passed 24 actual MAPI persistence assertions, including exact binary armor preservation, public-only verification bundles, exclusion from ordinary folder tables, update revisions, private-key preservation and cleanup. Counts describe the executed suites, not an Outlook UI test.

Live browser checks on the demo verified the shared Sign/Encrypt menus, cross-protocol disabling, native explanatory tooltips, key-settings layout and disabled selection-dependent actions, dialog cancellation, and empty passphrase fields without website-password autofill. No browser errors were observed. Renderer regressions also verify that locking, failed opening, and same-message reloads clear previously displayed protected HTML.

For visual regressions, serve the repository root on loopback (for example, `php -S 127.0.0.1:8080 -t .`) and open `/plugins/pgp/test/ui-visual-fixture.html`. Click **Run checks** to test both light and dark themes with the actual ExtJS widgets, application CSS and final iconset stylesheet. Checks cover text/icon contrast, translated submenu labels and arrow spacing, consistent settings buttons, the keyserver action's clickable bounds, selection-dependent disabling, and native section padding. The fixture uses synthetic metadata only, blocks network API operations, and does not access a mailbox or perform cryptography. Test fixtures are not included in the plugin deployment.

For real authenticated HTTP, MAPI and SMTP integration, use an explicitly disposable QA mailbox:

```sh
PGP_TEST_URL=https://mail.example.test/web/ \
PGP_TEST_USER=openpgp-qa@example.test \
PGP_TEST_PASSWORD_FILE=/private/path/qa-login-password \
    node plugins/pgp/test/testBrowserHttp.cjs --allow-mailbox-changes --send-to-self
```

This test creates a browser-protected mailbox key, pins its test identity, creates drafts, and sends messages only to the same QA account. It verifies and cleans up its own key fixture; synthetic drafts and delivered Inbox/Sent test messages remain for inspection. Never run it against a normal user's mailbox. The browser rebuild passed 363 authenticated assertions on the demo: seven real self-addressed SMTP sends and fourteen Inbox/Sent browser-local opens. Coverage includes a plaintext control, all protected modes, nested and combined-packet sign-and-encrypt, exact HTML/CID-image and binary-attachment bytes, replies carrying inline images, forwards carrying all files, preparation/mutation failures, late pending-upload rejection, and lock/reopen persistence. The harness explicitly rejects any RPC containing its local private-key passphrase. Reported demo results record executed acceptance checks, not a promise that temporary QA credentials remain active.

GnuPG is an interoperability oracle only in `test/oracle/Gpg.php`; `testGpg.php` passed 60 assertions and `testMime.php` passed 42. These optional development tests need a GnuPG executable and isolated temporary keyrings, not production web keyring configuration.

Gromox's `tests/oxcmail_ie` covers the OpenPGP import/export round trip: raw MIME preservation, the GpgOL class and named-property mapping, and Bcc omission with recipient-table retention.

A Windows Outlook/Gpg4win exchange has not been executed in this environment. Automated browser-crypto and HTTP tests do not replace visual testing of the actual deployed UI and Outlook interoperability.

Before production rollout, exchange all three protected modes in both directions with the actual Outlook/Gpg4win versions used by the organisation. Cover non-ASCII text, HTML/CID images, binary attachments, To/Cc/Bcc, Sent Items, replies/forwards, locking/reloading, wrong/missing keys and intentionally damaged signatures/ciphertext. Repeat after browser-library, MIME-converter or client upgrades.

## Classified information

**This plugin is not approved or certified for VS-NfD, RESTREINT UE/EU RESTRICTED, or NATO RESTRICTED. Do not use it to process classified information on the strength of its algorithms, this README, or interoperability with an approved desktop product.**

Approval applies to a specific product/version, configuration, operating environment, key-management procedures, and accredited system. It is not inherited by other software that exchanges OpenPGP messages or uses similar algorithms. Browser-executed cryptography, server-delivered application code, encrypted mailbox key storage, and the user's endpoint need an explicit evaluation of their own trust boundaries.

The BSI describes GnuPG VS-Desktop approvals and different operating conditions for smartcard and soft-token use in its [Chiasmus replacement guidance](https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Chiasmus/Chiasmus_Abloesung.pdf?__blob=publicationFile&v=6). Those product approvals do not cover this web plugin.

For EU classified information, cryptographic-product approval and the applicable system accreditation are required under the relevant authority's rules; see the Council's [information-assurance guidance](https://www.consilium.europa.eu/en/general-secretariat/corporate-policies/classified-information/information-assurance/) and [cryptographic product approval policy](https://data.consilium.europa.eu/doc/document/ST-10199-2019-INIT/en/pdf). National-system arrangements may differ and require the competent authority's determination.

NATO's [Information Assurance Product Catalogue guidance](https://www.ia.nato.int/NIAPC/Documents/AC322-D%282019%290041-REV1.pdf) requires national/NATO authority endorsement for catalogue entries and explains that selecting listed products does not by itself establish system security or interoperability. An organisation pursuing restricted-information use must have its security authority evaluate the complete browser/web-server/mail-server/key-storage design and approve the deployment before classified data is introduced.
