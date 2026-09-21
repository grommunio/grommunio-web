include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/data/Configuration.js \
          js/data/ResponseHandler.js \
          js/settings/Category.js \
          js/settings/GeneralSettingsWidget.js \
          js/PasskeyPlugin.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(shell find resources/icons/ -type f \( -name '*.png' -o -name '*.gif' -o -name '*.jpg' \) ) \
	$(shell find php/ -type f \! -name '.*' -not -path '*/tests/*' -not -path '*/examples/*' -not -path '*/vendor/bin/*' -not -path '*/.github/*' -not -iname '*.py' -not -iname 'naturalselection')

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

CSSDEPLOY = $(DESTDIR)/resources/css/

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/passkey.js $(CSSDEPLOY)/passkey.css

$(JSDEPLOY)/passkey.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='/web/plugins/passkey/js/$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(CSSDEPLOY)/passkey.css: $(CSSFILES)
	mkdir -p $(CSSDEPLOY)
	cat $(CSSFILES) > $(CSSDEPLOY)/passkey.css
