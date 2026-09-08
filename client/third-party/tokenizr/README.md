# Tokenizr in grommunio Web

The tokenizr library can be found at https://github.com/rse/tokenizr

``tokenizr.js`` is a vendored browser build. During the grommunio Web build it
is concatenated with the other third-party libraries and minified by Terser.

When updating it, replace the checked-in browser bundle with a tested upstream
build and retain the upstream license header. The project no longer carries the
Tokenizr source toolchain.
