(function() {
	/*
	 * Fix the default behavior for the Ext.form.Combobox. By default the combobox
	 * will not encode any text which is placed into the list. Since the entire
	 * combobox accepts data directly from a store this can be dangerous and it is
	 * better to htmlEncode the data by default.
	 */
	var orig_initList = Ext.form.ComboBox.prototype.initList;

	Ext.override(Ext.form.ComboBox, {
		initList : function()
		{
			if (!this.tpl) {
				this.tpl = '<tpl for="."><div class="x-combo-list-item">{' + this.displayField + ':htmlEncode}</div></tpl>';
			}
			orig_initList.apply(this, arguments);
		}
	});
})();
