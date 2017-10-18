<?php
	header("Content-Type: text/javascript; charset=utf-8");

	header('Expires: '.gmdate('D, d M Y H:i:s',time() + EXPIRES_TIME).' GMT');
	header('Cache-Control: max-age=' . EXPIRES_TIME . ',must-revalidate');
	
	// Pragma: cache doesn't really exist. But since session_start() automatically
	// outputs a Pragma: no-cache, the only way to override that is to output something else
	// in that header. So that's what we do here. It might as well have read 'Pragma: foo'.
	header('Pragma: cache');
	
	// compress output
	ob_start("ob_gzhandler");

	$translations = $Language->getTranslations();

/**
 * Convert the charset to UTF-8. If it is an array it will loop through all it's
 * items and encodes each item.
 * @param $source String|Array Input string or array with strings
 * @param $charset String Original charset of the source string(s).
 * @return String Source string encoded with the new charset
 */
function changeTranslationCharsetToUTF8($source, $charset){
	if(is_array($source)){
		for($i=0;$i<count($source);$i++){
			$source[$i] = iconv($charset, 'UTF-8//TRANSLIT', $source[$i]);
		}
	}elseif(is_string($source)){
		$source = iconv($charset, 'UTF-8//TRANSLIT', $source);
	}
	return $source;
}
?>
/**
 * Translations class
 * @constructor
 */
Translations = function(){
	this.translations = new Object();
	this.pluralFormFunc = new Object();

	this.setTranslations();
}

/**
 * Function which sets the translations from gettext in the this.translations.
 */
Translations.prototype.setTranslations = function()
{
	// BEGIN TRANSLATIONS
<?php
foreach($translations as $domain => $translation_list){
	$pluralForms = false;
	// Find the translation that contains the charset.
	foreach($translations[$domain] as $key => $translationdomain){
		$charset = 'UTF-8';
		if($translationdomain['msgid'] == ''){
			preg_match('/charset=([a-zA-Z0-9_-]+)/', $translationdomain['msgstr'], $matches);
			if(count($matches) > 0 && isset($matches[1])){
				$charset = strtoupper($matches[1]);
			}
			preg_match('/Plural-Forms: ([^\n]+)/', $translationdomain['msgstr'], $matches);
			if(count($matches) > 0 && isset($matches[1])){
				$pluralForms = $matches[1];
			}
			break;
		}
	}
	if($pluralForms){
?>
	this.setPluralFormFunc('<?php echo $domain ?>', '<?php echo $pluralForms?>');
<?php
	}else{
?>
	this.setPluralFormFunc('<?php echo $domain ?>');
<?php
	}
?>
	this.translations["<?php echo $domain ?>"] = new Object();
<?php
	for($i=0;$i<count($translations[$domain]);$i++){
		$translation = $translations[$domain][$i];
		if($translation['msgid'] == '') continue;

		// Conver the charset to UTF-8 if that is not already the case
		if($charset != 'UTF-8'){
			$translation['msgctxt'] = changeTranslationCharsetToUTF8($translation['msgctxt'], $charset);
			$translation['msgid'] = changeTranslationCharsetToUTF8($translation['msgid'], $charset);
			$translation['msgstr'] = changeTranslationCharsetToUTF8($translation['msgstr'], $charset);
		}

		// Escape the \n slash to prevent the translation file out breaking.
		$msgid = str_replace("\n","\\n", addslashes($translation['msgid']));
		// Prepare the $context to be glued together with the msgid together in JS
		if($translation['msgctxt'] !== false){
			// Escape the \n slash to prevent the translation file out breaking.
			$context = str_replace("\n","\\n", addslashes($translation['msgctxt']));
			// We cannot do it in PHP as this will cause an issue with the backslash
			$context = '"'.$context.'\004"+';
		}else{
			$context = '';
		}

		// If the translation is in plural form we have to set it as an array
		if($translation['msgid_plural'] === false){
			// Escape the \n slash to prevent the translation file out breaking.
			$msgstr = str_replace("\n","\\n", addslashes($translation['msgstr']));
?>
	this.translations["<?php echo $domain ?>"][<?php echo $context ?>"<?php echo $msgid ?>"] = "<?php echo $msgstr ?>";
<?php
		}else{
?>
	this.translations["<?php echo $domain?>"][<?php echo $context?>"<?php echo $msgid?>"] = new Array();
<?php
			for($j=0;$j<count($translation['msgstr']);$j++){
				// Escape the \n slash to prevent the translation file out breaking.
				$msgstr = str_replace("\n","\\n", addslashes($translation['msgstr'][$j]));
?>
	this.translations["<?php echo$domain?>"][<?php echo $context?>"<?php echo $msgid?>"][<?php echo $j?>] = "<?php echo $msgstr?>";
<?php
			}
		}
	}
}
?>
}

/**
 * Function which sets the plural forms function in this.pluralFormFunc. This 
 * function is used to get the correct translations from the available plural
 * forms by supplying the count. Each translations file (read: domain) can have 
 * it's own plural function.
 * @param domain {string} The Domain the plural forms string belongs to
 * @param pluralForm {string} Optional The plural forms string from the translations file.
 */
Translations.prototype.setPluralFormFunc = function(domain, pluralForm)
{
	if(typeof(pluralForm) != 'undefined' && typeof(this.pluralFormFunc[domain]) == 'undefined') { 
		// untaint data 
		var plural_forms = pluralForm; 
		var pf_re = new RegExp('^(\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;a-zA-Z0-9_\(\)])+)', 'm'); 
		if (pf_re.test(plural_forms)) { 
			//ex english: "Plural-Forms: nplurals=2; plural=(n != 1);\n" 
			//pf = "nplurals=2; plural=(n != 1);"; 
			//ex russian: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10< =4 && (n%100<10 or n%100>=20) ? 1 : 2) 
			//pf = "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)"; 

			var pf = pluralForm; 
			if (! /;\s*$/.test(pf)) pf = pf.concat(';'); 
			/* We used to use eval, but it seems IE has issues with it. 
			 * We now use "new Function", though it carries a slightly 
			 * bigger performance hit. 
			var code = 'function (n) { var plural; var nplurals; '+pf+' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) }; };'; 
			pluralFormFunc = eval("("+code+")"); 
			*/ 
			var code = 'var plural; var nplurals; '+pf+' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) };'; 
			this.pluralFormFunc[domain] = new Function("n", code); 
		}
	}

	// default to english plural form 
	if (typeof(this.pluralFormFunc[domain]) == 'undefined') { 
		this.pluralFormFunc[domain] = function (n) { 
			var p = (n != 1) ? 1 : 0; 
			return { 'nplural' : 2, 'plural' : p }; 
			}; 
	} // else, plural_func already created 
}

/**
 * Get the translation.
 * @param domain {string} The Domain
 * @param msgctxt {string} The Context
 * @param msgid {string} The message
 * @param msgid_plural {string} The plural text
 * @param count {Number} The count
 * @return {string} The translation
 */
Translations.prototype.getTranslation = function(domain, msgctxt, msgid, msgid_plural, n)
{
		var translation, msgidcontext;
		if(typeof msgid == "undefined") return '';
		if(typeof domain != "string") domain = "zarafa_webapp";

		var plural = (typeof msgid_plural == "string");

		// Glue context to msgid
		if(typeof msgctxt == "string"){
			msgidcontext = msgctxt + "\004" + msgid;
		}else{
			msgidcontext = msgid;
		}

		// Make the translation fallback on the input string (English)
		var trans = [msgid, msgid_plural];

		// Find the translation
		if(typeof this.translations[domain] == "object"){
			if(typeof this.translations[domain][msgidcontext] != "undefined"){
				trans = this.translations[domain][msgidcontext];
			}
		}

		// Check if it is a string or an array first
		translation = (typeof trans == "string") ? trans : trans[0];
		if(plural && typeof this.pluralFormFunc[domain] == "function"){
			var index;
			// Get the plural index based on the Plural-Forms function.
			var obj = this.pluralFormFunc[domain](n);
			if(!obj.plural) obj.plural = 0;
			if(!obj.nplural) obj.nplural = 0;
			if(obj.nplural <= obj.plural) obj.plural = 0;
			index = obj.plural;

			if(trans[index])
				translation = trans[index];
		}

		return translation;
}
// Instantiate the Translations, effectively making it a singleton
var Translations = new Translations();

/**
 * Function which returns a translation from gettext.
 * @param string key english text
 * @param string domain optional gettext domain
 * @return string translated text
 */
function _(key, domain)
{
	return Translations.getTranslation(domain, undefined, key);
}

/**
 * Gettext function.
 * @param domain {string} The Domain
 * @param msgid {string} The message
 * @return {string} The translation
 */
function dgettext(domain, msgid)
{
	var msgctxt, msgid_plural, n;
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, n);
}

// ngettext, plural
/**
 * Gettext function.
 * @param msgid {string} The message
 * @param msgid_plural {string} The plural text
 * @param count {Number} The count
 * @return {string} The translation
 */
function ngettext(msgid, msgid_plural, count)
{
	var domain, msgctxt;
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, count);
}
/**
 * Gettext function.
 * @param domain {string} The Domain
 * @param msgid {string} The message
 * @param msgid_plural {string} The plural text
 * @param count {Number} The count
 * @return {string} The translation
 */
function dngettext(domain, msgid, msgid_plural, count)
{
	var msgctxt;
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, count);
}

// pgettext, context
/**
 * Gettext function.
 * @param msgctxt {string} The Context
 * @param msgid {string} The message
 * @return {string} The translation
 */
function pgettext(msgctxt, msgid)
{
	var domain, msgid_plural, count;
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, count);
}
/**
 * Gettext function.
 * @param domain {string} The Domain
 * @param msgctxt {string} The Context
 * @param msgid {string} The message
 * @return {string} The translation
 */
function dpgettext(domain, msgctxt, msgid)
{
	var msgid_plural, count;
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, count);
}

// npgettext, plural and context
/**
 * Gettext function.
 * @param msgctxt {string} The Context
 * @param msgid {string} The message
 * @param msgid_plural {string} The plural text
 * @param count {Number} The count
 * @return {string} The translation
 */
function npgettext(msgctxt, msgid, msgid_plural, count)
{
	var domain;
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, count);
}
/**
 * Gettext function.
 * @param domain {string} The Domain
 * @param msgctxt {string} The Context
 * @param msgid {string} The message
 * @param msgid_plural {string} The plural text
 * @param count {Number} The count
 * @return {string} The translation
 */
function dnpgettext(domain, msgctxt, msgid, msgid_plural, count)
{
	return Translations.getTranslation(domain, msgctxt, msgid, msgid_plural, count);
}
