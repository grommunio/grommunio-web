Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.FilesUploadContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.filesuploadcontentpanel
 *
 * This class displays the main upload dialog if a users click on the + sign in the tabbar. It will
 * show a simple folder selector tree and a file upload field.
 */
Zarafa.plugins.files.ui.dialogs.FilesUploadContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @var string The selected destination path
	 */
	targetFolder: undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'filesplugin.filesuploadcontentpanel',
			layout: 'fit',
			title : dgettext('plugin_files', 'Upload file'),
			items : [{
				xtype     : 'form',
				ref       : 'mainuploadform',
				layout    : {
					type : 'vbox',
					align: 'stretch',
					pack : 'start'
				},
				fileUpload: true,
				padding   : 5,
				items     : [
					this.createFolderSelector(),
					this.createUploadField()
				],
				buttons   : this.createActionButtons()
			}]
		});

		Zarafa.plugins.files.ui.dialogs.FilesUploadContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Generates and returns the upload field UI.
	 *
	 * @returns {Object}
	 * @private
	 */
	createUploadField: function () {
		return {
			xtype : 'panel',
			title : dgettext('plugin_files', 'Select a file') + ' (' + dgettext('plugin_files', 'Maximum upload size') + ': ' + Zarafa.plugins.files.data.Utils.Format.fileSize(Zarafa.plugins.files.data.Utils.Core.getMaxUploadFilesize()) + '):',
			layout: 'fit',
			padding: 10,
			items : [{
				xtype     : 'filesplugin.multiplefileuploadfield',
				buttonText: dgettext('plugin_files', 'Browse') + '...',
				name      : 'attachments[]',
				disabled  : true,
				listeners : {
					'fileselected': this.onUploadFieldChanged,
					'scope'       : this
				},
				ref       : '../../mainuploadfield'
			}]
		};
	},

	/**
	 * Generates and returns the folder selector treepanel UI.
	 *
	 * @returns {Object}
	 * @private
	 */
	createFolderSelector: function () {
		var filesContext = container.getContextByName("filescontext");
		var model = filesContext.getModel();
		return {
			xtype : 'filesplugin.tree',
			title : dgettext('plugin_files', 'Select upload folder') + ':',
			FilesFilter: Zarafa.plugins.files.data.FileTypes.FOLDER,
			flex:1,
			store : model.getHierarchyStore(),
			listeners : {
				click : this.onFolderSelected,
				scope : this
			}
		};
	},

	/**
	 * Generates and returns the buttons for the dialog.
	 *
	 * @returns {*[]}
	 */
	createActionButtons: function () {
		return [{
			xtype   : 'button',
			ref     : '../../mainuploadbutton',
			disabled: true,
			text    : '&nbsp;&nbsp;' + dgettext('plugin_files', 'Upload'),
			iconCls : 'icon_files',
			handler : this.doUpload,
			scope   : this
		}, {
			xtype  : 'button',
			text   : dgettext('plugin_files', 'Cancel'),
			handler: this.onClose,
			scope  : this
		}];
	},

	/**
	 * Event handler triggered when {@link Zarafa.plugins.files.ui.FilesFolderNode FilesFolderNode}
	 * has been selected in {@link Zarafa.plugins.files.ui.Tree TreePanel}. The selected folder id
	 * will be stored to {@link #targetFolder}.
	 *
	 * @param {Zarafa.plugins.files.ui.FilesFolderNode} node The node which selected in {@link Zarafa.plugins.files.ui.Tree TreePanel}
	 */
	onFolderSelected: function (node) {
		var folder = node.getFolder();
		this.targetFolder = folder.get('folder_id');
		this.dialog.mainuploadfield.enable();
	},

	/**
	 * Eventhandler for the fileselected event of the filefield.
	 * This function will check the filesize if the browser supports the file API.
	 *
	 * @param field
	 * @param newValue
	 * @param oldValue
	 */
	onUploadFieldChanged: function (field, newValue, oldValue) {
		if (!Ext.isEmpty(newValue)) {
			var form = field.ownerCt.ownerCt.getForm();

			var files;
			files = this.mainuploadfield.fileInput.dom.files;

			var filesTooLarge = false;
			Ext.each(files, function (file) {
				if (file.size > Zarafa.plugins.files.data.Utils.Core.getMaxUploadFilesize()) {

					this.mainuploadfield.reset();

					Zarafa.common.dialogs.MessageBox.show({
						title  : dgettext('plugin_files', 'Error'),
						msg    : String.format(dgettext('plugin_files', 'File "{0}" is too large! Maximum allowed filesize: {1}.'), file.name, Zarafa.plugins.files.data.Utils.Format.fileSize(Zarafa.plugins.files.data.Utils.Core.getMaxUploadFilesize())),
						icon   : Zarafa.common.dialogs.MessageBox.ERROR,
						buttons: Zarafa.common.dialogs.MessageBox.OK
					});

					this.mainuploadbutton.setDisabled(true);
					filesTooLarge = true;
					return false;
				} else {
					if (!filesTooLarge) {
						this.mainuploadbutton.setDisabled(false);
					}
				}
			}, this);

		} else {
			this.mainuploadbutton.setDisabled(true);
		}
	},

	/**
	 * Event handler that will start the upload process.
	 */
	doUpload: function () {
		var files = this.mainuploadfield.fileInput.dom.files;
		Zarafa.plugins.files.data.Actions.uploadAsyncItems(files, this.record.getStore(), this.targetFolder);
		this.onClose();
	},

	/**
	 * This function will close the dialog.
	 */
	onClose: function () {
		this.close();
	}
});

Ext.reg('filesplugin.filesuploadcontentpanel', Zarafa.plugins.files.ui.dialogs.FilesUploadContentPanel);
