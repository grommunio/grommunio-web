include ../shared.mk

MSGFMT ?= msgfmt

JSFILES = js/data/ViewModes.js \
          js/data/FileTypes.js \
          js/data/AccountRecord.js \
          js/data/FilesRecordStore.js \
          js/data/ComponentBox.js \
          js/data/FilesJsonReader.js \
          js/data/FilesFolderRecord.js \
          js/data/FilesHierarchyStore.js \
          js/data/FilesStoreRecord.js \
          js/data/FilesRecord.js \
          js/data/FilesFolderResponseHandler.js \
          js/data/FilesProxy.js \
          js/data/AccountStore.js \
          js/data/FilesShadowProxy.js \
          js/data/Views.js \
          js/data/FilesBackendStore.js \
          js/data/FilesFoldersSubStore.js \
          js/data/ResponseHandler.js \
          js/data/FilesShadowStore.js \
          js/data/FilesBackendRecord.js \
          js/data/Utils.js \
          js/data/FilesHierarchyProxy.js \
          js/data/AsyncFilesTreeNode.js \
          js/data/DataModes.js \
          js/data/NavigatorTreeLoader.js \
          js/data/Actions.js \
          js/FilesContextModel.js \
          js/ui/FilesFolderNode.js \
          js/ui/FilesRootFolderNode.js \
          js/ui/FilesMainContextMenu.js \
          js/ui/FilesRecordGridColumnModel.js \
          js/ui/FilesListToolbar.js \
          js/ui/FilesTopToolbar.js \
          js/ui/FilesRecordIconView.js \
          js/ui/FolderNodeUI.js \
          js/ui/TreeSorter.js \
          js/ui/dialogs/SharePanel.js \
          js/ui/dialogs/FilesUploadContentPanel.js \
          js/ui/dialogs/UploadStatusContentPanel.js \
          js/ui/dialogs/CreateFolderPanel.js \
          js/ui/dialogs/UploadStatusPanel.js \
          js/ui/dialogs/AttachFromFilesContentPanel.js \
          js/ui/dialogs/AttachFromFilesPanel.js \
          js/ui/dialogs/ShareContentPanel.js \
          js/ui/dialogs/SaveToFilesPanel.js \
          js/ui/dialogs/FilesRecordContentPanel.js \
          js/ui/dialogs/SaveToFilesContentPanel.js \
          js/ui/dialogs/CreateFolderContentPanel.js \
          js/ui/dialogs/AttachFromFilesGridPanel.js \
          js/ui/UploadComponent.js \
          js/ui/FilesRecordGridView.js \
          js/ui/MultipleFileUploadField.js \
          js/ui/Tree.js \
          js/ui/NavigatorTreePanel.js \
          js/ui/FilesRecordDetailsPanel.js \
          js/ui/FilesHierarchyRootNode.js \
          js/ui/FilesTreeContextMenu.js \
          js/ui/FilesRecordAccountView.js \
          js/ui/FilesPreviewPanel.js \
          js/ui/snippets/FilesQuotaBar.js \
          js/ui/snippets/WebODFPanel.js \
          js/ui/snippets/FilesNavigationBar.js \
          js/ui/snippets/PDFjsPanel.js \
          js/ui/FilesRecordViewPanel.js \
          js/ui/FilesMainPanel.js \
          js/settings/data/AccountRenderUtil.js \
          js/settings/SettingsAccountWidget.js \
          js/settings/SettingsResetWidget.js \
          js/settings/ui/AccountEditPanel.js \
          js/settings/ui/FeatureQuotaInfoPanel.js \
          js/settings/ui/AccountGridColumnModel.js \
          js/settings/ui/AccountPanel.js \
          js/settings/ui/FeatureQuotaInfoContentPanel.js \
          js/settings/ui/AccountEditContentPanel.js \
          js/settings/ui/AccountGrid.js \
          js/settings/ui/FeatureVersionInfoPanel.js \
          js/settings/ui/FeatureVersionInfoContentPanel.js \
          js/settings/SettingsMainCategory.js \
          js/FilesPlugin.js \
          js/ABOUT.js \
          js/FilesContext.js

COPYFILES = LICENSE.txt manifest.xml config.php \
        js/external/Ext.ux.form.MetaForm-debug.js \
        js/external/Ext.ux.form.MetaForm.js \
        $(wildcard resources/icons/*.png) \
        $(wildcard resources/icons/*.gif) \
        $(wildcard resources/icons/**/*.png) \
        $(wildcard resources/images/**/*.png) \
        $(shell find php/ -type f -name '*.php')

CSSFILES = resources/css/files-main.css \
        resources/css/icons.css \
        resources/css/navbar.css \
        resources/css/pdfjspanel.css \
        resources/css/webodfpanel.css

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