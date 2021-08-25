include ../shared.mk

JSFILES = js/ABOUT.js js/MDM.js \
	js/data/MDMDeviceFolderStore.js \
	js/data/MDMDeviceFolderRecord.js \
	js/data/JsonDeviceFolderReader.js \
	js/data/MDMResponseHandler.js \
	js/data/MDMDeviceRecord.js \
	js/data/JsonDeviceReader.js \
	js/data/MDMDeviceFolderWriter.js \
	js/data/MDMDeviceStore.js \
	js/data/ProvisioningStatus.js \
	js/data/MDMDeviceProxy.js \
	js/data/MDMDeviceResponseHandler.js \
	js/data/MDMHierarchyTreeLoader.js \
	js/settings/MDMSettingsWidget.js \
	js/settings/MDMSettingsCategory.js \
	js/dialogs/MDMDeviceContentPanel.js \
	js/dialogs/MDMDeviceGeneralTab.js \
	js/dialogs/MDMDevicePanel.js \
	js/dialogs/MDMDeviceDetailsTab.js \
	js/dialogs/MDMManageSharedFolderContentPanel.js \
	js/dialogs/MDMManageSharedFolderPanel.js \
	js/ui/Renderers.js \
	js/ui/MDMFolderNodeUI.js \
	js/ui/MDMHierarchyTreePanel.js

COPYFILES = LICENSE.txt manifest.xml config.php \
	$(wildcard resources/icons/*.png) \
	$(wildcard resources/css/*.css) \
	$(wildcard php/*.php)

COPYFILESDEST = $(addprefix $(DESTDIR)/, $(COPYFILES))

all: $(COPYFILESDEST) $(JSDEPLOY)/mdm.js

$(JSDEPLOY)/mdm.js: $(JSFILES)
	mkdir -p $(DESTDIR)/js
	cat $(JSFILES) > $(JSDEPLOY)/mdm-debug.js
	$(JSCOMPILER) --js $(@:.js=-debug.js) --js_output_file $@ \
		--source_map_location_mapping=$(JSDEPLOY)/js/\| \
		--output_wrapper="%output%//# sourceMappingURL=$(shell basename $@.map)" \
		--create_source_map $@.map \
		$(JSOPTIONS)
