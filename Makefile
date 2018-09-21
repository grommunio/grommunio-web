# Tools


ANT ?= ant
PHPMD ?= phpmd
NPM ?= npm
PHP ?= php
JAVA ?= java
MSGFMT ?= msgfmt
APACHECONF = kopano-webapp.conf
JSDEPLOY = $(DESTDIR)/client
JSCOMPILER ?= $(JAVA) -jar tools/lib/compiler.jar
JSOPTIONS = --externs client/externs.js \
	--compilation_level SIMPLE --warning_level VERBOSE --jscomp_off=es5Strict \
	--jscomp_off=globalThis --jscomp_off=misplacedTypeAnnotation --jscomp_off=nonStandardJsDocs \
	--jscomp_off=missingProperties --jscomp_off=invalidCasts --jscomp_off=checkTypes \
	--jscomp_warning=visibility --jscomp_warning=unknownDefines --jscomp_warning=undefinedVars \
	--jscomp_warning=strictModuleDepCheck --jscomp_warning=fileoverviewTags --jscomp_warning=deprecated \
	--jscomp_error=checkVars --jscomp_warning=checkRegExp --jscomp_warning=accessControls

# Files

DESTDIR ?= deploy

# server files
APACHECONFDEST = $(addprefix $(DESTDIR)/, $(APACHECONF))
PHPFILES = $(filter-out $(DESTDIR)/config.php, $(filter-out $(DESTDIR)/debug.php, $(patsubst %.php,$(DESTDIR)/%.php,$(wildcard server/includes/*/*.php server/includes/*.php *.php))))
DISTFILES = $(addprefix $(DESTDIR)/,config.php.dist debug.php.dist)
ROBOTS = $(addprefix $(DESTDIR)/, robots.txt)
HTACCESS = $(addprefix $(DESTDIR)/, .htaccess)
POS = $(wildcard server/language/*/LC_MESSAGES/zarafa_webapp.po)
MOS = $(patsubst %.po,$(DESTDIR)/%.mo,$(POS))

# client files
CSS = $(wildcard client/resources/css/*/*.css client/extjs/ux/css/ux-all.css client/extjs/resources/css/*.css)
CSSDEST = $(addprefix $(DESTDIR)/, $(CSS))
IMAGEDIR = client/resources/images
IMAGES = $(wildcard  $(IMAGEDIR)/*.png  $(IMAGEDIR)/*.jpg $(IMAGEDIR)/*.ico $(IMAGEDIR)/whatsnew/*.png)
IMAGESDEST = $(addprefix $(DESTDIR)/, $(IMAGES))
# TODO: moved to client/
#TEMPLATEJS = server/includes/templates/template.js
#TEMPATEJSDEST = $(addprefix $(DESTDIR)/, $(TEMPLATEJS))
JSFILES = $(shell find client/zarafa -name '*.js')
EXTJSMODFILES = $(wildcard client/extjs-mod/*.js)
KOPANOCSS = $(DESTDIR)/client/resources/css/kopano.css
EXTJS = client/extjs/ext-base.js client/extjs/ext-all.js


POFILES = $(wildcard server/language/*/*/*.po)
PHPFILES = config.php.dist kopano.php $(wildcard server/includes/*.php) $(wildcard server/includes/*/*.php)
JSFILES = $(wildcard client/zarafa/*.js) $(wildcard client/zarafa/*/*.js)
CORE_FILES = $(POFILES) $(PHPFILES) $(JSFILES)


# Build

.PHONY: deploy server client all

all: deploy server client

build: node_modules deploy
test: jstest



server: $(MOS) $(PHPFILES) $(DESTDIR)/$(APACHECONF) $(DISTFILES) $(ROBOTS) $(HTACCESS) $(DESTDIR)/version
client: $(CSSDEST) $(IMAGESDEST) $(CSSDEST) $(KOPANOCSS) js
	cp -r client/resources/fonts $(DESTDIR)/client/resources/
	# FIXME: exclude JavaScript, which is loaded in kopano.js
	cp -r client/zarafa/core/themes $(DESTDIR)/client/

js: $(JSDEPLOY)/fingerprint.js $(TEMPATEJSDEST) $(JSDEPLOY)/kopano.js $(JSDEPLOY)/extjs-mod/extjs-mod.js $(DESTDIR)/client/extjs/ext-base-all.js $(DESTDIR)/client/third-party/ux-thirdparty.js
	cp -r client/tinymce $(DESTDIR)/client/
	cp -r client/tinymce-languages $(DESTDIR)/client/
	cp -r client/tinymce-plugins $(DESTDIR)/client/
	cp -r client/extjs $(DESTDIR)/client/

# TODO(jelle): add plugin file dependency's (or Makefile in plugins)
#deploy: $(CORE_FILES)
#	$(ANT) deploy
	# Ant doesn't update the deploy modification time
#	touch $@
deploy:
	mkdir -p $(DESTDIR)
	mkdir -p $(DESTDIR)/client

$(DESTDIR)/%.mo : %.po
	mkdir -p $$(dirname $@)
	$(MSGFMT) -v -o $@ $<

$(DESTDIR)/%.php: %.php
	php -l $<
	mkdir -p $$(dirname $@)
	cp $< $@

$(APACHECONFDEST): $(APACHECONF)
	cp $< $@

$(ROBOTS): robots.txt
	cp $< $@

$(HTACCESS): .htaccess
	cp $< $@

$(DESTDIR)/%.dist: %.dist
	cp $< $@

$(KOPANOCSS): client/resources/css/design.css
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/%.css: %.css
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/%.png: %.png
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/%.jpg: %.jpg
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/%.ico: %.ico
	mkdir -p $$(dirname $@)
	cp $< $@

$(DESTDIR)/version: version
	cp $< $@

$(DESTDIR)/client/extjs/ext-base-all.js: $(EXTJS)
	cat $+ > $@

$(JSDEPLOY)/fingerprint.js: client/fingerprint.js
	$(JSCOMPILER) --js $< --js_output_file $@ $(JSOPTIONS)

#$(TEMPATEJSDEST): $(TEMPLATEJS)
#	$(JSCOMPILER) --js $< --js_output_file $@

$(JSDEPLOY)/kopano.js: $(JSFILES)
	$(PHP) tools/loadorder.php kopano $(@:.js=-debug.js)
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)

$(JSDEPLOY)/extjs-mod/extjs-mod.js: $(EXTJSMODFILES)
	mkdir -p $(JSDEPLOY)/extjs-mod
	$(PHP) tools/loadorder.php extjs $(@:.js=-debug.js)
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/extjs-mod/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map $(JSOPTIONS)

$(JSDEPLOY)/third-party/ux-thirdparty.js: client/third-party/tinymce/TinyMceTextArea.js
	$(JSCOMPILER) --js $< --js_output_file $@ $(JSOPTIONS)

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

.PHONY: clean
clean:
	@rm -rf deploy
	@rm -rf node_modules
