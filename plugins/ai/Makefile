include ../shared.mk

JSFILES = js/data/AIResponseHandler.js \
          js/data/AIClient.js \
          js/ui/AIAssistantPanel.js \
          js/ui/AIAssistantWindow.js \
          js/ui/AIComposeMenu.js \
          js/ui/AIActionChips.js \
          js/SmartActions.js \
          js/settings/SettingsAICategory.js \
          js/settings/SettingsAIWidget.js \
          js/AIPlugin.js

COPYFILES = manifest.xml config.php \
	$(wildcard resources/css/*.css) \
	$(wildcard resources/icons/*.svg) \
	$(wildcard php/*.php) \
	$(wildcard php/lib/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/ai.js

$(JSDEPLOY)/ai.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
