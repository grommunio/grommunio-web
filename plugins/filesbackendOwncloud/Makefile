include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/data/singleton/ShareStore.js \
          js/data/ShareGridStore.js \
          js/data/RecipientTypes.js \
          js/data/ResponseHandler.js \
          js/data/ShareGridRecord.js \
          js/OwncloudBackend.js \
          js/ui/FilesShareUserGrid.js \
          js/ui/FilesShareUserGridColumnModel.js \
          js/ui/FilesShareUserEditPanel.js \
          js/ui/FilesShareUserEditContentPanel.js \
          js/ui/UserGroupPredictorField.js \
          js/ui/FilesShareDialogPanel.js

COPYFILES = manifest.xml \
        $(wildcard resources/css/*.css) \
        $(wildcard resources/icons/*.png) \
        $(shell find php/ -type f -name '*.php')

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/filesbackendOwncloud.js

$(JSDEPLOY)/filesbackendOwncloud.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
	        $(JSOPTIONS)
