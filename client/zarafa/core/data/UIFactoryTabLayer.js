Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UIFactoryTabLayer
 * @extends Zarafa.core.data.UIFactoryLayer
 *
 * This layer supports placing {@link Zarafa.core.ui.ContentPanel Content Panels}
 * to be placed inside a {@link Ext.TabPanel} instance.
 */
Zarafa.core.data.UIFactoryTabLayer = Ext.extend(Zarafa.core.data.UIFactoryLayer, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			type : 'tabs',
			index : 1,
			allowModal : false,
			plugins : [ 'zarafa.contenttablayerplugin' ]
		});

		Zarafa.core.data.UIFactoryTabLayer.superclass.constructor.call(this, config);
	},

	/**
	 * The create function which is invoked when a component needs to be added to the Container using
	 * this Layer.
	 * @param {Function} Constructor The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 * passed to the constructor when creating the component
	 * @protected
	 */
	create : function(component, config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.enablefocusplugin');

		var tabContainer = new component(config);
		container.getTabPanel().add(tabContainer);
	}
});

Zarafa.core.data.UIFactory.registerLayer(new Zarafa.core.data.UIFactoryTabLayer());
