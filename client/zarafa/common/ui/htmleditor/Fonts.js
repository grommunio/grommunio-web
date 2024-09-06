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
		getFonts: function()
		{
			// NOTE: Someone thought it would be a good idea to store a key of the
			// following object as the default font in the settings. This great
			// idea has the consequence that we cannot 'rename' the keys of the
			// object, hence the 'strange' 1.1 and 2.1 keys that were added later.
			// The keys can now be ordered alphabetically to get the correct order.
			return {
				1: 8,
				'1.1': 9,
				2: 10,
				'2.1': 11,
				3: 12,
				4: 14,
				5: 18,
				6: 24,
				7: 36
			};
		},

		/**
		 * Returns a space separated string of font sizes that can be used with
		 * the html editor.
		 * @return {String} a space separated string of font sizes
		 */
		getFontSizeString: function()
		{
			var fontSizes = this.getFonts();

			// We must order the fontSizes alphabetically.
			// Read the comment in #getFonts for more information.
			var keys = Object.keys(fontSizes).sort();
			var fontSizeString = '';
			Ext.each(keys, function(key){
				fontSizeString += fontSizes[key] + 'pt ';
			});

			return fontSizeString.trim();
		},

		/**
		 * @return {String} string with font families
		 */
		getFontFamilies: function()
		{
			var fontFamilies = "Andale Mono=andale mono,monospace;" +
				"Arial=arial,helvetica,sans-serif;" +
				"Arial Black=arial black,sans-serif;" +
				"Book Antiqua=book antiqua,palatino,serif;" +
				"Comic Sans MS=comic sans ms,sans-serif;" +
				"Courier New=courier new,courier,monospace;" +
				"Fira Mono=fira mono,monospace;" +
				"Georgia=georgia,palatino,serif;" +
				"Helvetica=helvetica,arial,sans-serif;" +
				"Impact=impact,sans-serif;" +
				"Symbol=symbol;" +
				"Tahoma=tahoma,arial,helvetica,sans-serif;" +
				"Terminal=terminal,monaco,monospace;" +
				"Times New Roman=times new roman,times,serif;" +
				"Trebuchet MS=trebuchet ms,geneva,sans-serif;" +
				"Verdana=verdana,geneva,sans-serif;" +
				"Webdings=webdings;" +
				"Wingdings=wingdings,zapf dingbats";

			return fontFamilies;
		},

		/**
		 * Returns the default font-size which the user has selected in compose mail settings
		 * @return {String} returns the default user font
		 */
		getDefaultFontSize: function()
		{
			var fonts = this.getFonts();
			var defaultFontSize = container.getSettingsModel().get('zarafa/v1/main/default_font_size');
			return fonts[defaultFontSize] + 'pt';
		}
	};
}();
