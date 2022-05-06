Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype folderzarafa.propertiescontentpanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for general properties of {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} and set permissions on same.
 */
Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */

	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.folderpropertiescontentpanel',
			layout: 'fit',
			title: Ext.isDefined(config.title) ? config.title : _('Properties'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true,
				useShadowStore: true
			}),
			closeOnSave: true,
			width: 425,
			height: 480,
			items: [{
				xtype: 'zarafa.folderpropertiespanel',
				activeTab: Ext.isDefined(config.activeTab) ? config.activeTab : 0,
				emptyText: config.emptyText,
				isAppointmentDialog: config.isAppointmentDialog || false,
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel.superclass.constructor.call(this, config);
	},

		/**
	 * Save all changes made to the {@link #record} to the server.
	 * @param {Boolean} storeSave (optional) False to only update the record,
	 * but not save the changes to the store.
	 * @return {Boolean} false if the record could not be saved
	 * @protected
	 */
		saveRecord: function(storeSave)
		{
			// Check if saving is allowed, and if by chance we aren't
			// saving already.
			if (this.recordComponentPlugin.allowWrite === false || this.isSaving === true) {
				return false;
			}
	
			if (this.fireEvent('beforesaverecord', this, this.record) === false) {
				return false;
			}
	
			// Check if the record is valid before saving.
			if (!this.record.isValid()) {
				return false;
			}
	
			this.fireEvent('saverecord', this, this.record);
	
			if (Ext.isDefined(this.modalRecord)) {
				this.modalRecord.applyData(this.record);
			}
	
			if (storeSave !== false) {
				var record = this.modalRecord || this.record;
	
				// Check if the record has actual modifications which
				// we can save to the server. record.save() will do
				// nothing if the store doesn't have the record in
				// the modifications array. So we must prevent going
				// any further here when there are not modifications.
				if (record.getStore().modified.indexOf(record) < 0) {
					if (this.closeOnSave === true) {
						this.close();
					}
					return;
				}
	
				// When the HTML body has been modified we must also send the isHTML property
				// with the save request because otherwise the backend will think this is an
				// plaintext record. (See Conversion::mapXML2MAPI())
				if ( record.isModified('html_body') ){
					record.set('isHTML', record.get('isHTML'), true);
				}
	
				record.save();
			}
			container.getHierarchyStore().reload();
		}
});

Ext.reg('zarafa.folderpropertiescontentpanel', Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel);
