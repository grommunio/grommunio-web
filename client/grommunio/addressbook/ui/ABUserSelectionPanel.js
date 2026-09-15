Ext.namespace('Grommunio.addressbook.ui');

/**
 * @class Grommunio.addressbook.ui.ABUserSelectionPanel
 * @extends Grommunio.addressbook.ui.AddressBookMainPanel
 * @xtype grommunio.abuserselectionpanel
 */
Grommunio.addressbook.ui.ABUserSelectionPanel = Ext.extend(Grommunio.addressbook.ui.AddressBookMainPanel, {
	/**
	 * @cfg {Function} callback the callback function to return to after selecting a user from the Address Book.
	 */
	callback: Ext.emptyFn,

	/**
	 * @cfg {Boolean} singleSelect false to allow multiple selections(defaults to true allowing selection of only one row at a time)
	 */
	singleSelect: true,

	/**
	 * @cfg {Function} scope the scope in which the {@link #callback} will be called
	 */
	scope: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.abuserselectionpanel',
			cls: 'k-abuserselectionpanel',
			buttons: [{
				text: _('Ok'),
				handler: this.onSubmit,
				scope: this
			},{
				text: _('Cancel'),
				handler: this.onCancel,
				scope: this
			}]
		});

		Grommunio.addressbook.ui.ABUserSelectionPanel.superclass.constructor.call(this, config);

		this.on('afterlayout', this.onAfterLayout, this, { single: true });
	},

	/**
	 * Calls callback function
	 * @return {Boolean} true, if callback was successful
	 */
	doCallBack: function()
	{
		var grid = this.getGridPanel();

		if (grid.getSelectionModel().hasSelection()) {
			var records = grid.getSelectionModel().getSelections();

			if(this.singleSelect) {
				this.callback.call(this.scope || this, records[0]);
			} else {
				this.callback.call(this.scope || this, records);
			}
			return true;
		}
	},

	/**
	 * Event handler which is triggered when the layout
	 * for the {@link Ext.Panel panel} has been completed.
	 * @private
	 */
	onAfterLayout: function()
	{
		this.mon(this.getGridPanel(), 'rowdblclick', this.onAddressBookRowDblClick, this);
		this.mon(this.getGridPanel(), 'rowcontextmenu', this.onAddressBookRowContextMenu, this);
	},

	/**
	 * Event handler which is triggered when the user doubleclicks on a
	 * row within the {@link Ext.grid.GridPanel gridpanel}. This will add
	 * the selected user or group to the {@link Grommunio.core.ui.RecipientField recipientfield}
	 * @private
	 */
	onAddressBookRowDblClick: function()
	{
		if (this.doCallBack() === true) {
			this.dialog.close();
		}
	},

	/**
	 * Event handler which is triggered when the user rightclicks
	 * on a row in the {@link Ext.grid.GridPanel gridpanel}. This will
	 * open a {@link Grommunio.core.ui.menu.ConditionalMenu contextmenu}
	 * for the selected row.
	 * @param {Ext.grid.GridPanel} grid The grid on which the user clicked
	 * @param {Number} rowIndex the row on which was doubleclicked
	 * @param {Ext.EventObject} event The event information
	 * @private
	 */
	onAddressBookRowContextMenu: function(grid, rowIndex, event)
	{
		var sm = grid.getSelectionModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}

		Grommunio.core.data.UIFactory.openDefaultContextMenu(sm.getSelections(), {
			position: event.getXY(),
			dialog: this.dialog
		});
	},

	/**
	 * Event handler which is called when the user presses the "Ok" button.
	 * Function will store changed data in record and close the dialog
	 * @private
	 */
	onSubmit: function()
	{
		if (this.doCallBack() === true) {
			this.dialog.close();
		} else {
			Ext.MessageBox.show({
				title: _('No user selected'),
				msg: _('You must select a user.'),
				buttons: Ext.MessageBox.OK
			});
		}
	},

	/**
	 * Closes {@link Grommunio.core.ui.CreateFolderContentPanel CreateFolder} content panel
	 * @private
	 */
	onCancel: function()
	{
		this.dialog.close();
	}
});

Ext.reg('grommunio.abuserselectionpanel', Grommunio.addressbook.ui.ABUserSelectionPanel);
