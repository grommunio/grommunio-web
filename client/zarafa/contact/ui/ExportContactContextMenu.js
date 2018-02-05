Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.mail.ui.ExportContactContextMenu
 * @extends Ext.menu.Menu
 * @xtype zarafa.exportcontactcontextmenu
 *
 * The ExportContactContextMenu is the context menu that is shown as submenu
 * of the {@link Zarafa.contact.ui.ContactContextMenu ContactContextMenu}.
 */
Zarafa.contact.ui.ExportContactContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records to which the actions in
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
			xtype: 'zarafa.exportcontactcontextmenu',
			cls: 'k-categories',
			items: [{
				xtype: 'zarafa.conditionalitem',
				text: _('VCF file(s)'),
				iconCls: 'icon_saveaseml',
				hideOnDisabled: false,
				beforeShow: this.onExportMenuBeforeShow,
				handler: this.onContextItemVcf,
				scope: this
			}]
		});

		Zarafa.contact.ui.ExportContactContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the user selects the 'VCF file(s)'
	 * item in the context menu. This will request to download selected contact
	 * as file (RFC6350-formatted vCard stream) with vcf extension.
	 * @private
	 */
	onContextItemVcf: function ()
	{
		Zarafa.common.Actions.openSaveEmlDialog(this.records);
	},

	/**
	 * Event handler which determines if menu items should be disable or not.
	 * It will disable respective menu item if record is not contact.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
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

Ext.reg('zarafa.exportcontactcontextmenu', Zarafa.contact.ui.ExportContactContextMenu);
