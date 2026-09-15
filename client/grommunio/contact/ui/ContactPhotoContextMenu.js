Ext.namespace('Grommunio.contact.ui');

/**
 * @class Grommunio.contact.ui.ContactPhotoContextMenu
 * @extends Ext.menu.Menu
 * @xtype grommunio.contactphotocontextmenu
 */
Grommunio.contact.ui.ContactPhotoContextMenu = Ext.extend(Ext.menu.Menu, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.contactphotocontextmenu',
			items: [{
				text: _('Change Picture') + '...',
				iconCls: 'icon_change_picture',
				handler: this.onChangePicture,
				scope: this
			}, {
				text: _('Remove Picture'),
				iconCls: 'icon_delete',
				handler: this.onRemovePicture,
				scope: this
			}]
		});

		Grommunio.contact.ui.ContactPhotoContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Function is open attachment dialog to change the contact picture.
	 */
	onChangePicture: function()
	{
		var contactGeneralTab = this.parent;
		contactGeneralTab.uploadContactPhoto();
	},

	/**
	 * Function is remove the contact picture and show default contact .
	 */
	onRemovePicture: function()
	{
		var store = this.records.store;
		var contactGeneralTab = this.parent;
		contactGeneralTab.clearContactPhoto(store, this.records);
	}

});

Ext.reg('grommunio.contactphotocontextmenu', Grommunio.contact.ui.ContactPhotoContextMenu);
