(function() {
	var orig_initList = Ext.form.ComboBox.prototype.initList;
	var orig_expand = Ext.form.ComboBox.prototype.expand;
	var orig_initComponent = Ext.form.ComboBox.prototype.initComponent;

	Ext.override(Ext.form.ComboBox, {
		// private
		defaultAutoCreate : {tag: "input", type: "text", size: "24", autocomplete: "off", spellcheck: 'true'},

		/*
		 * Overridden to add 'beforeexpand' event.
		 */
		initComponent : function()
		{
			orig_initComponent.apply(this, arguments);

			this.addEvents(
				/**
				 * @event beforeexpand
				 * Fires before list is expanded. Return false to cancel the expansion.
				 * @param {Ext.form.ComboBox} combo This combo box
				 */
				'beforeexpand'
			);
		},

		/*
		 * Fix the default behavior for the Ext.form.Combobox. By default the combobox
		 * will not encode any text which is placed into the list. Since the entire
		 * combobox accepts data directly from a store this can be dangerous and it is
		 * better to htmlEncode the data by default.
		 */
		initList : function()
		{
			if (!this.tpl) {
				this.tpl = '<tpl for="."><div class="x-combo-list-item">{' + this.displayField + ':htmlEncode}</div></tpl>';
			}
			orig_initList.apply(this, arguments);
		},

		/*
		 * Overridden to provide facility to fire 'beforeexpand' event.
		 */
		expand : function()
		{
			if(this.isExpanded() || !this.hasFocus){
				return;
			}

			if(this.fireEvent('beforeexpand', this) !== false){
				orig_expand.apply(this, arguments);
			}
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
