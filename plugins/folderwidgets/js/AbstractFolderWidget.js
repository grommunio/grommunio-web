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
	folder: undefined,

	/**
	 * @cfg {Zarafa.core.data.MAPIStore} store The store which is being used for loading the records
	 */
	store: undefined,

	/**
	 * @cfg {String} folderType The folder type to obtain the desired folder
	 * from the {@link Zarafa.hierarchy.data.HierarchyStore hierarchy}.
	 */
	folderType: undefined,

	/**
	 * The task that was {@link Ext.TaskMgr.start started} to reload the folder grid.
	 * @property
	 * @type Object
	 * @private
	 */
	reloadTask: undefined,

	/**
	 * The configuration object for the configure window of the widget
	 * @property
	 * @type Object
	 * @private
	 */
	configurationConfig: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		// Set the guid so we can use the get() function
		this.guid = config.guid;

		Ext.applyIf(config, {
			hasConfig: true,
			height: this.get('widgetheight') || 300
		});

		Zarafa.widgets.folderwidgets.AbstractFolderWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the event handlers for the {@link #store} and {@link Zarafa.hierarchy.data.HierarchyStore Hierarchy}.
	 * @protected
	 */
	initEvents: function ()
	{
		Zarafa.widgets.folderwidgets.AbstractFolderWidget.superclass.initEvents.apply(this, arguments);

		// Wait for the hierarchy store to be loaded.
		var hierarchyStore = container.getHierarchyStore();
		this.mon(hierarchyStore, 'load', this.onHierarchyLoad, this);
		// needed when adding the widget after hierarchy load
		this.onHierarchyLoad(hierarchyStore);

		// Wait for the store to be loaded, so we can activate
		// the refreshing and reloading times.
		this.mon(this.store, 'load', this.startReloadTask, this, {single: true});

		// Apply the filter when we have new records
		this.mon(this.store, 'load', this.updateFilter, this);

		// Listen for record updates, as that might have impact on the filtering
		// which should be applied.
		this.mon(this.store, 'update', this.onStoreUpdate, this);
	},

	/**
	 * Load the default calendar folder and retrieve the records.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} hierarchyStore The store which fired the event
	 * @private
	 */
	onHierarchyLoad: function (hierarchyStore)
	{
		this.folder = hierarchyStore.getDefaultFolder(this.folderType);
		if (this.folder) {
			this.reloadStore();
		}
	},

	/**
	 * Starts a reload task for the store. If one already exists, it will be stopped first.
	 * @private
	 */
	startReloadTask: function ()
	{
		if ( this.reloadTask ) {
			Ext.TaskMgr.stop(this.reloadTask);
		}

		// Periodically reload data from the server to remove stale
		// data from the store.  But only do this when the store has
		// finished loading for the first time.
		var interval = this.get('reloadinterval') || 300;
		interval *= 1000; // convert seconds in milliseconds

		this.reloadTask = Ext.TaskMgr.start({
			run: this.reloadStore,
			interval: interval,
			scope: this
		});
	},

	/**
	 * When the store record has been changed, {@link #updateFilter apply filter}
	 * to ensure that unwanted records are immediately removed.
	 * @private
	 */
	onStoreUpdate: function ()
	{
		this.updateFilter();
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store}.
	 * @private
	 */
	reloadStore: function ()
	{
		if (this.folder) {
			this.store.load({folder: this.folder});
		}
	},

	/**
	 * Update the filter.
	 * @private
	 */
	updateFilter: Ext.emptyFn,

	/**
	 * Apply custom style and content for the row body. This will color
	 * a task in red when its due-date is reached. If categories are applied
	 * to a task these categories will be displayed.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass: function (record, rowIndex, rowParams)
	{
		rowParams.body = '<div class="zarafa-grid-body-container">';

		// Render the categories
		var categories = Zarafa.common.categories.Util.getCategories(record);
		var categoriesHtml = Zarafa.common.categories.Util.getCategoriesHtml(categories);
		rowParams.body += '<div class="k-category-container">' + categoriesHtml + '</div>';

		// Render the subject
		var subject = Zarafa.common.ui.grid.Renderers.subject(record.get('subject'), {});
		rowParams.body += String.format('<div class="grid_compact grid_compact_left grid_compact_subject_cell">{0}</div>', subject);
		rowParams.body += '</div>';

		// Get the due date class from the normal TaskGridView
		var rowClass = Zarafa.task.ui.TaskGridView.prototype.viewConfigGetRowClass(record);

		return "x-grid3-row-expanded " + rowClass;
	},

	/**
	 * Create spinner field with the given minimum and maximum value.
	 * @param {Number} minHeight minimum value of spinner field.
	 * @param {Number} maxHeight maximum value of spinner field.
	 * @return {Object[]} An array with configuration objects of spinner field.
	 */
	createConfigHeight: function (minHeight, maxHeight)
	{
		return {
			xtype: 'zarafa.spinnerfield',
			fieldLabel: _('Widget height'),
			name: 'widgetheight',
			boxLabel: _('pixels'),
			width: 60,
			minValue: minHeight || 100, // 100 pixel
			maxValue: maxHeight || 500, // 500 pixel
			incrementValue: 5, // 5 pixel
			defaultValue: this.get('widgetheight') || 300,
			listeners: {
				'change': this.onFieldChange,
				scope: this
			},
			plugins: ['zarafa.numberspinner']
		};
	},

	/**
	 * Configure the widget.  At this time, only the reload and
	 * refresh times can be configured.
	 * @todo Also allow the user to select the folder(s) to show here.
	 * @private
	 */
	config: function ()
	{
		var config = Ext.apply({}, this.configurationConfig || {}, {
			title: _('Configure widget'),
			layout: 'fit',
			width: 320,
			height: 135,
			modal: true,
			items: [{
				xtype: 'form',
				frame: true,
				cls: 'k-configure-widget',
				labelWidth: 120,
				items: [{
					xtype: 'zarafa.spinnerfield',
					fieldLabel: _('Reload interval'),
					name: 'reloadinterval',
					boxLabel: _('seconds'),
					width: 60,
					minValue: 30, // 30 seconds
					maxValue: 1800, // 30 minutes
					incrementValue: 30, // 30 seconds
					defaultValue: this.get('reloadinterval') || 300,
					listeners: {
						'change': this.onFieldChange,
						scope: this
					},
					plugins: ['zarafa.numberspinner']
				},
					this.createConfigHeight()
				].concat(this.getConfigurationItems()),
				buttons: [{
					text: _('Close'),
					scope: this,
					handler: function () {
						this.win.close();
					}
				}]
			}]
		});

		this.win = new Ext.Window(config);
		this.win.show(this);
	},

	/**
	 * Returns an array with the items that should be added to the configuration window
	 * of the widget. Should be overridden by child classes.
	 * @return {array} An array of configuration objects for {@link Ext.Component components}
	 */
	getConfigurationItems: function()
	{
		return [];
	},

	/**
	 * Event handler which is fired when one of the fields in the Configuration dialog
	 * has been changed. This will update the corresponding option in the settings.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Mixed} newValue The new value which was applied
	 * @param {Mixed} oldValue The old value which was applied
	 * @private
	 */
	onFieldChange: function (field, newValue, oldValue)
	{
		var fieldName = field.getName();
		this.set(fieldName, newValue);

		if (fieldName === 'widgetheight') {
			this.setHeight(newValue);
		}

		if (fieldName === 'reloadinterval') {
			this.startReloadTask();
		}
	}
});
