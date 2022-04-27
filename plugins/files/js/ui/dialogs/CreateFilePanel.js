Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.CreateFolderPanel
 * @extends Ext.Panel
 * @xtype filesplugin.createfolderpanel
 *
 * Panel for users to create folder record in differnt supported backends.
 */
Zarafa.plugins.files.ui.dialogs.CreateFilePanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Zarafa.plugins.files.data.FilesFolderRecord} parentFolder (optional) The parent folder
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
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

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
				cls: 'zarafa-action',
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

		Zarafa.plugins.files.ui.dialogs.CreateFilePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates body for {@link Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel CreateFolderContentPanel}
	 * @param {Object} config The config options contains the {@link Zarafa.plugins.files.FilesContextModel FilesContextModel} and
	 * {@link Zarafa.plugins.files.ui.Tree#accountFilter}. which used by {@link Zarafa.plugins.files.ui.Tree Tree}.
	 *
	 * @return {Array} Array which contains configuration object to create the {@link Zarafa.plugins.files.ui.Tree TreePanel}.
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
				ref : '../newNameField'
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
		Zarafa.plugins.files.ui.dialogs.CreateFolderPanel.superclass.initEvents.apply(this, arguments);
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
	 * under the respective folder as well as check for dublicate folder.
	 *
	 * @param {Ext.Button} button which triggeres this event.
	 * @param {Ext.EventObject} event The event object
	 */
	onOk : function (button, event)
	{
		var fileName = this.newNameField.getValue();
		var dir = this.parentFolder.get('folder_id');
		var accId = dir.substr(0, dir.indexOf('/') + 1);
		dir = dir.substr(dir.indexOf('/'));

		if (Ext.isEmpty(fileName.trim())) {
			Ext.MessageBox.show({
				title: _('grommunio Web'),
				msg: _('You must specify a name.'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.INFO,
				scope : this
			});
			return;
		}

		if (!Zarafa.plugins.files.data.Utils.File.isValidFilename(fileName)) {
			Zarafa.plugins.files.data.Actions.msgWarning(_('Incorrect filename'));
			return;
		}

		const url = Zarafa.plugins.files.data.Utils.File.getNewFileUrl(accId);

		if(!url) {
			Ext.MessageBox.show({
				title: _('grommunio Web'),
				msg: _('Error reaching office backend'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.INFO,
				scope : this
			});
			return;
		}

		fetch(url, {
			method: "POST",
			headers: {'Content-Type': 'application/json'}, 
			body: JSON.stringify({ "name": fileName + this.filetype, "dir": dir }),
		}).then(async res => {
			const result = await res.json();
			const { id, name, size, type, path } = result;
			var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_FILES, {
				"object_type": Zarafa.plugins.files.data.FileTypes.FILE,
				'folder_id': dir,
				'fileid': id,
				'display_name': name,
				'message_size': size,
				'type': type,
				'path': dir + name,
			});
			if(record) {
				Zarafa.plugins.files.data.Actions.openTab(record);
				Zarafa.plugins.files.data.Actions.updateCache(accId);
				if (this.model) {
					this.model.reload();
				}
				this.dialog.close();
			}
		});
	}

});

Ext.reg('filesplugin.createfilepanel', Zarafa.plugins.files.ui.dialogs.CreateFilePanel);
