Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.AbstractFolderWidget
 * @extends Zarafa.core.ui.widget.Widget
 *
 * Widget which can be used to show the contents of a
 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
 * using a particular restriction (during {@link #store}{@link Ext.data.Store#load})
 * or a filter (using {@link #store}{@link Ext.data.Store#applyFilter}).
 *
 * Reload time is configurable per instance of the
 * widget (keys: 'reloadinterval', default 5 minutes).  These values are in
 * saved in miliseconds but displayed in seconds. The reload
 * interval is how often the folder is fully reloaded from the
 * server, to show records that were added to the folder
 * outside of WebApp.
 */
Zarafa.widgets.folderwidgets.AbstractFolderWidget = Ext.extend(Zarafa.core.ui.widget.Widget, {
	/**
	 * The folder which is shown inside this widget. This is initialized
	 * by {@link #onHierarchyLoad}.
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 * @private
	 */
	folder : undefined,

	/**
	 * @cfg {Zarafa.core.data.MAPIStore} store The store which is being used for loading the records
	 */
	store : undefined,

	/**
	 * @cfg {String} folderType The folder type to obtain the desired folder
	 * from the {@link Zarafa.hierarchy.data.HierarchyStore hierarchy}.
	 */
	folderType : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasConfig : true
		});

		Zarafa.widgets.folderwidgets.AbstractFolderWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the event handlers for the {@link #store} and {@link Zarafa.hierarchy.data.HierarchyStore Hierarchy}.
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.widgets.folderwidgets.AbstractFolderWidget.superclass.initEvents.apply(this, arguments);

		// Wait for the hierarchy store to be loaded.
		var hierarchyStore = container.getHierarchyStore();
		this.mon(hierarchyStore, 'load', this.onHierarchyLoad, this);
		// needed when adding the widget after hierarchy load
		this.onHierarchyLoad(hierarchyStore);

		// Wait for the store to be loaded, so we can activate
		// the refreshing and reloading times.
		this.mon(this.store, 'load', this.onStoreLoad, this, { single : true });

		// Listen for record updates, as that might have impact on the filtering
		// which should be applied.
		this.mon(this.store, 'update', this.onStoreUpdate, this);
	},

	/**
	 * Load the default calendar folder and retrieve the records.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} hierarchyStore The store which fired the event
	 * @private
	 */
	onHierarchyLoad : function(hierarchyStore)
	{
		this.folder = hierarchyStore.getDefaultFolder(this.folderType);
		if (this.folder) {
			this.reloadStore();
		}
	},

	/**
	 * When the store has finished loading, update the filter for the first time.
	 * @private
	 */
	onStoreLoad : function()
	{
		// Periodically reload data from the server to remove stale
		// data from the store.  But only do this when the store has
		// finished loading for the first time.
		interval = this.get('reloadinterval') || 300000;
		Ext.TaskMgr.start({
			run: this.reloadStore,
			interval: interval,
			scope : this
		});
	},

	/**
	 * When the store record has been changed, {@link #updateFilter apply filter}
	 * to ensure that unwanted records are immediately removed.
	 * @private
	 */
	onStoreUpdate : function()
	{
		this.updateFilter();
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store}.
	 * @private
	 */
	reloadStore : function()
	{
		if (this.folder) {
			this.store.load({ folder : this.folder });
		}
	},

	/**
	 * Update the filter.
	 * @private
	 */
	updateFilter : Ext.emptyFn,

	/**
	 * Configure the widget.  At this time, only the reload and
	 * refresh times can be configured.
	 * @todo Also allow the user to select the folder(s) to show here.
	 * @private
	 */
	config : function()
	{
		var win = new Ext.Window({
			title: _('Configure widget'),
			layout: 'fit',
			width: 320,
			height: 130,

			items: [{
				xtype: 'form',
				labelWidth: 120,
				frame: true,
				items: [{
					xtype: 'zarafa.compositefield',
					plugins: [ 'zarafa.splitfieldlabeler' ],
					// # TRANSLATORS: The '{A}' represents the number of seconds which the user will type in.
					fieldLabel: _('Reload interval {A} seconds.'),
					labelWidth: 250,
					combineErrors: false,
					items: [{
						xtype: 'zarafa.spinnerfield',
						labelSplitter: '{A}',
						fieldLabel: _('Reload interval'),
						name: 'reloadinterval',
						width: 60,
						minValue: 30, // 30 seconds
						maxValue: 1800, // 30 minutes
						incrementValue: 30, // 30 seconds
						defaultValue: this.get('reloadinterval') / 1000 || 300, // Note: The reloadinterval is stored in ms but displayed in s!
						listeners: {'change': this.onFieldChange, scope: this},
						plugins: ['zarafa.numberspinner']
					}]
				}],
				buttons: [{
					text: _('Close'),
					scope: this,
					handler: function() {
						win.close();
					}
				}]
			}]
		});

		win.show(this);
	},

	/**
	 * Event handler which is fired when one of the fields in the Configuration dialog
	 * has been changed. This will update the corresponding option in the settings.
	 * @param {Ext.form.Field} field The field whcih fired the event
	 * @param {Mixed} newValue The new value which was applied
	 * @param {Mixed} oldValue The old value which was applied
	 * @private
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		this.set(field.getName(), newValue * 1000);
	}
});
