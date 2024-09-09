Ext.namespace('Zarafa.common.ui.htmleditor');

/**
 * @class Zarafa.common.ui.htmleditor.LanguageMap
 * Singleton used to get the correct language file for TinyMCE
 * @singleton
 */
Zarafa.common.ui.htmleditor.LanguageMap = {
	fileMapping: {
		ar_DZ: 'ar',
		ar_SA: 'ar_SA',
		bg_BG: 'bg_BG',
		ca_ES: 'ca',
		cs_CZ: 'cs',
		da_DK: 'da',
		de_DE: 'de',
		de_CH: 'de',
		el_GR: 'el',
		en_GB: '', // Special case, as this is the default language of tinymce
		en_US: '', // Special case, as this is the default language of tinymce
		es_ES: 'es',
		et_EE: 'et',
		fa_IR: 'fa',
		fi_FI: 'fi',
		fr_FR: 'fr_FR',
		he_IL: 'he_IL',
		hr_HR: 'hr',
		hu_HU: 'hu_HU',
		is_IS: 'is_IS',
		it_IT: 'it',
		ja_JP: 'ja',
		ko_KR: 'ko_KR',
		lt_LT: 'lt',
		nb_NO: 'nb_NO',
		nl_NL: 'nl',
		pl_PL: 'pl',
		pt_BR: 'pt_BR',
		pt_PT: 'pt_PT',
		ru_RU: 'ru',
		sl_SL: 'sl_SI',
		sv_SE: 'sv_SE',
		tr_TR: 'tr',
		uk_UA: 'uk',
		zh_CN: 'zh_CN',
		zh_TW: 'zh_TW'
	},

	/**
	 * Converts the official language code to the language code that tinymce
	 * uses for their editor.
	 * @param {String} webappLanguageCode The official language code that grommunio Web uses
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
		return 'en_US';
	}
};
