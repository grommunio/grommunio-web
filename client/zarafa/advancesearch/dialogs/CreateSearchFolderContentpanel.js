Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.createsearchfoldercontentpanel
 *
 * Content panel for users to create the search folder.
 */
Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * @cfg {String} searchStoreEntryId Entryid of the store to which the search folder belongs.
	 */
	searchStoreEntryId : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.createsearchfoldercontentpanel',
			title : _('Add to favorites'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				enableOpenLoadTask : false
			}),
			layout : 'fit',
			width : 250,
			height : 150,
			stateful : false,
			items : [{
				xtype : 'zarafa.createsearchfolderpanel',
				searchText : config.searchText,
				buttons : [{
					text : _('Add'),
					handler : this.onAddFolder,
					scope : this
				},{
					text : _('Cancel'),
					handler : this.onCancel,
					scope : this
				}]
			}]
		});

		Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the given {@link Zarafa.core.data.IPFRecord record} with
	 * the values from this {@link Ext.Panel panel}.
	 *
	 * @param {Zarafa.core.data.IPFRecord} record The record to update
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		record.set('display_name', this.searchFolderTextField.getValue());
		record.endEdit();
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.IPFRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.searchFolderTextField.setValue(record.get('display_name'));
	},

	/**
	 * Event handler triggers when add button is press. function is add
	 * the respective message actions which used to create search folder.
	 */
	onAddFolder : function()
	{
		var newFolderName = this.searchFolderTextField.getValue().trim();
		if (Ext.isEmpty(newFolderName)) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg: _("You must specify a name."),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.INFO
			});

			return;
		}

		this.record.addToFavorites(this.searchStoreEntryId);
		if (Ext.isEmpty(this.record.get('entryid'))) {
			this.record.addMessageAction('search_folder_entryid', this.searchFolderEntryId);
			this.record.getStore().setBaseParam('subfolders', this.includeSubFolder);
		}
		Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel.superclass.onOk.apply(this, arguments);
	}
});

Ext.reg('zarafa.createsearchfoldercontentpanel', Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel);