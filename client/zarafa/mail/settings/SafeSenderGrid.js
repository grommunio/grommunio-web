Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SafeSenderGrid
 * @extends Ext.grid.GridPanel
 * @xtype zarafa.safesendergrid
 *
 * {@link Zarafa.mail.settings.SafeSenderGrid SafeSenderGrid} will be used to display
 * list of safe sender's email address or domain name.
 */
Zarafa.mail.settings.SafeSenderGrid = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		var store = {
			xtype: 'jsonstore',
			root: 'item',
			fields: [
				{ name: 'id', type: 'int' },
				{ name: 'name' }
			],
			idProperty: 'id',
			sortInfo: {
				field: 'name',
				direction: 'ASC'
			},
			autoDestroy: true
		};

		Ext.applyIf(config, {
			xtype: 'zarafa.safesendergrid',
			name: 'zarafa/v1/contexts/mail/safe_senders_list',
			height: 320,
			forceFit: true,
			store: store,
			listeners: {
				viewready: this.onViewReady,
				scope: this
			},
			viewConfig: {
				forceFit: true,
				deferEmptyText: false,
				emptyText: '<div class="emptytext">' + _('Safe Senders list is empty') + '</div>'
			},
			columns: [{
				dataIndex: 'name',
				header: _('Name'),
				menuDisabled: true,
				sortable: true,
				renderer: Zarafa.common.ui.grid.Renderers.text
			}]
		});

		Zarafa.mail.settings.SafeSenderGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Event fired when the {@link Zarafa.mail.settings.SafeSenderGrid grid} fires the
	 * {@link Zarafa.mail.settings.SafeSenderGrid#viewready viewready} event. This will check
	 * if safesenders available in store then selects first row in grid.
	 * @private
	 */
	onViewReady: function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * This will get all the selected records and {@link Ext.data.JsonStore#remove remove} it
	 * from {@link Zarafa.mail.settings.SafeSenderGrid#store store}
	 * @private
	 */
	deleteSafeSender: function()
	{
		var selectionModel = this.getSelectionModel();
		var safeSenderRecord = selectionModel.getSelections();
		var store = this.getStore();
		var rowToSelect;

		if(Ext.isEmpty(safeSenderRecord)) {
			Ext.Msg.alert(_('Alert'), _('Please select a safe sender record.'));
			return;
		}

		// before removing safesenders we should store row index of next available safesender,
		// because deleting a safesender will remove selection
		if (selectionModel.hasNext()) {
			rowToSelect = selectionModel.last;
		} else if (selectionModel.hasPrevious()) {
			rowToSelect = selectionModel.last-1;
		}

		store.remove(safeSenderRecord);

		if (Ext.isDefined(rowToSelect)) {
			selectionModel.selectRow(rowToSelect);
		}
	},

	/**
	 * This will get all the {@link Ext.data.Record[] records} from
	 * {@link #store} used in this GridPanel.
	 * and {@link Ext.data.JsonStore#removeAll removeAll}.
	 * @private
	 */
	deleteAllSafeSender: function()
	{
		Ext.MessageBox.show({
			title: _('Delete all safe senders'),
			msg: _('Are you sure you want to delete all safe senders?'),
			buttons: Ext.MessageBox.YESNO,
			fn: function (buttonClicked) {
				if (buttonClicked == 'yes') {
					this.getStore().removeAll();
				}
			},
			scope: this
		});
	},

	/**
	 * Helper function which returns a list of safe senders from the
	 * {@link #store} config used in this GridPanel.
	 *
	 * @return {Array} list of currently available safesenders records from store.
	 * @private
	 */
	getSafeSenders: function()
	{
		var store = this.getStore();
		var records = store.getRange();

		return records.map(function(record){
			return record.get("name");
		});
	}
});

Ext.reg('zarafa.safesendergrid', Zarafa.mail.settings.SafeSenderGrid);