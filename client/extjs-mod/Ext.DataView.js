(function() {
	/*
	 * Override Ext.DataView to provide the ability to insert extra item in dropdown-ist.
	 * This extra item can be another HTML element for which we can listen click event.
	 */
	var orig_onClick = Ext.DataView.prototype.onClick;
	var orig_initComponent = Ext.DataView.prototype.initComponent;

	Ext.override(Ext.DataView, {
		/*
		 * Override to add events for {@link Zarafa.common.ui.BoxField#extraItemSelector extraItemSelector} element.
		 * @override
		 */
		initComponent : function()
		{
			orig_initComponent.apply(this, arguments);

			this.addEvents(
				/**
				 * @event extraitemclick
				 * Fires when an extra template node is clicked.
				 * @param {Ext.DataView} Current {@link Ext.DataView} instance.
				 * @param {Number} index The index of the target node
				 * @param {HTMLElement} node The target node
				 * @param {Ext.EventObject} e The raw event object
				 */
				"extraitemclick",
				/**
				 * @event beforeextraitemclick
				 * Fires before a click is processed. Returns false to cancel the default action.
				 * @param {Ext.DataView} this
				 * @param {Number} index The index of the target node
				 * @param {HTMLElement} node The target node
				 * @param {Ext.EventObject} e The raw event object
				 */
				"beforeextraitemclick"
			);
		},

		/*
		 * Override to fire {@link #extraitemclick} event while click is performed
		 * on {@link Zarafa.common.ui.BoxField#extraItemSelector extraItemSelector} element.
		 * @param {Ext.EventObject} e The event object
		 * @private
		 * @override
		 */
		onClick : function(e)
		{
			var extraItem = false;
			var index;

			if (this.extraItemSelector) {
				extraItem = e.getTarget(this.extraItemSelector, this.getTemplateTarget());
			}

			if (extraItem){
				index = this.indexOf(extraItem);
				if (this.onExtraItemClick(extraItem, index, e) !== false) {
					this.fireEvent("extraitemclick", this, index, extraItem, e);
				}
			} else {
				orig_onClick.apply(this, arguments);
			}
		},

		/*
		 * Fires {@link #beforeextraitemclick} event for
		 * {@link Zarafa.common.ui.BoxField#extraItemSelector extraItemSelector} element.
		 * @param {HTMLElement} node The target node
		 * @param {Number} index The index of the target node
		 * @param {Ext.EventObject} e The event object
		 * @return {Boolean} True if action is a success, false to cancel the default action.
		 * @private
		 * @override
		 */
		onExtraItemClick : function(item, index, e)
		{
			if(this.fireEvent("beforeextraitemclick", this, index, item, e) === false){
				return false;
			}

			return true;
		}
	});
})();
