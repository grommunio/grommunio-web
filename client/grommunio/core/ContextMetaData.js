Ext.namespace('Grommunio.core');

/**
 * @class Grommunio.core.ContextMetaData
 * @extends Grommunio.core.PluginMetaData
 *
 * The Meta Data object containing the registration details
 * of a {@link Grommunio.core.Context}. An instance of this object
 * must be passed to {@link Grommunio.core.Container#registerContext}.
 */
Grommunio.core.ContextMetaData = Ext.extend(Grommunio.core.PluginMetaData, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// By default Contexts cannot be disabled
			allowUserDisable: false
		});

		Grommunio.core.ContextMetaData.superclass.constructor.call(this, config);
	}
});
