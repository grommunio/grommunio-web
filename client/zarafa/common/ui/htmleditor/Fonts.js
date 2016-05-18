Ext.namespace('Zarafa.common.ui.htmleditor');

/**
 * @class Zarafa.common.ui.htmleditor.Fonts
 * Singleton holding a list of available fonts for TinyMCE
 * @singleton
 */
Zarafa.common.ui.htmleditor.Fonts = function(){
	return {
		/**
		 * @return {Object} object with fonts, key is the setting in 'zarafa/v1/mail/default_font_size'
		 * and the value returns the font-size
		 */
		getFonts : function()
		{
			return {
				1: 8,
				2: 10,
				3: 12,
				4: 14,
				5: 18,
				6: 24,
				7: 36
			};
		},

		/**
		 * @return {String} string with font families
		 */
		getFontFamilies : function()
		{
			var fontFamilies = "Arial=arial,helvetica,sans-serif;" +
				"Courier New=courier new,courier;" +
				"Tahoma=tahoma,arial,helvetica,sans-serif;" +
				"Times New Roman=times new roman,times;" +
				"Verdana=verdana,geneva";

			return fontFamilies;
		},

		/**
		 * Returns the default font-size which the user has selected in compose mail settings
		 * @return {String} returns the default user font
		 */
		getDefaultFontSize : function()
		{
			var fonts = this.getFonts();
			var defaultFontSize = container.getSettingsModel().get('zarafa/v1/main/default_font_size');
			return fonts[defaultFontSize] + 'pt';
		}
	};
}();
