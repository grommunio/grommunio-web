include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/ChatPlugin.js \
          js/ui/ContentPanel.js \
          js/ui/Panel.js \
          js/settings/Category.js \
          js/settings/GeneralSettingsWidget.js \
          js/Notifications.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/img/*.png) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/chat.js

$(JSDEPLOY)/chat.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
