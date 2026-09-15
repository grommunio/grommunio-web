Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABItemGrid
 * @extends Ext.grid.GridPanel
 * @xtype grommunio.abitemgrid
 *
 * A gridPanel which is used in the Addressbook detail dialogs
 * for showing one or more addressbook items.
 */
Grommunio.addressbook.dialogs.ABItemGrid = Ext.extend(Ext.grid.GridPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			viewConfig: {
				forceFit: true
			},
			store: new Grommunio.addressbook.AddressBookSubStore(),
			colModel: new Ext.grid.ColumnModel({
				columns: [{
					dataIndex: 'display_type',
					header: '',
					headerCls: 'grommunio-icon-column icon',
					width: 25,
					fixed: true,
					renderer: Grommunio.common.ui.grid.Renderers.icon
				},{
					header: _('Display Name'),
					dataIndex: 'display_name',
					renderer: Ext.util.Format.htmlEncode,
					headerCls: 'k-unsortable',
					sortable: false
				},{
					header: _('Email Address'),
					dataIndex: 'smtp_address',
					renderer: Ext.util.Format.htmlEncode,
					headerCls: 'k-unsortable',
					sortable: false
				},{
					header: _('Account'),
					dataIndex: 'account',
					renderer: Ext.util.Format.htmlEncode,
					headerCls: 'k-unsortable',
					sortable: false
				}]
			})
		});

		Grommunio.addressbook.dialogs.ABItemGrid.superclass.constructor.call(this, config);

		this.on('rowdblclick', this.onRowDblClick, this);
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will open the selected addressbook item in a new dialog.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 */
	onRowDblClick: function(grid, rowIndex, event)
	{
		var item = this.getStore().getAt(rowIndex);
		if (item) {
			Grommunio.core.data.UIFactory.openViewRecord(item);
		}
	}
});

Ext.reg('grommunio.abitemgrid', Grommunio.addressbook.dialogs.ABItemGrid);
