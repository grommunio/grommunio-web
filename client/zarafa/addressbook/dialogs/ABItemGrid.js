Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABItemGrid
 * @extends Ext.grid.GridPanel
 * @xtype zarafa.abitemgrid
 *
 * A gridPanel which is used in the Addressbook detail dialogs
 * for showing one or more addressbook items.
 */
Zarafa.addressbook.dialogs.ABItemGrid = Ext.extend(Ext.grid.GridPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			viewConfig : {
				forceFit : true
			},
			store : new Zarafa.addressbook.AddressBookSubStore(),
			colModel : new Ext.grid.ColumnModel({
				columns: [{
					dataIndex : 'display_type',
					header : '<p class="icon_index">&nbsp;</p>',
					headerCls: 'zarafa-icon-column icon',
					width : 25,
					fixed : true,
					renderer : Zarafa.common.ui.grid.Renderers.icon
				},{
					header  : _('Display Name'),
					dataIndex: 'display_name',
					renderer : Ext.util.Format.htmlEncode,
					headerCls: 'k-unsortable',
					sortable: false
				},{
					header  : _('Email Address'),
					dataIndex: 'smtp_address',
					renderer : Ext.util.Format.htmlEncode,
					headerCls: 'k-unsortable',
					sortable: false
				},{
					header  : _('Account'),
					dataIndex: 'account',
					renderer : Ext.util.Format.htmlEncode,
					headerCls: 'k-unsortable',
					sortable: false
				}]
			})
		});

		Zarafa.addressbook.dialogs.ABItemGrid.superclass.constructor.call(this, config);

		this.on('rowdblclick', this.onRowDblClick, this);
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will open the selected addressbook item in a new dialog.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		var item = this.getStore().getAt(rowIndex);
		if (item) {
			Zarafa.core.data.UIFactory.openViewRecord(item);
		}
	}
});

Ext.reg('zarafa.abitemgrid', Zarafa.addressbook.dialogs.ABItemGrid);
