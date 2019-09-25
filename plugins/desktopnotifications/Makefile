include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/ABOUT.js js/DesktopNotifier.js \
	js/DesktopNotifications.js \
	js/DesktopNotificationsPlugin.js \
	js/settings/SettingsNotificationsCategory.js \
	js/settings/SettingsNotificationsWidget.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard resources/*) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/desktopnotifications.js

$(JSDEPLOY)/desktopnotifications.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/desktopnotifications-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
