include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/kendox-plugin.js \
          js/kendox-settings.js \
          js/kendox-upload-dialog.js

COPYFILES = manifest.xml config.php \
        $(shell find php/ -type f -name '*.php')

CSSFILES = resources/kendox.css

CSSDEPLOY = $(DESTDIR)/resources/

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/kendox.js $(CSSDEPLOY)/kendox.css

$(JSDEPLOY)/kendox.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(CSSDEPLOY)/kendox.css: $(CSSFILES)
	mkdir -p $(CSSDEPLOY)
	cat $(CSSFILES) > $(CSSDEPLOY)/kendox.css
