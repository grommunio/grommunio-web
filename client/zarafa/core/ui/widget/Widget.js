Ext.namespace('Zarafa.core.ui.widget');

/**
 * @class Zarafa.core.ui.widget.Widget
 * @extends Ext.ux.Portlet
 * @xtype zarafa.widget
 *
 * A 'widget' is a plug-in that users can instantiate and put on their today view or tool bar.
 * Examples of widgets are the clock, the weather widget, public notes, etc.
 *
 * Users can add new instances of a widget freely, and create multiple instances if desired. Each
 * widget instance has a unique GUID, and settings for that instance are stored in the widgets/[GUID]
 * settings folder. When a widget is destroyed, that folder is deleted.
 */
Zarafa.core.ui.widget.Widget = Ext.extend(Ext.ux.Portlet, {
	/**
	 * @cfg {Zarafa.core.WidgetInfo} info The Widget Meta Data object
	 * which was used to {@link Zarafa.core.Container#registerWidget register}
	 * this Widget to the {@link Zarafa.core.Container container}.
	 */
	info : undefined,

	/**
	 * @cfg {String} guid The unique identifier used for reference to this particular
	 * widget in side a {@link Zarafa.core.ui.widget.WidgetPanel}. This is used for
	 * {@link #set setting} and {@link #get getting} {@link Zarafa.settings.SettingsModel settings}.
	 */
	guid : undefined,

	/**
	 * @cfg {Boolean} hasConfig True if the {@link #config} function
	 * has been implemented and a 'gear' icon should be shown besides
	 * the close button.
	 */
	hasConfig : false,

	/**
	 * @cfg {String} about The about text. If provided, {@link #registerAboutText}
	 * will be automatically called during {@link #initWidget initialization}.
	 */
	about : undefined,

	/**
	 * The widget panel on which this widget is located
	 * @property
	 * @type Zarafa.core.ui.widget.WidgetPanel
	 */
	widgetPanel : undefined,

	/**
	 * {@link Ext.QuickTips tooltip} message for the widget's collapse {@link Ext.Button button}
	 * @property
	 * @type String
	 */
	collapseQuickTip : undefined,

	/**
	 * {@link Ext.QuickTips tooltip} message for the widget's expand {@link Ext.Button button}
	 * @property
	 * @type String
	 */
	expandQuickTip : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var tools = config.tools || [];

		// Check if the configuration function has been
		// implemented. If it is the case, create the config tool.
		if (config.hasConfig === true) {
			tools.push({
				id : 'gear',
				qtip: _('Configure widget'),
				handler: this.config,
				scope : this
			});
		}

		// Always add the close tool.
		tools.push({
			id : 'close',
			qtip: _('Remove widget'),
			scope : this,
			handler: this.close
		});

		Ext.applyIf(config, {
			title : config.info.getDisplayName(),
			anchor : '100%',
			frame : true,
			collapsible : true,
			collapseQuickTip: _('Collapse widget'),
			expandQuickTip: _('Expand widget'),
			draggable : {
				ddGroup : 'dd.widget'
			},
			tools : tools
		});

		Zarafa.core.ui.widget.Widget.superclass.constructor.call(this, config);

		this.initWidget();
	},

	/**
	 * Called during rendering of the panel, this will initialize all events.
	 * @private
	 */
	initEvents: function ()
	{
		Zarafa.core.ui.widget.Widget.superclass.initEvents.call(this);
		this.on('afterlayout', this.setCollapseQuickTip, this, {single: true});
		this.on('expand', this.setCollapseQuickTip, this);
		this.on('collapse', this.setExpandQuickTip, this);
	},

	/**
	 * Event handler which is called after {@link Zarafa.core.ui.MainViewSidebar panel} get layout
	 * This will set {@link Ext.QuickTips} on {@link Ext.Button collapse} button
	 * @private
	 */
	setCollapseQuickTip: function ()
	{
		this.tools['toggle'].dom.qtip = this.collapseQuickTip;
	},

	/**
	 * Event handler which is called before {@link Zarafa.core.ui.MainViewSidebar panel} collapse
	 * This will set {@link Ext.QuickTips} on {@link Ext.Button expand} button
	 * @private
	 */
	setExpandQuickTip: function ()
	{
		this.tools['toggle'].dom.qtip = this.expandQuickTip;
	},

	/**
	 * Function to be implemented by Widget subclasses to initialize the widget.
	 * @protected
	 */
	initWidget : function()
	{
		// If the about text is provided, automatically register it
		if (!Ext.isEmpty(this.about)) {
			this.registerAboutText(this.title, this.about);
		}
	},

	/**
	 * Add a About/Copyright notice to the Widget.
	 * @param {String} title The title for the About widget
	 * @param {String} text The text which should be shown in the About text (may contain HTML)
	 * @protected
	 */
	registerAboutText : function(title, text)
	{
		this.tools.splice(this.tools.length - 1, 0, {
			id : 'help',
			qtip: -('About this widget'),
			handler : this.showAbout,
			scope : this,
			title : title,
			text : text
		});
	},

	/**
	 * Checks if this widget is currently visible. This returns true when
	 * the widget itself is {@link #isVisible visible} and the {@link #widgetPanel}
	 * is currently not {@link Ext.Panel#collapsed}.
	 */
	isWidgetVisible : function()
	{
		return this.isVisible() && !this.widgetPanel.collapsed;
	},

	/**
	 * Called when the widget has been rendered.
	 * This will initialize the {@link #widgetPanel}.
	 */
	onRender : function()
	{
		Zarafa.core.ui.widget.Widget.superclass.onRender.apply(this, arguments);
		this.widgetPanel = this.findParentByType('zarafa.widgetpanel');
	},

	/**
	 * Get a settings property..
	 * @param {String} key settings path. This is path relative to where the widget's settings are stored.
	 * @return {String} value.
	 */
	get : function(key)
	{
		return container.getSettingsModel().get(Zarafa.core.ui.widget.Widget.settingsPath(this.guid, key));
	},

	/**
	 * Set a settings property.
	 * @param {String} key settings path. This is path relative to where the widget's settings are stored.
	 * @param {String} value value.
	 */
	set : function(key, value)
	{
		container.getSettingsModel().set(Zarafa.core.ui.widget.Widget.settingsPath(this.guid, key), value);
	},

	/**
	 * Closes and destroys the widget, removing its settings from the settings tree.
	 */
	close : function(e, target, panel)
	{
		this.widgetPanel.destroyWidget(this);
	},

	/**
	 * Called when a user clicks the config button on the widget panel.
	 * Should be overridden by child classes.
	 * @protected
	 */
	config : Ext.emptyFn,

	/**
	 * Called when a user clicks the about button on the widget panel.
	 * This will show a {@link Ext.Window} containing the {@link #about} text.
	 * @protected
	 */
	showAbout : function(event, toolEl, panel, tc)
	{
		var win = new Ext.Window({
			title: tc.title,
			width: 320,
			height: 200,
			padding : 5,
			autoScroll: true,
			items : [{
				xtype : 'panel',
				layout : 'form',
				border : false,
				items :  [{
					xtype : 'displayfield',
					value : tc.text,
					hideLabel : true,
					htmlEncode : false
				}]
			}]
		});

		win.show(this);
	}
});

Ext.reg('zarafa.widget', Zarafa.core.ui.widget.Widget);

/**
 * @param {String} guid The unique identifier for a {@link Zarafa.core.ui.widget.Widget widget}.
 * @param {String} key The setting key which should be updated
 * @return {String} The settings path for the guid & key combination.
 * @static
 */
Zarafa.core.ui.widget.Widget.settingsPath = function(guid, key)
{
	return ('zarafa/v1/widgets/' + guid + '/' + key).replace(/(\/)+/,'/');
};
