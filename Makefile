# Tools

PHPMD ?= phpmd
PHPDOC ?= phpdoc
PHPDOC_CONFIG ?= phpdoc.dist.xml
NPM ?= npm
MSGFMT ?= msgfmt
PHP ?= php

# Variables

DESTDIR ?= deploy

# Javascript compiler

JSDEPLOY = $(DESTDIR)/client
DEPLOYPURIFY = $(JSDEPLOY)/dompurify

JSCOMPILER ?= node_modules/terser/bin/terser
CSSCOMPILER ?= BROWSERSLIST_CONFIG=$(CURDIR)/.browserslistrc node_modules/postcss-cli/index.js
HTMLCOMPILER ?= node_modules/html-minifier-terser/cli.js
SVGCOMPRESS ?= node_modules/svgo/bin/svgo
PRECOMPRESS ?= node tools/precompress.mjs

JSOPTIONS = --compress ecma=2015,computed_props=false --mangle reserved=['FormData','Ext','Zarafa','container','settings','properties','languages','serverconfig','user','version','urlActionData','console','Tokenizr','module','define','global','require','proxy','_','dgettext','dngettext','dnpgettext','ngettext','pgettext','onResize','tinymce','resizeLoginBox','userManager','DOMPurify','PDFJS','odf','L','GeoSearch','inlineCSS','CSSTree']
CSSOPTIONS = --no-map --use postcss-preset-env --use cssnano --use $(CURDIR)/tools/postcss-asset-version.mjs
WEBAPPVERSION = $(shell git describe --abbrev=7 --always --long | sed 's/grommunio-web-//')
HTMLOPTIONS = --collapse-whitespace --remove-comments

# Server files

DISTFILES = $(addprefix $(DESTDIR)/,config.php.dist debug.php.dist)
LANGTXT = $(wildcard server/language/*/language.txt)
LANGTXTDEST = $(addprefix $(DESTDIR)/, $(LANGTXT))
POS = $(wildcard server/language/*/LC_MESSAGES/grommunio_web.po)
MOS = $(patsubst %.po,$(DESTDIR)/%.mo,$(POS))
INCLUDES = $(sort $(shell find server/includes -name '*.php'))
PHPFILES = $(filter-out $(DESTDIR)/config.php, $(filter-out $(DESTDIR)/debug.php, $(patsubst %.php,$(DESTDIR)/%.php,$(wildcard *.php) $(INCLUDES))))
SERVERROOTFILES = $(addprefix $(DESTDIR)/,server/manifest.dtd manifest.webmanifest)

# Client files

# the ExtJS stylesheets arrive with the mirrored extjs tree
CSS = $(filter-out client/resources/css/icon-masks.css client/resources/css/plugin-icons.css, $(wildcard client/resources/css/*.* client/resources/css/*/*.*))
CSSDEST = $(addprefix $(DESTDIR)/, $(CSS))
IMAGEDIR = client/resources/images
IMAGES = $(filter-out client/resources/images/app-icons.extensions.json, $(wildcard $(IMAGEDIR)/*.*))
IMAGESDEST = $(addprefix $(DESTDIR)/, $(IMAGES))
EXTJSMODFILES = $(wildcard client/extjs-mod/*.js)
ICONSETS = $(notdir $(filter-out client/resources/iconsets/extensions.json, $(wildcard client/resources/iconsets/*)))
ICONSETSDEST = $(addprefix $(DESTDIR)/client/resources/iconsets/, $(ICONSETS))
ICONSETSCSS = $(foreach iconsetdir,$(ICONSETS),client/resources/iconsets/$(iconsetdir)/$(iconsetdir)-icons.css)
ICONSETSCSSDEST = $(addprefix $(DESTDIR)/, $(ICONSETSCSS))
EXTJS = client/extjs/ext-base.js client/extjs/ext-all.js client/extjs/ux/ux-all.js
EXTJSDEBUG = $(EXTJS:.js=-debug.js)
THIRDPARTY = $(sort $(shell find client/third-party -name '*.js')) client/third-party/tokenizr/tokenizr.js

PURIFYJS = client/dompurify/purify.min.js
DEPLOYPURIFYJS = $(DEPLOYPURIFY)/purify.js

JSFILES = $(sort $(shell find client/zarafa -name '*.js'))

# Build

.PHONY: deploy server client all js css html clearartifacts precompress

all: deploy

deploy: node_modules server client plugins css clearartifacts precompress

build: node_modules deploy

local-mos:
	# Use this target to enable translations in case
	# /usr/share/grommunio-web is pointing to a Git working copy
	${MAKE} mos DESTDIR=.

mos: ${MOS}

server: mos $(LANGTXTDEST) $(PHPFILES) $(DISTFILES) $(DESTDIR)/version $(SERVERROOTFILES)

client: $(CSSDEST) $(ICONSETSDEST) $(IMAGESDEST) html js
	cp -r client/resources/fonts $(DESTDIR)/client/resources/

# TinyMCE ships minified CSS; re-processing it only added an @supports
# probe that crashed the Firefox 154 style parser
css: client plugins
	$(CSSCOMPILER) $(CSSOPTIONS) --replace \
		"$(DESTDIR)/client/**/*.css" "!$(DESTDIR)/client/tinymce/**" \
		"!$(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.css" \
		"$(DESTDIR)/plugins/**/*.css"

svgo: node_modules
	find client plugins -type f -name "*.svg" -exec $(SVGCOMPRESS) --multipass {} \;

.PHONY: build-icons
build-icons: node_modules svgo
	node tools/build-icons.js

.PHONY: sync-images
sync-images: node_modules
	node tools/sync-images.js --extract

.PHONY: sync-images-report
sync-images-report: node_modules
	node tools/sync-images.js --report

clearartifacts: client plugins
	find $(DESTDIR) -iname "*readme*" -exec rm -f {} \;

# .br/.gz siblings for nginx brotli_static/gzip_static; debug bundles and
# source maps are left to runtime compression
precompress: css clearartifacts
	$(PRECOMPRESS) --skip '-debug\.js$$' --skip '\.map$$' $(DESTDIR)

# Vendored trees are mirrored whole whenever anything below them changed;
# one copied file stands for the tree, a directory could be created early
# as a side effect of another rule. Files that other rules derive are removed
# from the fresh copy, or their newer mtime would make those rules skip.
define vendor_tree
$(JSDEPLOY)/$(1)/$(2): $$(shell find client/$(1) -type f -o -type d)
	rm -rf $(JSDEPLOY)/$(1)
	mkdir -p $(JSDEPLOY)
	cp -r client/$(1) $(JSDEPLOY)/$(1)
	$(if $(3),rm -f $(addprefix $(JSDEPLOY)/$(1)/,$(3)))
VENDORED += $(JSDEPLOY)/$(1)/$(2)
endef
VIEWERJS = $(addprefix ViewerJS/,ImageViewerPlugin.js MultimediaViewerPlugin.js ODFViewerPlugin.js DocxViewerPlugin.js XlsxViewerPlugin.js UnknownFilePlugin.js viewer.js video-js/video.js vendor/jszip.min.js vendor/docx-preview.min.js vendor/xlsx.full.min.js)
PREVIEWERDERIVED = $(VIEWERJS) ViewerJS/index.html pdfjs/web/viewer.html pdfjs/web/viewer.mjs
$(eval $(call vendor_tree,tinymce,tinymce.min.js))
$(eval $(call vendor_tree,tinymce-languages,de.js))
$(eval $(call vendor_tree,extjs,resources/images/default/s.gif,$(notdir $(EXTJS) $(EXTJSDEBUG)) $(addprefix ux/,$(notdir $(filter %ux-all.js %ux-all-debug.js,$(EXTJS) $(EXTJSDEBUG))))))
$(eval $(call vendor_tree,filepreviewer,ViewerJS/webodf.js,$(PREVIEWERDERIVED)))

js: $(VENDORED) $(JSDEPLOY)/fingerprint.js $(JSDEPLOY)/resize.js $(JSDEPLOY)/grommunio.js $(JSDEPLOY)/extjs-mod/extjs-mod.js $(JSDEPLOY)/extjs/ext-base-all.js $(JSDEPLOY)/extjs/ext-base-all-debug.js $(DESTDIR)/client/third-party/ux-thirdparty.js $(DEPLOYPURIFYJS) $(addprefix $(JSDEPLOY)/filepreviewer/,$(VIEWERJS))

$(DESTDIR)/%.php: %.php
	${PHP} -l $<
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

# One ExtJS bundle per loader mode; the copies of its parts do not ship
$(DESTDIR)/client/extjs/ext-base-all.js: $(EXTJS) $(JSDEPLOY)/extjs/resources/images/default/s.gif
	rm -f $(addprefix $(DESTDIR)/,$(EXTJS) $(EXTJSDEBUG))
	for f in $(EXTJS); do cat $$f; echo; done > $@

$(DESTDIR)/client/extjs/ext-base-all-debug.js: $(EXTJSDEBUG) $(JSDEPLOY)/extjs/resources/images/default/s.gif
	for f in $(EXTJSDEBUG); do cat $$f; echo; done > $@

$(JSDEPLOY)/fingerprint.js: client/fingerprint.js
	mkdir -p $(JSDEPLOY)
	cat $< > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='client/$(@F).map'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/grommunio.js: $(JSFILES)
	$(PHP) tools/loadorder.php grommunio $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/extjs-mod/extjs-mod.js: $(EXTJSMODFILES)
	mkdir -p $(JSDEPLOY)/extjs-mod
	$(PHP) tools/loadorder.php extjs $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/resize.js: client/resize.js
	mkdir -p $(JSDEPLOY)
	cat $< > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)

# ViewerJS loads its plugins and libraries at run time by relative URL, so
# those literals get the version too. The vendored docx-preview, JSZip and
# SheetJS ship minified and are copied verbatim.
$(JSDEPLOY)/filepreviewer/ViewerJS/%.js: client/filepreviewer/ViewerJS/%.js
	mkdir -p $(@D)
	sed -E "s#([\"'])(\./[A-Za-z0-9_./-]+\.js)\1#\1\2?version=$(WEBAPPVERSION)\1#g" $< > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/filepreviewer/ViewerJS/vendor/%.js: client/filepreviewer/ViewerJS/vendor/%.js
	mkdir -p $(@D)
	cp $< $@

$(addprefix $(JSDEPLOY)/filepreviewer/,$(PREVIEWERDERIVED)): $(JSDEPLOY)/filepreviewer/ViewerJS/webodf.js

$(DEPLOYPURIFYJS): $(PURIFYJS)
	mkdir -p $(DEPLOYPURIFY)
	# concatenate using cat
	cat $< > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)

$(JSDEPLOY)/third-party/ux-thirdparty.js: $(THIRDPARTY)
	mkdir -p $(JSDEPLOY)/third-party
	cat $^ > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "base='$(@D)',url='$(@F).map'" \
	        $(JSOPTIONS)

html: $(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.html $(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.mjs $(DESTDIR)/client/filepreviewer/ViewerJS/index.html

# The viewer pages load their scripts relative to themselves, so those URLs
# need the version too or the two month cache serves the previous pdf.js
$(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.html: client/filepreviewer/pdfjs/web/viewer.html
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/web
	cat $< > $(@:.html=-orig.html)
	$(HTMLCOMPILER) $(HTMLOPTIONS) --output $@ $(@:.html=-orig.html)
	rm $(@:.html=-orig.html)
	sed -i -E 's#(src|href)="([^"?:]+\.(mjs|js|css|json))"#\1="\2?version=$(WEBAPPVERSION)"#g' $@

$(DESTDIR)/client/filepreviewer/pdfjs/web/viewer.mjs: client/filepreviewer/pdfjs/web/viewer.mjs
	mkdir -p $(JSDEPLOY)/filepreviewer/pdfjs/web
	sed -e 's#"../build/pdf.worker.mjs"#"../build/pdf.worker.mjs?version=$(WEBAPPVERSION)"#' \
	    -e 's#"../build/pdf.sandbox.mjs"#"../build/pdf.sandbox.mjs?version=$(WEBAPPVERSION)"#' $< > $@

$(DESTDIR)/client/filepreviewer/ViewerJS/index.html: client/filepreviewer/ViewerJS/index.html
	mkdir -p $(JSDEPLOY)/filepreviewer/ViewerJS
	cat $< > $(@:.html=-orig.html)
	$(HTMLCOMPILER) $(HTMLOPTIONS) --output $@ $(@:.html=-orig.html)
	rm $(@:.html=-orig.html)
	sed -i -E 's#(src|href)="([^"?:]+\.(mjs|js|css|json))"#\1="\2?version=$(WEBAPPVERSION)"#g' $@

config:
	cp $(DESTDIR)/config.php.dist $(DESTDIR)/config.php

# Quality checks

.PHONY: lint
lint: vendor
	$(NPM) run lint -- --cache

.PHONY: lintci
lintci: vendor
	$(NPM) run lint -- --quiet -f junit -o eslint.xml client/zarafa/ || true

.PHONY: phplint
phplint:
	$(PHPMD) server text .phpmd.xml

.PHONY: phplintci
phplintci:
	$(PHPMD) server xml .phpmd.xml --ignore-violations-on-exit | python tools/violations_to_junit.py > phpmd.xml

.PHONY: phpdoc
phpdoc:
	$(PHPDOC) run --config $(PHPDOC_CONFIG)

# NPM

.PHONY: vendor
vendor: node_modules

node_modules:
	$(NPM) install

# Icons

.SECONDEXPANSION:
$(ICONSETSDEST): $$(patsubst $(DESTDIR)/%,%,$$@)/iconset.json $$@/$$(notdir $$@)-icons.css
	mkdir -p $@
	cp $< $@

$(ICONSETSCSSDEST): $$(patsubst $(DESTDIR)/%,%,$$@)
	mkdir -p $(@D)
	cp $< $@

# Plugins

.PHONY: plugins
plugins: node_modules
	${MAKE} -C plugins DESTDIR=$(abspath $(DESTDIR))/plugins

.PHONY: clean
clean:
	${MAKE} -C plugins clean
	@rm -rf deploy
	@rm -rf node_modules

print-%  :
	@echo $* = $($*)
