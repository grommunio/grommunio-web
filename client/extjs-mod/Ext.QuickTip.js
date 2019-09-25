(function() {
	var orig_register = Ext.QuickTip.prototype.register;
	var orig_getTipCfg = Ext.QuickTip.prototype.getTipCfg;

	/**
	 * @class Ext.QuickTip
	 * This will encode the content of tooltip to prevent the HTML injection.
	 * @singleton
	 */
	Ext.override(Ext.QuickTip, {
		/**
		 * Here it will encode title and text of tooltip when component is initialized time.
		 * It is used to prevent HTML Injection.
		 * 
		 * @param {Object} config Configuration object
		 */
		register : function(config)
		{
			config.title = Ext.util.Format.htmlEncode(config.title);
			config.text = Ext.util.Format.htmlEncode(config.text);
			orig_register.apply(this, arguments);
		},

		/**
		 * Here it will encode tooltip's text when hover the cursor on component.
		 * It is used to prevent HTML Injection.
		 * 
		 * @param {Ext.EventObject} e The mouse event object
		 * @return {String} The encoded text of tooltip.
		 */
		getTipCfg: function(e)
		{
			return Ext.util.Format.htmlEncode(orig_getTipCfg.apply(this, arguments));
		}
	});
})();