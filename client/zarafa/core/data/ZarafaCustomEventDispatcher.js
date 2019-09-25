Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ZarafaCustomEventDispatcher
 * @extends Ext.util.Observable
 * @singleton
 *
 * This singleton can be used to register events that have to be available in the whole Webapp.
 */
Zarafa.core.data.ZarafaCustomEventDispatcher = Ext.extend(Ext.util.Observable, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config) {
		// Call our superclass constructor to complete construction process.
		Zarafa.core.data.ZarafaCustomEventDispatcher.superclass.constructor.call(this, config);
	}
});

// make it a singleton
Zarafa.core.data.ZarafaCustomEventDispatcher = new Zarafa.core.data.ZarafaCustomEventDispatcher();
