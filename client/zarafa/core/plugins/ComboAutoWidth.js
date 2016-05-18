Ext.ns('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.ComboAutoWidth
 * @extends Ext.util.Observable
 * @ptype zarafa.comboautowidth
 *
 * this plugin will set the width of the combo box to the width of the maximum text in list
 */
Zarafa.core.plugins.ComboAutoWidth = Ext.extend(Ext.util.Observable, {
	/**
	 * Initialize the plugin for the given {@link Ext.form.Field field}
	 * @param {Ext.form.ComboBox} comboBox on which the plugin is placed
	 */
	init : function(combo)
	{
		this.container = combo;

		combo.mon(combo.store, 'load', this.resizeToFitContent, this);
		combo.on('render', this.resizeToFitContent, this);
	},

	/**
	 * Called in response to a load event from the addressbook comboBox store.
	 * resize the combobox innerlist according to the widest list item content
	 * @param {Zarafa.core.data.IPMStore} store store that fired the event.
	 * @private
	 */
	resizeToFitContent : function()
	{
		var combo = this.container;
		var store = combo.getStore();
		var listWidth = 0;
		var textMetrics = Ext.util.TextMetrics.createInstance(combo.el);

		store.each(function(record) {
			var curWidth = textMetrics.getWidth(record.get(combo.displayField));
			if (curWidth > listWidth) {
				listWidth = curWidth;
			}
		});

		if (listWidth > 0) {
			listWidth = Math.max(combo.minListWidth, listWidth);

			listWidth += combo.getTriggerWidth(); // to accomodate combo's down arrow.
			if (combo.getWidth() < listWidth) {
				if (!combo.list) {
					combo.listWidth = listWidth;
				} else {
					combo.list.setWidth(listWidth);
				}
			}
		}
	}
});

Ext.preg('zarafa.comboautowidth', Zarafa.core.plugins.ComboAutoWidth);
