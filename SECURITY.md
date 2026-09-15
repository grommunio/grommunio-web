<!--
  SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
  SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Security policy

grommunio Web is developed and maintained by grommunio GmbH. This page
describes how to report a vulnerability, what happens with a report, how
security fixes reach installations, and where the bill of materials is. It
describes how grommunio Web meets the vulnerability handling requirements of
the EU Cyber Resilience Act (Regulation (EU) 2024/2847, Annex I Part II).

## Reporting a vulnerability

Write to **security@grommunio.com**. Please do not file a public issue for a
suspected vulnerability.

A useful report names the affected version (the `version` file of the
installation, or *Settings → General* in the client), the component or plugin, the
steps to reproduce, and the impact you observed. Current contact details
are published at
<https://grommunio.com/security/> and
<https://grommunio.com/.well-known/security.txt>. Reports are handled in
English and German.

## What happens with a report

1. We confirm receipt and tell you who is handling the report.
2. We reproduce and assess the issue and keep you informed about the result.
3. We develop the fix in private and request a CVE identifier where one is
   warranted.
4. The fix ships as a regular release. The release notes and the *Security*
   section of `doc/changelog.rst` describe the vulnerability, the affected
   versions and the fixed version.
5. Public disclosure is coordinated with you once the fixed release is
   available. Reporters who wish to be credited are.

Please keep the details confidential until the fix is released.

## Reporting obligations under the Cyber Resilience Act

Since 11 September 2026 grommunio GmbH, as the manufacturer, reports
actively exploited vulnerabilities and severe incidents that affect
grommunio Web through the single reporting platform ENISA operates, which
forwards them to the responsible CSIRT, as Article 14 of the Cyber Resilience
Act requires: an early warning within 24 hours of
becoming aware, the vulnerability or incident notification within 72 hours,
and the final report within 14 days after a corrective measure is available
(within one month after the notification for a severe incident). Affected
users are informed without undue delay, together with the corrective or
mitigating measures they can take.

## Security updates

Security fixes are delivered free of charge as part of the regular releases
through the grommunio package repositories and the release tags of this
repository. Fixes go to the current release series; installations on an
older series should upgrade to receive them. Starting with 5.0, every
release lists its security-relevant changes under *Security* in
`doc/changelog.rst`.

## Bill of materials

Every release carries a machine-readable bill of materials at the
repository root: `bom.json` (CycloneDX 1.6) and `bom.spdx.json` (SPDX 2.3).
They list all runtime and build-time components with version, licence and
origin, and separate what runs for users from what only runs to build the
deploy tree. `make bom` regenerates them, `make bom-check` fails when they no
longer match `package-lock.json`, the vendored composer trees or
`tools/bom-vendored.json`.

Every source file states its copyright and licence in an SPDX header;
`REUSE.toml` covers the files that cannot, and `LICENSES/` holds the texts.
`reuse lint` passes on every release.

## Secure configuration

`config.php.dist` and `defaults.php` document every option. The ones that
matter for a secure installation:

* Serve grommunio Web over TLS only. Keep `SECURE_COOKIES` and
  `CONFIG_CHECK_COOKIES_SSL` enabled; the configuration check then refuses to
  start grommunio Web while PHP does not mark the session cookie secure.
* Leave `DISABLE_FINGERPRINT_CHECK` and `ENABLE_DOMPURIFY_FILTER` at their
  defaults. The first binds a session to the browser that opened it, the
  second sanitises every HTML body before it is rendered.
* `MAX_SUBMITS_PER_MINUTE` limits how many messages a mailbox can send per
  minute; `SESSION_MAX_LIFETIME` sets how long an unused session file is
  kept before the shipped `grommunio-web-session-cleanup.timer` removes it.
* Enable only the plugins you use. Plugins disabled in the grommunio Admin
  API are not loaded, and the code of an optional plugin reaches the browser
  only for users who enabled it.
* Use the nginx configuration under `build/`, which includes the
  grommunio-common security headers, and keep PHP and gromox current.
