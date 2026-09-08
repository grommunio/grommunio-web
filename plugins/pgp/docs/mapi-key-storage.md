# Mailbox OpenPGP key storage

This is an application-defined storage schema, not a Microsoft-assigned OpenPGP property set or a GpgOL private-key synchronization protocol. It uses MAPI folder-associated information (FAI), the normal mechanism for hidden, non-transmittable client configuration. Microsoft documents both its [associated contents-table API](https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/contents-tables) and the fact that [associated messages can contain application-specific information](https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/mapi-messages).

## Why not the certificate properties?

`PidTagUserX509Certificate` / `PR_USER_X509_CERTIFICATE` (`0x3A701102`) contains X.509 version-3 certificates, not OpenPGP packets or private keys. `PidTagUserCertificate` / `PR_USER_CERTIFICATE` (`0x3A220102`) contains an ASN.1 authentication certificate; it is not a general keyring field. Putting OpenPGP secret-key armor in either would violate their documented semantics and could expose it through address-book synchronization. See Microsoft's [X.509 certificate property](https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/pidtaguserx509certificate-canonical-property) and [user certificate property](https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/pidtagusercertificate-canonical-property).

The existing S/MIME plugin stores its PKCS#12/public-certificate data in root FAI messages with custom `WebApp.Security.Private` / `WebApp.Security.Public` classes. OpenPGP uses the same associated-message facility, but its own classes and named properties. It neither modifies those S/MIME records nor stores OpenPGP material in their certificate body format.

GpgOL's [MAPI implementation](https://github.com/gpg/gpgol/blob/master/src/mapihelp.cpp) defines its `{31805AB8-3E92-11DC-879C-00061B031004}` namespace for message-conversion metadata such as `GpgOL Msg Class`. That convention is used for mail transport, not reused for this plugin's key storage. No GpgOL compatibility claim is made for these new FAI key records; desktop keys are exchanged through ordinary protected OpenPGP key export/import.

## Version 1 schema

All records live in the associated contents table of the authenticated user's **default mailbox root**. The HTTP API does not accept an alternate store ID, folder ID, or record entry ID for key management. Shared folders and other users' mailboxes are not searched. FAI visibility is not an access-control boundary: mailbox administrators and appropriately authorized delegates may still access the encrypted records.

Message classes:

- `IPM.Configuration.Grommunio.OpenPGP.Key`: one primary fingerprint per record.
- `IPM.Configuration.Grommunio.OpenPGP.Policy`: one policy record per mailbox.

Every property below is a string-named property in the plugin's private GUID `{9AE1E2CD-14C9-4D51-A235-3A19CCFF9D34}`. Numeric property IDs are resolved per store with `GetIDsFromNames`; no fixed numeric named-property tags are assigned.

| Property name | Type | Value |
| --- | --- | --- |
| `OpenPGP.SchemaVersion` | `PT_LONG` | `1` |
| `OpenPGP.Fingerprint` | `PT_STRING8` | Full uppercase 40- or 64-hex primary fingerprint |
| `OpenPGP.PublicKey` | `PT_BINARY` | Complete ASCII-armored public key |
| `OpenPGP.EncryptedPrivateKey` | `PT_BINARY` | Optional, already passphrase-encrypted private-key armor |
| `OpenPGP.HasPrivateKey` | `PT_BOOLEAN` | Encrypted private material is present |
| `OpenPGP.Metadata` | `PT_BINARY` | UTF-8 JSON display metadata, explicitly advisory |
| `OpenPGP.Revision` | `PT_STRING8` | Random 32-hex application revision token |
| `OpenPGP.Policy` | `PT_BINARY` | Policy-record UTF-8 JSON: `trusted` email/fingerprint map and `keyservers` list |

`PR_MESSAGE_CLASS` identifies the record class, and `PR_SUBJECT` is only a readable record label. Key armor is never stored in `PR_BODY`, ordinary mail attachments, contact certificate fields, or the global address book. There are no passphrase or unlocked-key properties. Keyservers come from the administrator HTTPS allowlist. Import and lookup never create a trust pin.

The implementation bounds key armor by `PLUGIN_PGP_MAX_KEY_BYTES`, metadata/policy JSON by 64 KiB, and the key count by 200. Duplicate records for one fingerprint, which two devices can create by importing concurrently, resolve to the first record; deleting the key removes them all. Associated-table or stream errors fail closed without falling back to filesystem storage.

## Validation and update contract

The browser parses and cryptographically validates OpenPGP keys using OpenPGP.js. Private keys are encrypted before upload; their passphrases and unlocked secret parameters do not enter a normal server request. PHP independently bounds and structurally parses the key packets, rejects unencrypted private packets and mixed/extra primary keys, and computes the primary fingerprint from public key material. It never runs GnuPG or decrypts a private key. Version-4 and version-6 fingerprint framing follows [RFC 9580 section 5.5.4](https://www.rfc-editor.org/rfc/rfc9580.html#section-5.5.4).

Stored expiration, capability, revocation, and user-ID display fields are advisory, not server-certified identity assertions. Before signing, encryption, verification, or trusting an address, the browser must recompute the relevant cryptographic facts from the actual key material. A matching fingerprint string or a database boolean does not replace certification/revocation checks.

`listKeys()` returns metadata, private-key presence, trust bindings, and revisions without key armor. `publicKeys()` returns public armor with that metadata, never private armor; it explicitly rejects more than 100 keys rather than truncating the browser verification bundle. `key(fingerprint)` returns the public armor and, when present, its encrypted private armor. `importKey()` accepts:

```text
{fingerprint, public_key, encrypted_private_key?, metadata, revision?}
```

Creating a new record uses no revision. Updating an existing record requires the revision returned by the last list/get. Omitting `encrypted_private_key` preserves existing private material; an empty string cannot silently erase it. Deleting a private-key record requires explicit private-key confirmation and also removes its trust pins. These revision checks detect stale UI updates; they are not a claim of cross-client database transactions or compare-and-swap semantics beyond the MAPI provider's own save behavior.

## Security and migration

Mailbox backups and migrations must include associated information and named-property mappings. Encrypted private keys should also be exported separately by their owner for recovery. Anyone who obtains the encrypted armor can attempt offline passphrase guessing, so strong passphrases and protected mailbox backups remain essential.

This version does not read, migrate, or delete the previous server-side GnuPG directories. Migration is explicit: export a protected private key through a trusted offline/administrative workflow, import it in the browser, verify its full fingerprint, and retain historical decryption keys until old mail and backups are accounted for. Public-key imports must not replace existing encrypted private material.

Browser-side cryptography reduces the passive server's access to unlocked keys and received plaintext, but a compromised server can serve hostile JavaScript. HTTPS, application integrity, browser/session security, and mailbox authorization remain part of the trust boundary. The OpenPGP and S/MIME compose choices are mutually exclusive per message; mixed-protocol nesting is not supported. This schema provides no VS-NfD, EU RESTRICTED, or NATO RESTRICTED approval.
