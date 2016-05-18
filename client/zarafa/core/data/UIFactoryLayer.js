Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UIFactoryLayer
 * @extends Object
 *
 * A Layer object which must be {@link Zarafa.core.data.UIFactory#registerLayer registered}}
 * to the {@link Zarafa.core.data.UIFactory UIFactory}. This object describes the 
 * Layer on which a {@link Zarafa.core.ui.ContentPanel Content Panel} can be placed. 
 */
Zarafa.core.data.UIFactoryLayer = Ext.extend(Object, {
	/**
	 * @cfg {String} type The name of the Content Layer
	 * which uniqely identifies this layer.
	 */
	type : '',

	/**
	 * @cfg {Number} index The index of the Content Layer. See
	 * {@link Zarafa.core.data.UIFactory#getPreferredLayer} for
	 * the ordering logic which is applied.
	 */
	index : undefined,

	/**
	 * @cfg {Array} plugins The plugins which must be installed
	 * on the Panel which is going to be installed on the Content Layer
	 */
	plugins : undefined,

	/**
	 * @cfg {Boolean} allowModal True if this Content Layer
	 * supports 'modal' components to be added.
	 */
	allowModal : false,

	/**
	 * @cfg {Object} manager The manager instance which is managing
	 * the Content Layer (e.g. {@link Ext.WindowGroup} or {@link Ext.TabPanel}.
	 */
	manager : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * The create function which is invoked when a component needs to be added to the Container using
	 * this Layer. This must be overridden by subclasses.
	 * @param {Function} Constructor The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 * passed to the constructor when creating the component
	 * @protected
	 */
	create : Ext.emptyFn
});
