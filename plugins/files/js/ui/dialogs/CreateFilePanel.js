Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.CreateFolderPanel
 * @extends Ext.Panel
 * @xtype filesplugin.createfolderpanel
 *
 * Panel for users to create folder record in different supported backends.
 */
Grommunio.plugins.files.ui.dialogs.CreateFilePanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Grommunio.plugins.files.data.FilesFolderRecord} parentFolder (optional) The parent folder
	 * underneath the new folder will be created.
	 */
	parentFolder : undefined,

	fileType: '',
	model: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype : 'filesplugin.createfilepanel',
			layout: {
				type: 'fit',
			},
			border: false,
			header: false,
			items: this.createPanel(config),
			buttonAlign: 'right',
			buttons: [{
				text: _('Ok'),
				ref: '../okButton',
				cls: 'grommunio-action',
				handler : this.onOk,
				scope: this
			},{
				text: _('Cancel'),
				ref: '../cancelButton',
				handler : this.onCancel,
				scope: this
			}]
		});

		this.filetype = config.filetype || '.xlsx';
		this.model = config.model;

		Grommunio.plugins.files.ui.dialogs.CreateFilePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates body for {@link Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel CreateFolderContentPanel}
	 * @param {Object} config The config options contains the {@link Grommunio.plugins.files.FilesContextModel FilesContextModel} and
	 * {@link Grommunio.plugins.files.ui.Tree#accountFilter}. which used by {@link Grommunio.plugins.files.ui.Tree Tree}.
	 *
	 * @return {Array} Array which contains configuration object to create the {@link Grommunio.plugins.files.ui.Tree TreePanel}.
	 * @private
	 */
	createPanel : function(config)
	{
		return [{
			xtype : 'panel',
			layout : 'form',
			border : false,
			defaults : {
				anchor :'100%'
			},
			labelAlign : 'top',
			items : [{
				xtype : 'textfield',
				fieldLabel : _('Name'),
				cls: 'form-field-name',
				ref : '../newNameField',
				enableKeyEvents: true,
				listeners: {
					keyup: {
						fn: this.handleEnter,
						buffer: 200
					},
					scope: this
				},
			}]
		}];
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents : function ()
	{
		Grommunio.plugins.files.ui.dialogs.CreateFolderPanel.superclass.initEvents.apply(this, arguments);
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close this dialog.
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the user presses the ok
	 * {@link Ext.Button button}. function is responsible to create folder
	 * under the respective folder as well as check for duplicate folder.
	 *
	 * @param {Ext.Button} button which triggers this event.
	 * @param {Ext.EventObject} event The event object
	 */
	onOk : function (button, event)
	{
		var fileName = this.newNameField.getValue().trim();
		var dir = this.parentFolder.get('folder_id');
		var accId = dir.substr(0, dir.indexOf('/'));
		dir = dir.substr(dir.indexOf('/'));

		if (Ext.isEmpty(fileName)) {
			container.getNotifier().notify('warning.files', _('Files'), _('You must specify a name.'));
			return;
		}

		if (!Grommunio.plugins.files.data.Utils.File.isValidFilename(fileName)) {
			Grommunio.plugins.files.data.Actions.msgWarning(_('Incorrect filename'));
			return;
		}

		fileName += this.filetype;
		var record = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_FILES, {
			'object_type': Grommunio.plugins.files.data.FileTypes.FILE,
			'folder_id': accId + dir + fileName,
			'display_name': fileName,
			'path': dir + fileName
		});

		// The editor creates the file; the listing is refreshed once it has.
		var opened = Grommunio.plugins.files.data.Actions.openTab(record, {
			create: true,
			callback: function() {
				Grommunio.plugins.files.data.Actions.updateCache(accId + dir);
				if (this.model) {
					this.model.reload();
				}
			},
			scope: this
		});

		if (!opened) {
			container.getNotifier().notify('error.files', _('Files'), _('Error reaching office backend'));
			return;
		}

		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when
	 * a key is pressed in the searchTextField
	 *
	 * @param {Ext.form.TextField} field
	 * @param {Ext.EventObject} e
	 * @private
	 */
	 handleEnter: function(field, e)
	 {
		 if (e.getKey() === e.ENTER) {
			 this.onOk();
		 }
	 }

});

Ext.reg('filesplugin.createfilepanel', Grommunio.plugins.files.ui.dialogs.CreateFilePanel);
