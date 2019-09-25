Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.ColumnModel
 * @extends Ext.grid.ColumnModel
 *
 * This adds some extra functionality to the default {@link Ext.grid.ColumnModel}.
 */
Zarafa.common.ui.grid.ColumnModel = Ext.extend(Ext.grid.ColumnModel, {
	/**
	 * @cfg {String} name The name of the columnModel which is currently used.
	 * This is used by the {@link Zarafa.common.ui.grid.GridPanel GridPanel}
	 * in the Settings path which is used to obtain the column configuration.
	 */
	name : 'default',

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.addEvents(
			/**
			 * @event beforeconfigchange
			 * Fired right before the configuration is being changed, this allows
			 * the event handler to update the configuration if needed.
			 *
			 * @param {Ext.grid.ColumnModel} columnModel The column model which is being reconfigured
			 * @param {Object} The configruation object which is used to reconfigure the model
			 * @return (optional) if false the {@link #setConfig} call will be aborted and the column
			 * model will not be reconfigured.
			 */
			'beforeconfigchange'
		);

		Ext.apply(this, config);

		Zarafa.common.ui.grid.ColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Reconfigures this column model according to the passed Array of column definition objects.
	 * For a description of the individual properties of a column definition object, see the {@link #columns Config Options}.
	 * Causes the {@link #beforeconfigchange} and {@link #configchange} events to be fired.
	 * A {@link #Ext.gridGridPanel GridPanel} using this ColumnModel will listen for this event and refresh its UI automatically.
	 *
	 * @param {Object} config The configuration to set on the columnmodel
	 * @param {Boolean} initial True if this is the initial configuration of the columnmodel
	 * @protected
	 */
	setConfig : function(config, initial)
	{
		// Make a fresh copy of the configuration array. The 'beforeconfigchange' allows for
		// modifications on the argument we pass it. So we need a copy to prevent the default
		// values to be overridden accidentely.
		var newConfig = [];
		for (var i = 0, len = config.length; i < len; i++) {
			newConfig.push(Ext.apply({}, config[i]));
		}

		if (this.fireEvent('beforeconfigchange', this, newConfig) !== false) {
			Zarafa.common.ui.grid.ColumnModel.superclass.setConfig.call(this, newConfig, initial);
		}
	},

	/**
	 * Setup any saved state for the column, ensures that defaults are applied.
	 * @param {Number} col The column index of the column to update
	 * @param {Object} state The state object which should be applied to the column
	 * @private
	 */
	setState : function(col, state)
	{
		var column = this.getColumnAt(col);
		if ( column.fixed === true ){
			// Fixed columns should not be reset by the state. This is necessary
			// because the widths of some fixed columns have changed when the new
			// design was implemented, but the state would restore the old width.
			state.width = column.width;
		}
		
		Zarafa.common.ui.grid.ColumnModel.superclass.setState.apply(this, arguments);
		// The state has been applied, this means the totalWidth is invalid
		this.totalWidth = null;
	}
});
