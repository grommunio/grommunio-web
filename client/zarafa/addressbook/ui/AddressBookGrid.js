Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.AddressBookGrid
 * @extends Zarafa.common.ui.grid.GridPanel
 * @xtype zarafa.addressbookgrid
 *
 * Panel that shows the contents of the users/contacts in addressBook.
 */
Zarafa.addressbook.ui.AddressBookGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {
	/**
	 * @cfg {Boolean} singleSelect true to allow selection of only one row at a time (defaults to false allowing multiple selections)
	 */
	singleSelect : false,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			autoExpandColumn : 'displayname',
			autoExpandMin : 100,
			loadMask : true,
			stateful : true,
			statefulRelativeDimensions : false,
			sm : this.createSelectionModel(config),
			cm : new Zarafa.addressbook.ui.GABColumnModel(),
			view : new Ext.ux.grid.BufferView({
				emptyText : '<div class=\'emptytext\'>' + _('There are no items to show in this view') + '</div>',
				// render rows as they come into viewable area.
				scrollDelay : false,
				rowHeight : 31
			})
		});

		Zarafa.addressbook.ui.AddressBookGrid.superclass.constructor.call(this, config);

		this.mon(this.getStore(), 'load', this.onStoreLoad, this);
	},

	/**
	 * Event handler which is called when the {@link #store} has been loaded. This will
	 * check what kind of folder has been loaded, and either loads the {@link Zarafa.addressbook.ui.GABColumnModel}
	 * or {@link Zarafa.addressbook.ui.GABPersonalColumnModel} column model.
	 * @param {Ext.data.Store} store The store which was loaded
	 * @param {Ext.data.Record[]} records The records which were loaded from the store
	 * @param {Object} options The options which were used to load the data
	 * @private
	 */
	onStoreLoad : function(store, records, options)
	{
		var columnModel;
		if (options && options.params && options.params.folderType === 'gab') {
			columnModel = new Zarafa.addressbook.ui.GABColumnModel();
		} else {
			columnModel = new Zarafa.addressbook.ui.GABPersonalColumnModel();
		}

		// reconfigure grid with new column model
		if(this.colModel.name !== columnModel.name) {
			this.reconfigure(store, columnModel);
		}
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @param {Object} config config options for {@link Ext.grid.GridPanel.selModel selModel}
	 * @return {Zarafa.common.ui.grid.RowSelectionModel} selection model object
	 * @private
	 */
	createSelectionModel : function(config)
	{
		return new Zarafa.common.ui.grid.RowSelectionModel({
			singleSelect : config.singleSelect
		});
	},

	/**
	 * Returns the currently selected {@link Ext.data.Record records}
	 * from the {@link Ext.grid.GridPanel GridPanel}
	 * @return {Ext.data.Record[]} The selected records
	 */
	getSelectedItems : function()
	{
		return this.getSelectionModel().getSelections();
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * We are managing two different state settings for addressbook, one for addressbook containers and another for
	 * contact containers.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved.
	 */
	getStateName : function()
	{
		var options = this.store.lastOptions;
		var name = 'globaladdressbook';

		if (options && options.params && options.params.entryid) {
			var entryid = options.params.entryid;

			// check for contacts container, all other containers would be assumed as global addressbook
			if(Zarafa.core.EntryId.hasContactProviderGUID(entryid)) {
				name = 'contacts';
			}
		}

		return 'gab/' + name + '/list';
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.addressbook.ui.AddressBookGrid.superclass.getState.call(this);

		// Superclass wrapped it, but we need to unwrap it again
		// because we store the settings slightly differently.
		var unwrap = { sort : state.sort };
		delete state.sort;
		Ext.apply(unwrap, state[this.getColumnModel().name]);

		return unwrap;
	},

	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * @param {Object} state The state object
	 * @protected
	 */
	applyState : function(state)
	{
		if (state) {
			var wrap = { sort : state.sort };
			delete state.sort;
			wrap[this.getColumnModel().name] = state;

			Zarafa.addressbook.ui.AddressBookGrid.superclass.applyState.call(this, wrap);
		}
 	}
});

Ext.reg('zarafa.addressbookgrid', Zarafa.addressbook.ui.AddressBookGrid);
