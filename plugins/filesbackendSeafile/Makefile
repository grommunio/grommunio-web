include ../shared.mk

MSGFMT ?= msgfmt

JSFILES := \
	src/js/SeafileBackend.js \
	src/js/ui/FilesShareDialogPanel.js \
	src/js/ui/FilesShareUserEditContentPanel.js \
	src/js/ui/FilesShareUserEditPanel.js \
	src/js/ui/FilesShareUserGrid.js \
	src/js/ui/FilesShareUserGridColumnModel.js \
	src/js/ui/UserGroupPredictorField.js \
	src/js/data/RecipientTypes.js \
	src/js/data/ResponseHandler.js \
	src/js/data/ShareGridRecord.js \
	src/js/data/ShareGridStore.js \
	src/js/data/singleton/ShareStore.js

COPYFILES = manifest.xml \
        $(wildcard resources/css/*.css) \
        $(wildcard resources/icons/*.png) \
        $(shell find php/ -type f -name '*.php')

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/filesbackendSeafile.js

$(JSDEPLOY)/filesbackendSeafile.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(@:.js=-debug.js)
	$(JSCOMPILER) $(@:.js=-debug.js) --output $@ \
		--source-map "url='$(shell basename $@.map)'" \
		$(JSOPTIONS)
