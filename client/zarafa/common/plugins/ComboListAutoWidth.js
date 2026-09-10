Ext.namespace('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.ComboListAutoWidth
 * @extends Object
 * @ptype zarafa.combolistautowidth
 *
 * Widens the dropdown list of a {@link Ext.form.ComboBox combobox} to its
 * longest entry, so translated options are not clipped at the field width.
 */
Zarafa.common.plugins.ComboListAutoWidth = Ext.extend(Object, {
	/**
	 * @cfg {Number} padding Room added to the measured text for the list frame and scrollbar
	 */
	padding: 40,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Initialize the plugin for the given combobox.
	 * @param {Ext.form.ComboBox} combo The combobox on which the plugin is installed
	 */
	init: function(combo)
	{
		combo.on('expand', this.onExpand, this);
	},

	/**
	 * Measure the widest entry once the list is shown and widen the list to fit it.
	 * @param {Ext.form.ComboBox} combo The expanded combobox
	 * @private
	 */
	onExpand: function(combo)
	{
		if (!combo.view || !combo.view.el || !combo.list) {
			return;
		}

		var metrics = Ext.util.TextMetrics.createInstance(combo.view.el);
		var width = 0;
		combo.store.each(function(record) {
			width = Math.max(width, metrics.getWidth(Ext.util.Format.htmlEncode(record.get(combo.displayField))));
		});
		width += this.padding;

		if (width > combo.list.getWidth()) {
			combo.list.setWidth(width);
			combo.innerList.setWidth(width - combo.list.getFrameWidth('lr'));
		}
	}
});

Ext.preg('zarafa.combolistautowidth', Zarafa.common.plugins.ComboListAutoWidth);
