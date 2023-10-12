include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/DesktopNotifier.js \
	js/DesktopNotifications.js \
	js/DesktopNotificationsPlugin.js \
	js/settings/SettingsNotificationsCategory.js \
	js/settings/SettingsNotificationsWidget.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/*) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/desktopnotifications.js

$(JSDEPLOY)/desktopnotifications.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
