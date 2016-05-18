Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.ImportanceButton
 * @extends Zarafa.core.ui.menu.ConditionalItem
 * @xtype zarafa.importancebutton
 *
 * Extension of the {@link Zarafa.core.ui.menu.ConditionalItem Conditional MenuItem}.
 * This class adds support for easily setting the importance on a {@link Zarafa.core.data.IPMRecord record}.
 */
Zarafa.common.ui.ImportanceButton = Ext.extend(Zarafa.core.ui.menu.ConditionalItem, {
	/**
	 * @cfg {Number} The importance value for this button
	 */
	importanceValue: 1,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.importancebutton',
			handler: function() {
				this.applyFlag(this.getRecords());
			},
			scope: this
		});

		Zarafa.common.ui.ImportanceButton.superclass.constructor.call(this, config);
	},

	/**
	 * Apply the Flag settings as defined in this button to the
	 * {@link Zarafa.core.data.IPMRecord records} given as arguments.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The records to which the flags must be applied
	 */
	applyFlag : function(records)
	{
		if (Ext.isEmpty(records))
			return;

		var store;

		Ext.each(records, function(record) {
			store = record.getStore();
			record.set('importance', this.importanceValue);
		}, this);

		store.save(records);
	}
});

Ext.reg('zarafa.importancebutton', Zarafa.common.ui.ImportanceButton);
