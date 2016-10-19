Ext.namespace('Zarafa.common.ui.htmleditor');

/**
 * @class Zarafa.common.ui.htmleditor.LanguageMap
 * Singleton used to get the correct language file for TinyMCE
 * @singleton
 */
Zarafa.common.ui.htmleditor.LanguageMap = {
	fileMapping : {
		bg_BG: 'bg_BG',
		cs_CZ: 'cs_CZ',
		da_DK: 'da',
		de_DE: 'de',
		el_GR: 'el',
		en_GB: 'en_GB',
		en_US: '', // Special case, as this is the default language of tinymce
		es_CA: 'ca',
		et_EE: 'et',
		fa_IR: 'fa_IR',
		fi_FI: 'fi',
		fr_FR: 'fr_FR',
		he_IL: 'he_IL',
		hr_HR: 'hr',
		hu_HU: 'hu_HU',
		it_IT: 'it',
		ja_JP: 'ja',
		ko_KR: 'ko_KR',
		lt_LT: 'lt',
		nb_NO: 'nb_NO',
		nl_NL: 'nl',
		pl_PL: 'pl',
		pt_BR: 'pt_BR',
		pt_PT: 'pt_PT',
		ru_RU: 'ru_RU',
		sl_SL: 'sl_SL',
		sv_SE: 'sv_SE',
		tr_TR: 'tr_TR',
		uk_UA: 'uk_UA',
		zh_CN: 'zh_CN',
		zh_TW: 'zh_TW'
	},

	/**
	 * Converts the official language code to the language code that tinymce
	 * uses for their editor.
	 * @param {String} webappLanguageCode The official language code that WebApp uses
	 * @return {String} the language code that tinymce uses
	 */
	getTinyLanguageCode: function(webappLanguageCode){
		// Strip '.UTF-8' from the end if there
		if ( webappLanguageCode.indexOf('.UTF-8') >= 0 ){
			webappLanguageCode = webappLanguageCode.replace('.UTF-8', '');
		}

		if ( this.fileMapping[webappLanguageCode] ){
			return this.fileMapping[webappLanguageCode];
		}

		// By default use en_GB
		return 'en_GB';
	}
};