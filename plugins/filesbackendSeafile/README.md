Seafile backend for grommunio Files – configuration

This plugin supports configurable crypto for two places:

- Session password decryption (legacy 3DES EDE-CBC)
- Account Store V1 secret (libsodium secretbox)

Configuration is to be placed into your global grommunio‑web config (e.g. `/etc/grommunio-web/config.php`).

Credential toggle
- The only supported key is `use_grommunio_credentials` (boolean). When enabled, the backend uses the current session’s credentials (via EncryptionStore if present, else session password path).

3DES session password decryption
- Set plugin‑specific constants. Falls back to legacy `PASSWORD_KEY`/`PASSWORD_IV` if present.

```
define('FILES_PASSWORD_KEY', 'your-3des-key'); // 24 bytes recommended
define('FILES_PASSWORD_IV',  'your-iv');       // exactly 8 bytes
```

- These are used to decrypt `$_SESSION['password']` with `des-ede3-cbc`. If not defined (or decryption fails), the raw session password is used.

Account Store V1 secret (libsodium)
- Provide a 32‑byte key as a hex string via constant (preferred) or environment variable:

```
define('FILES_ACCOUNTSTORE_V1_SECRET_KEY', '64-hex-chars');
```

or

```
export FILES_ACCOUNTSTORE_V1_SECRET_KEY=64-hex-chars
```

- Generate a key: `openssl rand -hex 32`
- The value must be hex‑encoded and decode to exactly 32 bytes; otherwise initialization throws a clear error.

Precedence and behavior
- Password KEY/IV: `FILES_PASSWORD_KEY/IV` → `PASSWORD_KEY/IV` → fallback to plaintext session password.
- Account Store key: `FILES_ACCOUNTSTORE_V1_SECRET_KEY` constant → env var; required for encoding/decoding.
