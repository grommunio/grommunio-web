# Tools

PHPMD ?= phpmd
NPM ?= npm
MSGFMT ?= msgfmt
PHP ?= php

# Variables

DESTDIR ?= deploy

# Javascript compiler

JSDEPLOY = $(DESTDIR)/client
DEPLOYPURIFY = $(JSDEPLOY)/dompurify

JSCOMPILER ?= node_modules/terser/bin/terser
CSSCOMPILER ?= node_modules/postcss-cli/index.js
HTMLCOMPILER ?= node_modules/html-minifier-terser/cli.js
SVGCOMPRESS ?= node_modules/svgo/bin/svgo

JSOPTIONS = --compress ecma=2015,computed_props=false --mangle reserved=['FormData','Ext','Zarafa','container','settings','properties','languages','serverconfig','user','version','urlActionData','console','Tokenizr','module','define','global','require','proxy','_','dgettext','dngettext','dnpgettext','ngettext','pgettext','onResize','tinymce','resizeLoginBox','userManager','DOMPurify','PDFJS','odf','L','GeoSearch']
CSSOPTIONS = --no-map --use postcss-preset-env --use cssnano --verbose
HTMLOPTIONS = --collapse-whitespace --remove-comments

# Server files

DISTFILES = $(addprefix $(DESTDIR)/,config.php.dist debug.php.dist)
ROBOTS = $(addprefix $(DESTDIR)/, robots.txt)
LANGTXT = $(wildcard server/language/*/language.txt)
LANGTXTDEST = $(addprefix $(DESTDIR)/, $(LANGTXT))
POS = $(wildcard server/language/*/LC_MESSAGES/grommunio_web.po)
MOS = $(patsubst %.po,$(DESTDIR)/%.mo,$(POS))
INCLUDES = $(sort $(shell find server/includes -name '*.php'))
PHPFILES = $(filter-out $(DESTDIR)/config.php, $(filter-out $(DESTDIR)/debug.php, $(patsubst %.php,$(DESTDIR)/%.php,$(wildcard *.php) $(INCLUDES))))
SERVERROOTFILES = $(addprefix $(DESTDIR)/,server/manifest.dtd)
IS_SUPPORTED_BUILD ?= $(if $(filter 1, $(SUPPORTED_BUILD)), supported validate-supported)

# Client files

CSS = $(wildcard client/resources/css/*.* client/resources/css/*/*.* client/extjs/ux/css/ux-all.css client/extjs/resources/css/*.css)
CSSDEST = $(addprefix $(DESTDIR)/, $(CSS))
IMAGEDIR = client/resources/images
APPICONS = $(wildcard $(IMAGEDIR)/app-icons/*.*)
APPICONSSCSS = client/resources/scss/base/_icons.scss
APPICONSEXTENSIONSFILE = client/resources/images/app-icons.extensions.json
IMAGES = $(filter-out $(APPICONSEXTENSIONSFILE), $(wildcard $(IMAGEDIR)/*.*))
IMAGESDEST = $(addprefix $(DESTDIR)/, $(IMAGES))
EXTJSMODFILES = $(wildcard client/extjs-mod/*.js)
ICONEXTENSIONSFILE = client/resources/iconsets/extensions.json
ICONSETS = $(notdir $(filter-out client/resources/iconsets/extensions.json, $(wildcard client/resources/iconsets/*)))
ICONS = $(foreach iconsetdir,$(ICONSETS),$(wildcard client/resources/iconsets/$(iconsetdir)/src/png/*/*.png))
ICONSETSDEST = $(addprefix $(DESTDIR)/client/resources/iconsets/, $(ICONSETS))
ICONSETSCSS = $(foreach iconsetdir,$(ICONSETS),client/resources/iconsets/$(iconsetdir)/$(iconsetdir)-icons.css)
ICONSETSCSSDEST = $(addprefix $(DESTDIR)/, $(ICONSETSCSS))
EXTJS = client/extjs/ext-base.js client/extjs/ext-all.js
THIRDPARTY = $(sort $(shell find client/third-party -name '*.js')) client/third-party/tokenizr/tokenizr.js

PURIFYJS = client/dompurify/purify.min.js
DEPLOYPURIFYJS = $(DEPLOYPURIFY)/purify.js

POFILES = $(wildcard server/language/*/*/*.po)
JSFILES = $(sort $(shell find client/zarafa -name '*.js'))

# Build

.PHONY: deploy server client all

all: deploy

deploy: node_modules server client plugins css clearartifacts

build: node_modules deploy

test: jstest

server: $(MOS) $(LANGTXTDEST) $(PHPFILES) $(DISTFILES) $(DESTDIR)/version $(SERVERROOTFILES)

client: $(CSSDEST) $(ICONSETSDEST) $(IMAGESDEST) html js
	cp -r client/resources/fonts $(DESTDIR)/client/resources/
	cp -r client/zarafa/core/themes $(DESTDIR)/client/
	rm -rf $(DESTDIR)/client/themes/*/js
	cp -r client/resources/scss $(DESTDIR)/client/resources/scss
	cp -r LICENSE.TXT $(DESTDIR)/

css:
	find $(DESTDIR)/client -name "*.css" -exec $(CSSCOMPILER) $(CSSOPTIONS) --output {}.min {} \; -exec mv {}.min {} \;
	find $(DESTDIR)/plugins -name "*.css" -exec $(CSSCOMPILER) $(CSSOPTIONS) --output {}.min {} \; -exec mv {}.min {} \;

svgo: node_modules
	find client plugins -type f -name "*.svg" -exec $(SVGCOMPRESS) --multipass {} \;

clearartifacts:
	find $(DESTDIR) -iname "*readme*" -exec rm -f {} \;
	find $(DESTDIR) -iname "*license*.txt" -exec rm -f {} \;
	find $(DESTDIR) -iname "*gpl*.txt" -exec rm -f {} \;

js: $(JSDEPLOY)/fingerprint.js $(JSDEPLOY)/resize.js $(JSDEPLOY)/grommunio.js $(JSDEPLOY)/extjs-mod/extjs-mod.js $(JSDEPLOY)/extjs/ext-base-all.js $(DESTDIR)/client/third-party/ux-thirdparty.js $(DEPLOYPURIFYJS) $(JSDEPLOY)/filepreviewer/pdfjs/build/pdf.sandbox.js $(JSDEPLOY)/filepreviewer/pdfjs/build/pdf.worker.js $(JSDEPLOY)/filepreviewer/pdfjs/build/pdf.js $(JSDEPLOY)/filepreviewer/pdfjs/web/viewer.js $(JSDEPLOY)/filepreviewer/ViewerJS/ImageViewerPlugin.js $(JSDEPLOY)/filepreviewer/ViewerJS/MultimediaViewerPlugin.js $(JSDEPLOY)/filepreviewer/ViewerJS/ODFViewerPlugin.js $(JSDEPLOY)/filepreviewer/ViewerJS/UnknownFilePlugin.js $(JSDEPLOY)/filepreviewer/ViewerJS/viewer.js
	cp -rn client/tinymce $(DESTDIR)/client/
	cp -rn client/tinymce-languages $(DESTDIR)/client/
	cp -rn client/tinymce-plugins $(DESTDIR)/client/
	cp -rn client/extjs $(DESTDIR)/client/
	cp -rn client/filepreviewer $(DESTDIR)/client/
	rm $(DESTDIR)/client/extjs/ext-base.js $(DESTDIR)/client/extjs/ext-base-debug.js $(DESTDIR)/client/extjs/ext-all.js $(DESTDIR)/client/extjs/resources/css/reset-min.css $(DESTDIR)/client/extjs/resources/css/xtheme-blue.css $(DESTDIR)/client/filepreviewer/pdfjs/web/debugger.js

$(DESTDIR)/%.php: %.php
	php -l $<
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/%.mo : %.po
	mkdir -p $$(dirname $@)
	$(MSGFMT) -v -o $@ $<

$(DESTDIR)/%: %
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/version: version
	git describe --abbrev=7 --always  --long | sed 's#grommunio-web-##' > version
	cp $< $@

$(DESTDIR)/client/extjs/ext-base-all.js: $(EXTJS)
	cat $+ > $@

$(JSDEPLOY)/fingerprint.js: client/fingerprint.js
	mkdir -p $(JSDEPLOY)
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/grommunio.js: $(JSFILES)
	$(PHP) tools/loadorder.php grommunio $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/extjs-mod/extjs-mod.js: $(EXTJSMODFILES)
	mkdir -p $(JSDEPLOY)/extjs-mod
	$(PHP) tools/loadorder.php extjs $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/resize.js: client/resize.js
	mkdir -p $(JSDEPLOY)
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/pdfjs/build/pdf.worker.js: client/filepreviewer/pdfjs/build/pdf.worker.js
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/build
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/pdfjs/build/pdf.sandbox.js: client/filepreviewer/pdfjs/build/pdf.sandbox.js
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/build
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/pdfjs/build/pdf.js: client/filepreviewer/pdfjs/build/pdf.js
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/build
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/pdfjs/web/viewer.js: client/filepreviewer/pdfjs/web/viewer.js
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/web
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/ViewerJS/ImageViewerPlugin.js: client/filepreviewer/ViewerJS/ImageViewerPlugin.js
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/ViewerJS/MultimediaViewerPlugin.js: client/filepreviewer/ViewerJS/MultimediaViewerPlugin.js
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/ViewerJS/ODFViewerPlugin.js: client/filepreviewer/ViewerJS/ODFViewerPlugin.js
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/ViewerJS/UnknownFilePlugin.js: client/filepreviewer/ViewerJS/UnknownFilePlugin.js
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/ViewerJS/viewer.js: client/filepreviewer/ViewerJS/viewer.js
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(DEPLOYPURIFYJS): $(PURIFYJS)
	mkdir -p $(DEPLOYPURIFY)
	# concatenate using cat
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/third-party/ux-thirdparty.js: $(THIRDPARTY)
	mkdir -p $(JSDEPLOY)/third-party
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/third-party/TinyMceTextArea-debug.js: client/third-party/tinymce/TinyMceTextArea.js
	mkdir -p $(JSDEPLOY)/third-party
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

html: $(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.html $(DESTDIR)/client/filepreviewer/ViewerJS/index.html

$(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.html: client/filepreviewer/pdfjs/web/viewer.html
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/web
	cat $^ > $(@:.html=-orig.html)
	$(HTMLCOMPILER) $(HTMLOPTIONS) --output $@ $(@:.html=-orig.html)
	rm $(@:.html=-orig.html)

$(DESTDIR)/client/filepreviewer/ViewerJS/index.html: client/filepreviewer/ViewerJS/index.html
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $^ > $(@:.html=-orig.html)
	$(HTMLCOMPILER) $(HTMLOPTIONS) --output $@ $(@:.html=-orig.html)
	rm $(@:.html=-orig.html)

config:
	cp $(DESTDIR)/config.php.dist $(DESTDIR)/config.php

# Test

.PHONY: lint
lint: vendor
	$(NPM) run lint -- --cache

.PHONY: lintci
lintci: vendor
	$(NPM) run lint -- --quiet -f junit -o eslint.xml client/zarafa/ || true

.PHONY: jstest
jstest: build
	$(NPM) run jsunit

.PHONY: jstestci
jstestci: build
	$(NPM) run jsunit -- --reporters junit

.PHONY: jstestcov
jstestcov: build
	$(NPM) run jsunit -- --reporters coverage

open-coverage: jstestcov
	${BROWSER} test/js/coverage/report-html/index.html

.PHONY: phplint
phplint:
	$(PHPMD) server text .phpmd.xml

.PHONY: phplintcli
phplintci:
	$(PHPMD) server xml .phpmd.xml --ignore-violations-on-exit | python tools/violations_to_junit.py > phpmd.xml

# NPM

.PHONY: vendor
vendor: node_modules

node_modules:
	$(NPM) install

# Icons

.SECONDEXPANSION:
$(ICONSETSDEST): $$(subst deploy/,,$$@)/iconset.json $$@/$$(notdir $$@)-icons.css
	mkdir -p $@
	cp $< $@

$(ICONSETSCSSDEST): $$(subst deploy/,,$$@)
	mkdir -p $(@D)
	cp $< $@

.PHONY: iconsets
iconsets: $(ICONS) node_modules
	$(NPM) run iconsets

# This rule should not be enabled until our build server supports nodejs.
# Just create the iconsets locally by running `npm run iconsets` whenever
# something has changed.
#$(ICONSETSCSS): $$(@D)/src/png/*/*.png $(ICONEXTENSIONSFILE) node_modules
#	$(NPM) run iconsets:$(notdir $(@D))

# this rule creates the file client/resources/scss/base/_icons.scss
# since the scss files are not compiled during the build (yet),
# this rule can only be used locally for now.
.PHONY: app-icons
app-icons: $(APPICONSSCSS)

$(APPICONSSCSS): $(APPICONS) $(APPICONSEXTENSIONSFILE) node_modules
	$(NPM) run app-icons

# Tokenizr library

# This rule should not be enabled until our build server supports nodejs.
# Just build the tokenizr library locally by running `make tokenizr` whenever
# something has changed. (i.e. the tokenizr lib has been updated)
#client/third-party/tokenizr/tokenizr.js: tokenizr
#	$(NPM) run build:tokenizr

.PHONY: tokenizr
tokenizr: node_modules
	$(NPM) run build:tokenizr

# Plugins

.PHONY: plugins
plugins:
	make -C plugins

.PHONY: clean
clean:
	make -C plugins clean
	@rm -rf deploy
	@rm -rf node_modules

print-%  :
	@echo $* = $($*)
