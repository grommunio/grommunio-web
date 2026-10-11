/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui.htmleditor');

/**
 * @class Grommunio.common.ui.htmleditor.LanguageMap
 * Singleton used to get the correct language file for TinyMCE
 * @singleton
 */
Grommunio.common.ui.htmleditor.LanguageMap = {
	fileMapping: {
		ar_DZ: 'ar',
		ar_SA: 'ar-SA',
		az_AZ: 'az',
		be_BY: 'be',
		bg_BG: 'bg-BG',
		bn_BD: 'bn-BD',
		bs_BA: 'bs',
		ca_ES: 'ca',
		'ca_ES@valencia': 'ca',
		cs_CZ: 'cs',
		cy_GB: 'cy',
		da_DK: 'da',
		de_DE: 'de',
		de_CH: 'de',
		el_GR: 'el',
		en_GB: '', // Special case, as this is the default language of tinymce
		en_US: '', // Special case, as this is the default language of tinymce
		es_ES: 'es',
		et_EE: 'et',
		eu_ES: 'eu',
		fa_IR: 'fa',
		fi_FI: 'fi',
		fr_CA: 'fr-FR',
		fr_FR: 'fr-FR',
		gl_ES: 'gl',
		he_IL: 'he-IL',
		hr_HR: 'hr',
		hu_HU: 'hu-HU',
		hy_AM: 'hy',
		id_ID: 'id',
		is_IS: 'is-IS',
		it_IT: 'it',
		ja_JP: 'ja',
		ka_GE: 'ka-GE',
		kk_KZ: 'kk',
		ko_KR: 'ko-KR',
		lt_LT: 'lt',
		lv_LV: 'lv',
		nb_NO: 'nb-NO',
		ne_NP: 'ne',
		nl_NL: 'nl',
		pl_PL: 'pl',
		pt_BR: 'pt-BR',
		pt_PT: 'pt-PT',
		ro_RO: 'ro',
		ru_RU: 'ru',
		sk_SK: 'sk',
		sl_SI: 'sl-SI',
		'sr_RS@latin': 'sr',
		sv_SE: 'sv-SE',
		ta_IN: 'ta',
		th_TH: 'th-TH',
		tr_TR: 'tr',
		ug_CN: 'ug',
		uk_UA: 'uk',
		vi_VN: 'vi',
		zh_CN: 'zh-CN',
		zh_TW: 'zh-TW'
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
