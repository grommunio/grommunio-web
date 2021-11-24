# Tokenizr in Kopano WebApp

The tokenizr library can be found at https://github.com/rse/tokenizr

To build the library and copy it into the WebApp simply run:

make tokenizr

The needed node_modules will be installed and the library will be build
into client/third-party/tokenizr (the same directory where this README
is located)

During the WebApp build the library will be concatenated to the other
third-party libraries and compiled by the closure compiler.

Note: Since our build server cannot (yet?) run node scripts, the building
of the tokenizr library must be done by the developer when he changes the
source!
