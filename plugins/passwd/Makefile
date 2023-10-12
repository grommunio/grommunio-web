include ../shared.mk

JSFILES = js/PasswdPlugin.js \
	js/data/PasswdResponseHandler.js \
	js/external/PasswordMeter.js \
	js/settings/PasswdPanel.js \
	js/settings/SettingsPasswdCategory.js \
	js/settings/SettingsPasswdWidget.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/images/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/passwd.js

$(JSDEPLOY)/passwd.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
