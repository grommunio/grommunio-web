Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Plugin
 * @extends Zarafa.core.data.StatefulObservable
 * 
 * A pluggable component. It can be used to implement UI plug-ins
 * or content contexts such as the email context, notes context, etc.
 * <p>
 * Each plugin should be registered manually with the global Container object.
 * The container can then be used to enumerate the registered plugins.   
 * <p>
 * This class was intended to be overridden.
 */
Zarafa.core.Plugin = Ext.extend(Zarafa.core.data.StatefulObservable, {
	/**
	 * @cfg {Zarafa.core.PluginMetaData} info The Plugin MetaData object
	 * which was used to {@link Zarafa.core.Container#registerPlugin register}
	 * this Plugin to the {@link Zarafa.core.Container container}.
	 */
	info : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Zarafa.core.Plugin.superclass.constructor.call(this, config);

		this.initPlugin();
	},

	/**
	 * Function to be implemented by Plugin subclasses to initialize the plugin.
	 * @protected
	 */
	initPlugin : function()
	{
		var about = this.info.getAbout();

		// If the about text is provided, automatically register it
		if (!Ext.isEmpty(about)) {
			this.registerAboutText(this.getDisplayName(), about);
		}
	},

	/**
	 * Returns the name of the plugin.
	 * @return {String} name context name
	 */
	getName : function() {
		return this.info.getName();
	},

	/**
	 * Return the display name for this plugin.
	 * @return {String} Display name as string
	 */
	getDisplayName : function()
	{
		return this.info.getDisplayName();
	},

	/**
	 * Obtain the CSS classname for this plugin
	 * @return {String} The CSS classname for this plugin
	 */
	getIconCls : function()
	{
		return this.info.getIconCls();
	},

	/**
	 * Obtain the base path for the {@link Zarafa.settings.SettingsModel settings} in which the settings
	 * for this plugin can be found.
	 * @return {String} The settings path
	 */
	getSettingsBase : function()
	{
		return this.info.getSettingsBase();
	},

	/**
	 * Add a About/Copyright notice to the WebApp, to the {@link Zarafa.settings.ui.SettingsCopyrightCategory About Category}
	 * inside the {@link Zarafa.settings.SettingsContext Settings}. This is a convenience function which will use the
	 * {@link Zarafa.settings.ui.SettingsCopyrightCategory#context.settings.category.copyright context.settings.category.copyright}
	 * insertion point.
	 * @param {String} title The title for the About widget
	 * @param {String} text The text which should be shown in the About text (may contain HTML)
	 * @protected
	 */
	registerAboutText : function(title, text)
	{
		this.registerInsertionPoint('context.settings.category.copyright', function() {
			return {
				xtype : 'zarafa.settingscopyrightwidget',
				title : title,
				about : text
			};
		});
	},

	/**
	 * Registers a function with an insertion point. The function will be called when the insertion point
	 * is populated using <code>container.populateInsertionPoint</code> and is expected to return one or 
	 * more instances of {@link Ext.Component Component}. 
	 * <p>
	 * The 'match' parameter can be either a string denoting the name of the insertion point, or a 
	 * regular expression if the function should be called for more than one insertion point (i.e. /toolbar.* / 
	 * will match all insertion points starting with 'toolbar').
	 * <p>
	 * The function will be called exactly once for each matched insertion point.
	 * @param {Mixed} match a string or regexp
	 * @param {Function} createFunction function that creates one or more ExtJS components at the specified insertion point
	 * @param {Object} scope (optional) scope in which to run the create function (defaults to undefined).
	 */
	registerInsertionPoint : function(match, createFunction, scope)
	{
		if (!this.insertionPoints) {
			this.insertionPoints = [];
		}
		
		if (!scope) {
			scope = this;
		}
		
		this.insertionPoints.push({
			match : match,
			createFunction : createFunction,
			scope : scope
		});
	},
	
	/**
	 * Returns a set of components for a given insertion point.
	 * @param {String} insertionPointName the name of the insertion point
	 * @return {Mixed} either undefined or an array of {Ext.Component} objects. 
	 */
	getComponents : function(insertionPointName)
	{
		var ret = [];

		// convert arguments object to a real array
		var args = Ext.toArray(arguments);

		// check if we have a registered handler for this insertionPoint
		Ext.each(this.insertionPoints, function(insertionPoint) {
			if ((typeof insertionPoint.match=='string' && insertionPoint.match==insertionPointName) ||
				(insertionPoint.match.constructor && insertionPoint.match.constructor==RegExp && insertionPoint.match.test(insertionPointName)))
			{
				var components = insertionPoint.createFunction.apply(insertionPoint.scope, args);

				if (components === undefined || components === null) {
					components = [];
				}

				if (!Ext.isArray(components)) {
					components = [ components ];
				}

				ret.push.apply(ret, components);
			}
		}, this);

		return ret;
	},
	
	/**
	 * Produces a bid on the shared component. A negative bid (-1) indicates 
	 * that this plug-in can return a shared component. A positive bid (1) 
	 * indicates that it can, and a higher bid (>1) can be used to override 
	 * default plug-ins. The context that bids the highest is selected to return
	 * the shared component through the {@link #getSharedComponent} function.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record (optional) Passed record.
	 * @return {Number} a bid on the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		return -1;
	},

	/**
	 * When the Plugin has returned the highest {@link #bidSharedComponent bid} for the
	 * given type and record, it must return the desired {@link Ext.Component component}
	 * with this function.
	 *
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component which is requested.
	 * @param {Ext.data.Record} record (optional) Passed record.
	 * @return {Constructor} The class constructor of the Shared Component.
	 */
	getSharedComponent : function(type, record)
	{
		return undefined;
	}
});
