Ext.namespace('Zarafa.core.ui.widget');

/**
 * @class Zarafa.core.ui.widget.WidgetPanel
 * @extends Zarafa.core.ui.MainViewSidebar
 * @xtype zarafa.widgetpanel
 * 
 * The main panel which contains {@link Zarafa.core.ui.widget.Widget widgets}.
 */
Zarafa.core.ui.widget.WidgetPanel = Ext.extend(Zarafa.core.ui.MainViewSidebar, {
	/**
	 * @cfg {String} settingsPath The settings base in which all settings
	 * for this panel will be saved.
	 */
	settingsPath : '',

	/**
	 * @cfg {Array} showDefaultWidgets list of widgets which should be shown at first.
	 */
	showDefaultWidgets : undefined,

	/**
	 * @cfg {Number} numColumns The number of columns which should be used
	 * to divide the widgets over the panel.
	 */
	numColumns : 3,

	/**
	 * The portal in which the widgets are located
	 * @property
	 * @type Ext.ux.Portal
	 */
	portal : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var columns = [];
		var numColumns = config.numColumns || this.numColumns;
		for (var i = 0; i < numColumns; i++) {
			columns.push(new Ext.ux.PortalColumn({
				columnWidth: 1 / numColumns,
				style :'padding:10px 10px 10px 10px'
			}));
		}

		var tools = [{
			id : 'plus',
			scope : this,
			handler: function() {
				Zarafa.common.Actions.openWidgetsContent({
					widgetPanel : this,
					manager : Ext.WindowMgr
				});
			}
		}];

		this.portal = new Ext.ux.Portal({
			items : columns,
			border : false,
			dropConfig : {
				ddGroup : 'dd.widget'
			}
		});

		Ext.applyIf(config, {
			cls: 'zarafa-widgetpanel',
			headerCfg : { cls : 'zarafa-main-header x-panel-header' },
			layout : 'fit',
			tools : tools,
			items : [ this.portal ]
		});

		Zarafa.core.ui.widget.WidgetPanel.superclass.constructor.call(this, config);

		this.loadWidgets();

		this.mon(this.portal, {
			'drop' : this.onDrop,
			scope :	this
		});
	},

	/**
	 * Event handler which is fired when a {@link Zarafa.core.ui.widget.Widget widget} is
	 * being dropped on this panel. This will {@link #removeGuid unregister} the widget
	 * from the previous {@link Zarafa.core.ui.widget.WidgetPanel owner} and
	 * {@link #addGuid} it to this panel.
	 * @param {Ext.EventObject} event The event for this event
	 * @private
	 */
	onDrop : function(event)
	{
		// Check if the parent has been changed
		var widget = event.panel;
		if (widget.widgetPanel != this) {
			widget.widgetPanel.removeGuid(widget.guid);
			this.addGuid(widget.guid);
			widget.widgetPanel = this;
		}

		// HACK!
		// There seems to be an issue that when dropping
		// the item that the Drag/DropZone is not hiding the
		// proxy which results in the widget.getVisibilityEl()
		// to remain hidden.
		event.source.proxy.hide();
		widget.doLayout(true);

		// Save column index if changed.
		if (widget.columnIndex != event.columnIndex) {
			widget.set('columnIndex', event.columnIndex);
		}
	},

	/**
	 * Load all widgets from the settings and them to the correct column.
	 * @private
	 */
	loadWidgets : function()
	{
		var settings = container.getSettingsModel();
		var guids = settings.get(this.settingsPath + '/guids');

		var verifiedGuids = [];

		if(!Ext.isDefined(guids)) {
			/* 
			 * For the first time when webapp reload for the user
			 * settingsPath/guids is undefined, and from then on
			 * it will be string either empty or guids pointing widgets.
			 * Here we are setting two widgets for the first load of webapp
			 * so that it doesn't show empty screen for today view on first load.
			 */
			if(Ext.isArray(this.showDefaultWidgets)) {
				for (var i = 0; i < this.showDefaultWidgets.length; i++) {
					this.createWidget(this.showDefaultWidgets[i], i % 3);
				}
			}
		} else if (!Ext.isEmpty(guids)) {
			// Go over all guids
			Ext.each(guids.split(/\W+/), function(guid) {
				// If the guid is empty, there is no point in continuing.
				if (Ext.isEmpty(guid)) {
					return;
				}

				var widgetName = settings.get(Zarafa.core.ui.widget.Widget.settingsPath(guid, '__name'));
				var widgetMetaData = container.getWidgetMetaDataByName(widgetName);

				if (widgetMetaData) {
					// Widget has been found, allocate it
					var widget = widgetMetaData.getInstance({
						widgetPanel : this,
						guid : guid
					});

					// Obtain the column index from settings
					var columnIndex = (widget.get('columnIndex') || 0) % this.numColumns;

					this.portal.get(columnIndex).add(widget);

					verifiedGuids.push(guid);
				} else {
					// Widget is invalid or not installed, remove its settings
					settings.remove(Zarafa.core.ui.widget.Widget.settingsPath(guid, ''));
				}
			}, this);

			settings.set(this.settingsPath + '/guids', verifiedGuids.join(' '));
		}
	},

	/**
	 * Register a guid so it will be reopened automatically during next reload
	 * @param {String} guid The unique ID of the widget which has to be registered
	 * @private
	 */
	addGuid : function(guid)
	{
		var settings = container.getSettingsModel();

		// Add the guid to the list of current widget instances.
		var instanceList = settings.get(this.settingsPath + '/guids') || '';

		instanceList += (instanceList === '' ? '' : ' ') + guid;

		settings.set(this.settingsPath + '/guids', instanceList);
	},

	/**
	 * Unregister a previously {@link #addGuid registered} guid so the widget is no longer reopened
	 * @param {String} guid The unique ID of the widget which has to be unregistered
	 * @private
	 */
	removeGuid : function(guid)
	{
		var settings = container.getSettingsModel();

		// Add the guid to the list of current widget instances.
		var instanceList = settings.get(this.settingsPath + '/guids');

		instanceList = instanceList.replace(guid,'');
		instanceList = instanceList.replace(/\W+/,' ');

		settings.set(this.settingsPath + '/guids', instanceList);
	},

	/**
	 * Create a new widget which can be added to this panel.
	 * @param {String} name The name of the widget to add
	 * @param {Number} The preferred column in which the widget should be placed
	 */
	createWidget : function(name, column)
	{
		var widgetMetaData = container.getWidgetMetaDataByName(name);
		if (!Ext.isDefined(column)) {
			column = 0;
		}

		if (widgetMetaData) {
			var guid = Zarafa.generateId(32);

			this.addGuid(guid);

			var widget = widgetMetaData.getInstance({
				widgetPanel : this,
				guid : guid
			});

			// Record the type of the newly created widget.
			widget.set('__name', name);

			this.portal.get(column).add(widget);
			this.doLayout();
		}
	},

	/**
	 * Destroy a widget and {@link #removeGuid unregister the guid}.
	 * @param {Zarafa.core.ui.widget.Widget} widget The widget to destroy
	 * @private
	 */
	destroyWidget : function(widget)
	{
		// Remove guid from the parent widget panel.
		this.removeGuid(widget.guid);

		// Remove settings.
		container.getSettingsModel().remove(Zarafa.core.ui.widget.Widget.settingsPath(widget.guid, ''));

		widget.ownerCt.remove(widget, true);
	}
});

Ext.reg('zarafa.widgetpanel', Zarafa.core.ui.widget.WidgetPanel);
