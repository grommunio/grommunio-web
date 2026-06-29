#!/bin/bash
#
# Update the vendored Mozilla PDF.js viewer to a given release.
#
# grommunio Web bundles the prebuilt PDF.js "legacy" viewer distribution under
# client/filepreviewer/pdfjs/ (the legacy build is transpiled for broader
# browser support). This script downloads a release, removes the previously
# vendored copy in full (so no stale artifacts from an older version are left
# behind) and drops in the new one.
#
# Usage:
#   tools/update-pdfjs.sh <version>
# Example:
#   tools/update-pdfjs.sh 6.1.200
#
set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
	echo "Usage: $0 <version>   (e.g. $0 6.1.200)" >&2
	exit 1
fi

# Resolve the repository root from this script's location so it can be run from
# anywhere.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$REPO_ROOT/client/filepreviewer/pdfjs"

ZIP="pdfjs-${VERSION}-legacy-dist.zip"
URL="https://github.com/mozilla/pdf.js/releases/download/v${VERSION}/${ZIP}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo ">> Downloading ${URL}"
curl -fSL -o "$TMP/$ZIP" "$URL"

echo ">> Extracting"
unzip -q "$TMP/$ZIP" -d "$TMP/pdfjs"

# Sanity check: the release must contain the prebuilt viewer.
if [ ! -f "$TMP/pdfjs/web/viewer.html" ] || [ ! -f "$TMP/pdfjs/build/pdf.mjs" ]; then
	echo "ERROR: unexpected archive layout (no web/viewer.html or build/pdf.mjs)" >&2
	exit 1
fi

echo ">> Removing old vendored copy at $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"

echo ">> Installing PDF.js ${VERSION} (legacy)"
cp -r "$TMP/pdfjs/build" "$DEST/build"
cp -r "$TMP/pdfjs/web"   "$DEST/web"
cp    "$TMP/pdfjs/LICENSE" "$DEST/LICENSE"

# Drop files that are not needed to serve the viewer: the bundled sample PDF and
# the (lazy-loaded) debugger.
rm -f "$DEST/web/compressed.tracemonkey-pldi-09.pdf"
rm -f "$DEST/web/debugger.mjs" "$DEST/web/debugger.css"

echo ">> Done. Vendored version:"
grep -oaE "pdfjsVersion = .[0-9.]+." "$DEST/build/pdf.mjs" | head -1

cat <<EOF

Reminder:
  - The viewer is loaded as an ES module (web/viewer.html -> build/pdf.mjs);
    no build step is required, the files are served as-is.
  - If PDF.js changes the download button id or the AppOptions used by
    client/zarafa/common/previewer/ui/ViewerContainer.js, update that file.
  - Refresh the PDF.js copyright year/version in client/zarafa/ABOUT.js and
    LICENSE.txt if it changed.
EOF
