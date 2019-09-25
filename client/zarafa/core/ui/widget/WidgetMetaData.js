Ext.namespace('Zarafa.core.ui.widget');

/**
 * @class Zarafa.core.ui.widget.WidgetMetaData
 * @extends Object
 *
 * The Meta Data object containing the registration details
 * of a {@link Zarafa.core.ui.widget.Widget}. An instance of this object
 * must be passed to {@link Zarafa.core.Container#registerWidget}.
 */
Zarafa.core.ui.widget.WidgetMetaData = Ext.extend(Object, {
	/**
	 * @cfg {String} name (required) The unique name for this widget.
	 * For a user-friendly name for UI components, see {@link #displayName}
	 */
	name : '',

	/**
	 * @cfg {String} displayName The display name for this widget. This
	 * will be used in places where the widget is referenced in UI components.
	 * If not provided, {@link #name} will be used.
	 */
	displayName : '',

	/**
	 * @cfg {String} iconCls The icon to be used in places where the widget is referenced
	 * in UI components.
	 */
	iconCls : '',

	/**
	 * @cfg {String} iconPath (deprecated) The path to the icon to be used in places where the widget is referenced
	 * in UI components. This configuration option is deprecated, it is preferred to use {@link #iconCls} instead.
	 */
	iconPath : '',

	/**
	 * @cfg {String} about The about text. If provided, {@link Zarafa.core.ui.widget.Widget#registerAboutText}
	 * will be automatically called during {@link Zarafa.core.ui.widget.Widget#initWidget initialization}.
	 */
	about : undefined,

	/**
	 * @cfg {Constructor} WidgetConstructor (required) The constructor of the
	 * {@link Zarafa.core.ui.widgetWidget} which is described by this WidgetMetaData instance.
	 */
	widgetConstructor : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.apply(this, config);

		Zarafa.core.ui.widget.WidgetMetaData.superclass.constructor.call(this, config);

		// Initialize displayName if not initialized from config
		if (Ext.isEmpty(this.displayName)) {
			this.displayName = this.name;
		}
	},

	/**
	 * Obtain the unique name for this widget
	 * @return {String} The unique name for this widget
	 */
	getName : function()
	{
		return this.name;
	},

	/**
	 * Obtain the display name for this widget
	 * @return {String} The display name for this widget
	 */
	getDisplayName : function()
	{
		return this.displayName;
	},

	/**
	 * Obtain the CSS classname for this widget
	 * @return {String} The CSS classname for this widget
	 */
	getIconCls : function()
	{
		return this.iconCls;
	},

	/**
	 * Obtain the path to the image for this widget
	 * @return {String} The path to the icon for this widget
	 */
	getIconPath : function()
	{
		return this.iconPath;
	},

	/**
	 * Obtain the About text containing the copyright and other disclaimers.
	 * @return {String} The about text for this widget
	 */
	getAbout : function()
	{
		return this.about;
	},

	/**
	 * Obtain the instance of the {@link Zarafa.core.ui.widget.Widget} which is instantiated
	 * using the {@link #widgetConstructor}.
	 * @param {Object} config The configuration object to apply
	 * @return {Zarafa.core.ui.widget.Widget} The Widget instance
	 */
	getInstance : function(config)
	{
		return new this.widgetConstructor(Ext.apply({ info : this }, config));
	}
});
