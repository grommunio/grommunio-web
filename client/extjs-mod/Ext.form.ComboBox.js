(function() {
	/*
	 * Fix the default behavior for the Ext.form.Combobox. By default the combobox
	 * will not encode any text which is placed into the list. Since the entire
	 * combobox accepts data directly from a store this can be dangerous and it is
	 * better to htmlEncode the data by default.
	 */
	var orig_initList = Ext.form.ComboBox.prototype.initList;

	Ext.override(Ext.form.ComboBox, {
	    // private
	    defaultAutoCreate : {tag: "input", type: "text", size: "24", autocomplete: "off", spellcheck: 'true'},

		initList : function()
		{
			if (!this.tpl) {
				this.tpl = '<tpl for="."><div class="x-combo-list-item">{' + this.displayField + ':htmlEncode}</div></tpl>';
			}
			orig_initList.apply(this, arguments);
		},

		/*
		 * Override getListParent to return the body element of the owner document which owns the list element.
		 * @return {HTMLElement} The body of owner document of list element.
		 */
		getListParent : function()
		{
			var elOwnerDocument = this.getEl() ? this.getEl().dom.ownerDocument : undefined;

			if(elOwnerDocument){
				return elOwnerDocument.body;
			} else {
				return document.body;
			}
		}
	});
})();
