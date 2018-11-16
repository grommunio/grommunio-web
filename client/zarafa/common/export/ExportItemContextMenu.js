Ext.namespace('Zarafa.common.export');

/**
 * @class Zarafa.common.export.ExportItemContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.exportitemcontextmenu
 *
 * The ExportContactContextMenu is the context menu that is shown as submenu
 * of the {@link Zarafa.core.ui.menu.ConditionalMenu ConditionalMenu}.
 */
Zarafa.common.export.ExportItemContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
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
			xtype: 'zarafa.exportitemcontextmenu',
			cls: 'k-categories',
			items: [{
				xtype: 'zarafa.conditionalitem',
				text: _('ICS'),
				iconCls: 'icon_saveaseml',
				hideOnDisabled: false,
				beforeShow: this.onExportMenuBeforeShow,
				handler: this.onContextItemICS,
				scope: this
			}]
		});

		Zarafa.common.export.ExportItemContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the user selects the 'ICS'
	 * item in the context menu. This will request to download selected calendar item
	 * as file (RFC2445-formatted ics stream) with ics extension.
	 * @private
	 */
	onContextItemICS: function ()
	{
		Zarafa.common.Actions.openSaveEmlDialog(this.records, true);
	},

	/**
	 * Event handler which determines if menu items should be disable or not.
	 * It will disable respective menu item if record is not appointment.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onExportMenuBeforeShow: function (item, records)
	{
		item.setDisabled(!Ext.isEmpty(records) && records.some(function(record) {
				return !record.isMessageClass('IPM.appointment');
			})
		);
	}
});

Ext.reg('zarafa.exportitemcontextmenu', Zarafa.common.export.ExportItemContextMenu);
