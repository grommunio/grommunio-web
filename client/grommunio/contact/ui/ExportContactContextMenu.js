Ext.namespace('Grommunio.contact.ui');

/**
 * @class Grommunio.mail.ui.ExportContactContextMenu
 * @extends Ext.menu.Menu
 * @xtype grommunio.exportcontactcontextmenu
 *
 * The ExportContactContextMenu is the context menu that is shown as submenu
 * of the {@link Grommunio.contact.ui.ContactContextMenu ContactContextMenu}.
 */
Grommunio.contact.ui.ExportContactContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records: [],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.exportcontactcontextmenu',
			cls: 'k-categories',
			items: [{
				xtype: 'grommunio.conditionalitem',
				text: _('VCF file(s)'),
				iconCls: 'icon_download',
				hideOnDisabled: false,
				beforeShow: this.onExportMenuBeforeShow,
				handler: this.onContextItemVcf,
				scope: this
			}]
		});

		Grommunio.contact.ui.ExportContactContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the user selects the 'VCF file(s)'
	 * item in the context menu. This will request to download selected contact
	 * as file (RFC6350-formatted vCard stream) with vcf extension.
	 * @private
	 */
	onContextItemVcf: function ()
	{
		Grommunio.common.Actions.openSaveEmlDialog(this.records);
	},

	/**
	 * Event handler which determines if menu items should be disable or not.
	 * It will disable respective menu item if record is not contact.
	 *
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Grommunio.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onExportMenuBeforeShow: function (item, records)
	{
		Ext.each(records, function(record) {
			if (!record.isMessageClass('IPM.Contact')) {
				// disable menu item and break the loop
				item.setDisabled(true);

				return false;
			}
		}, this);
	}
});

Ext.reg('grommunio.exportcontactcontextmenu', Grommunio.contact.ui.ExportContactContextMenu);
