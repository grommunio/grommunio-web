# Tokenizr in grommunio Web

The tokenizr library can be found at https://github.com/rse/tokenizr

``tokenizr.js`` is the upstream ``dst/tokenizr.umd.js``, lowered to the
``.browserslistrc`` targets because it uses class static blocks (Safari 16.4)::

    esbuild tokenizr.umd.js --minify \
        --target=chrome109,edge109,firefox115,safari16,ios16

Since 2.0 its global ``Tokenizr`` is a namespace and the class is
``Tokenizr.Tokenizr``. During the grommunio Web build it is concatenated with
the other third-party libraries and minified by Terser.

When updating it, replace the checked-in browser bundle with a tested upstream
build and retain the upstream license header, if it has one. The project no
longer carries the Tokenizr source toolchain.
