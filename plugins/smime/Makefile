include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/data/JsonCertificateReader.js \
          js/data/SmimeAttachmentRecord.js \
          js/data/SmimeAttachmentStore.js \
          js/data/SmimeCertificateRecord.js \
          js/data/SmimeCertificateStore.js \
          js/data/SmimeResponseHandler.js \
          js/dialogs/ChangePassphraseContentPanel.js \
          js/dialogs/ChangePassphrasePanel.js \
          js/dialogs/PassphraseContentPanel.js \
          js/dialogs/PassphraseWindow.js \
          js/ui/FormPanel.js \
          js/ui/Viewport.js \
          js/settings/SettingsPublickeyGrid.js \
          js/settings/SettingsPublickeyPanel.js \
          js/settings/SettingsPublickeyWidget.js \
          js/settings/SettingsSmimeCategory.js \
          js/settings/SettingsSmimeWidget.js \
          js/settings/UploadCertificateWidget.js \
          js/SmimePlugin.js \
          js/SmimeText.js

COPYFILES = LICENSE.txt manifest.xml config.php \
        $(wildcard resources/icons/*.png) \
        $(shell find php/ -type f -name '*.php')

CSSFILES = resources/css/smime-styles.css

CSSDEPLOY = $(DESTDIR)/resources/css/

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/files.js $(CSSDEPLOY)/files.css

$(JSDEPLOY)/files.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/files-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)

$(CSSDEPLOY)/files.css: $(CSSFILES)
	mkdir -p $(CSSDEPLOY)
	cat $(CSSFILES) > $(CSSDEPLOY)/files.css