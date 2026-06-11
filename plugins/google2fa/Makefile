include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/Google2FAPlugin.js \
          js/data/Configuration.js \
          js/data/ResponseHandler.js \
          js/settings/Category.js \
          js/settings/GeneralSettingsWidget.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(shell find resources/icons/ -type f \( -name '*.png' -o -name '*.gif' -o -name '*.jpg' \) ) \
	$(shell find php/ -type f \! -name '.*' -not -path '*/tests/*' -not -path '*/examples/*' -not -path '*/vendor/bin/*' -not -path '*/.github/*' -not -iname '*.py' -not -iname 'naturalselection')

CSSDEPLOY = $(DESTDIR)/resources/css/

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/google2fa.js $(CSSDEPLOY)/google2fa.css

$(JSDEPLOY)/google2fa.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)

$(CSSDEPLOY)/google2fa.css: $(CSSFILES)
	mkdir -p $(CSSDEPLOY)
	cat $(CSSFILES) > $(CSSDEPLOY)/google2fa.css
