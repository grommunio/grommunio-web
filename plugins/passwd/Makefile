include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/ABOUT.js js/PasswdPlugin.js \
	js/data/PasswdResponseHandler.js \
	js/external/PasswordMeter.js \
	js/settings/PasswdPanel.js \
	js/settings/SettingsPasswdCategory.js \
	js/settings/SettingsPasswdWidget.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/passwd.js

$(JSDEPLOY)/passwd.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/passwd-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
