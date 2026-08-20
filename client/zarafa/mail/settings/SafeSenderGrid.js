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
				emptyText: '<div class="emptytext">' + (config.emptyText || _('List is empty')) + '</div>'
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
			Ext.Msg.alert(_('Alert'), _('Please select a record.'));
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
			title: _('Delete all entries'),
			msg: _('Are you sure you want to delete all entries?'),
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
	},

	/**
	 * Add a validated entry to the grid, deduplicated case-insensitively.
	 * @param {String} name email address or @domain
	 * @return {Boolean} True when the entry was added
	 */
	addEntry: function(name)
	{
		name = String(name).trim();
		if (!Zarafa.mail.data.JunkMailStore.isValidEntry(name)) {
			return false;
		}

		var store = this.getStore();
		var lower = name.toLowerCase();
		var exists = store.findBy(function(record) {
			return record.get('name').toLowerCase() === lower;
		}) !== -1;
		if (exists) {
			return false;
		}

		var maxId = 0;
		store.each(function(record) {
			maxId = Math.max(maxId, record.get('id'));
		});
		store.add(new store.recordType({ id: maxId + 1, name: name }, maxId + 1));

		return true;
	}
});

Ext.reg('zarafa.safesendergrid', Zarafa.mail.settings.SafeSenderGrid);