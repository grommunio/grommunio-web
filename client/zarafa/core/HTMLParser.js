Ext.namespace("Zarafa.core");

/**
 * @class Zarafa.core.HTMLParser
 *
 * Class for performing operations on HTML content.
 *
 * @singleton
 */
Zarafa.core.HTMLParser = (function() {
	// regular expression to strip all style tags with its content
	var stripStylesRe = /<style[^>]*>[\s\S]*?<\/style[^>]*>/gim;

	// regular expression to strip all style tags with its content
	var stripScriptsRe = /<script[^>]*>[\s\S]*?<\/script[^>]*>/gim;

	// regular expression to convert <br /> tags to newlines
	var br2nlRe = /<br\s*?\/*?>/gim;

	// regular expression to convert \r\n, \n or \r tags to <br />
	var nl2brRe = /\r\n|\n|\r/gim;

	// regular expression to convert outlook style inline image urls to url which can request image using download_attachment.php
	var cidToUrlRe = /(src\s*=\s*[\"\']?)cid:([^ \"\']*)([\"\']?)/igm;

	// regular expression to convert url for inline images to outlook style url
	var urlToCidRe = /(src\s*=\s*[\"\']?)\S*attachCid=([^ &\"\']*)[^ \"\']*([\"\']?)/igm;

	return {
		/**
		 * Strips all style tags, and also remove its contents
		 * @param {Mixed} value The text from which to strip style tags
		 * @return {String} The stripped text
		 */
		stripStyles : function(v)
		{
			return !v ? v : String(v).replace(stripStylesRe, '');
		},

		/**
		 * Strips all script tags, and also remove its contents
		 * @param {Mixed} value The text from which to strip script tags
		 * @return {String} The stripped text
		 */
		stripScripts : function(v)
		{
			return !v ? v : String(v).replace(stripScriptsRe, '');
		},

		/**
		 * Converts HTML tag <br /> to newline characters
		 * @param {String} The string value to format.
		 * @return {String} The string with embedded \n tags in place of <br />.
		 */
		br2nl : function(v)
		{
			return Ext.isEmpty(v) ? '' : v.replace(br2nlRe, '\n');
		},

		/**
		 * Converts newline characters to HTML tag <br />
		 * @param {String} The string value to format.
		 * @return {String} The string with embedded <br /> tags in place of \n.
		 */
		nl2br : function(v)
		{
			return Ext.isEmpty(v) ? '' : v.replace(nl2brRe, '<br>');
		},

		/**
		 * Format string with plain-text contents into a HTML formatted string.
		 *
		 * This will convert new-line characters into <br /> elements.
		 *
		 * @param {String} content The plain-text contents to be formatted
		 * @return {String} The HTML representation of the content
		 */
		convertPlainToHTML : function(content)
		{
			if(Ext.isEmpty(content)) {
				return content;
			}

			// convert all html entities to their html equivalents
			content = Zarafa.core.HTMLParser.entityEncode(content, 'ENT_NOQUOTES');

			// We should wrap the content in <pre> tag to maintain
			// text indentation/spacing when we convert it to HTML.
			content = '<div><pre wrap style=\"white-space: pre-wrap; word-wrap: break-word;\">' + content + '</pre></div>';

			// simple text markup *bold* and _underlined_ text
			content = content.replace(XRegExp("(?<prefix>^|[^\\p{L}])(?<word>\\*+[\\p{L},\ ,\t,0-9]+\\*+)(?<postfix>[^\\p{L}]|$)", "gi"), function(match) {
				return match.prefix + '<strong>' + match.word + '</strong>' + match.postfix;
			});

			content = content.replace(XRegExp("(?<prefix>^|[^\\p{L}])(?<word>_+[\\p{L},\ ,\t,0-9]+_+)(?<postfix>[^\\p{L}]|$)", "gi"), function(match) {
				return match.prefix + '<span style="text-decoration: underline">' + match.word + '</span>' + match.postfix;
			});

			// convert all breaklines
			content = Zarafa.core.HTMLParser.nl2br(content);

			return content;
		},

		/**
		 * Format string with HTML contents into a plain-text string.
		 *
		 * This will convert <br /> characters into \n elements.
		 *
		 * @param {String} content The HTML contents to be formatted
		 * @return {String} The plain-text representation of the content
		 */
		convertHTMLToPlain : function(content)
		{
			if(Ext.isEmpty(content)) {
				return content;
			}

			//----- remove tags but preserve the content ----

			// remove all select / options tags
			content = content.replace( /<[\/]?(?:select)[^>]*>/gim, '\n');
			content = content.replace(/<[\/]?(?:option)[^>]*>/gim, '\t');

			// replace all tags with their text equivalents
			content = content.replace(/<(?:hr)[^>]*>/gim, '\n-----------\n');
			content = content.replace(/<[\/]?(?:h[123456]|div|p|pre|title)[^>]*>/gim, '\n\n');
			content = content.replace(/<[\/]?(?:ul|ol|dl|dt|textarea|img)[^>]*>/gim, '\n');
			content = content.replace(/<[\/]?(?:dd|li)[^>]*>/gim, '\t');

			// tags related to table
			content = content.replace(/<[\/]?(?:table)[^>]*>/gim, '\n\n');
			content = content.replace(/<[\/]?(?:caption|tr)[^>]*>/gim, '\n');
			content = content.replace(/<[^\/]?(?:th|td)[^>]*>/gim, '<br />');

			// remove anchor tag by preserving the links, links will be added after content of anchor tag in between <> signs
			content = content.replace(/<a[^>]* href=[\'\"]?([^\s\'\">]*)[^>]*>([\s\S]*?)<\/a[^>]*>/gim, '$2 &lt;$1&gt;');

			//------ remove tags without preserving the contents -----

			// remove style tags
			content = Zarafa.core.HTMLParser.stripStyles(content);

			// remove script tags
			content = Zarafa.core.HTMLParser.stripScripts(content);

			// remove comments
			content = content.replace(/<!--[\s\S]*?-->/gim, '');

			// we have processed tags which are usefull for plain text conversion so now remove all remaining tags
			content = Zarafa.core.HTMLParser.stripUnwantedTags(content, ['br']);

			// decode html entities
			content = Zarafa.core.HTMLParser.entityDecode(content);

			// remove unnecessary space
			content = content.replace(/^\s*$/gm, '');

			// add <br> in line which hasn't <br> at end of line
			content = content.replace(/(.*[^<>\n]$)/gm, '$1<br />');

			// remove extra line breaks
			content = content.replace(/\n/gm, '');

			// convert all breaklines
			content = Zarafa.core.HTMLParser.br2nl(content);

			// remove remaining html entities
			content = content.replace(/[&][#0-9a-z]*[;]/gim, '');

			// remove breaklines from the end of the lines
			content = content.replace(/\n(?!\n)$/gm, '');

			return content;
		},

		/**
		 * Function which strips unwanted tags, This function is whitelisting based so you need
		 * to pass tags that are allowed in the text, all other tags will be removed. This function will
		 * only remove tags and will not remove content in between tags.
		 * @param {String} content html content
		 * @param {Array} allowedTags tags that should not be removed from the content.
		 * @return {String} content after removing unwanted tags.
		 */
		stripUnwantedTags : function (content, allowedTags)
		{
			// Match all HTML tags
			var matches = content.match(/(<\/?[^>]+>)/gi);

			var html = '';
			var allowedTag = '';
			var i = -1;
			var allowed = false;

			if(!allowedTags) {
				allowedTags = [];
			}

			// Go through all HTML tags
			if(matches && matches.length > 0) {
				for(var index1 = 0, len1 = matches.length; index1 < len1; index1++) {
					// Save HTML tag
					html = matches[index1].toString();

					// flag to indicate that tag should be removed or not
					allowed = false;

					// Go through all allowed tags
					for(var index2 = 0, len2 = allowedTags.length; index2 < len2; index2++) {
						allowedTag = allowedTags[index2].toLowerCase();
						i = -1;

						if (i !== 0) {
							i = html.toLowerCase().indexOf('<'+allowedTag+'>');
						}

						if (i !== 0) {
							i = html.toLowerCase().indexOf('<'+allowedTag+' ');
						}

						if (i !== 0) {
							i = html.toLowerCase().indexOf('</'+allowedTag);
						}

						// Determine
						if (i === 0) {
							allowed = true;
							break;
						}
					}

					if (allowed !== true) {
						content = content.split(html).join('');		// Custom replace. No regexing
					}
				}
			}

			return content;
		},

		/**
		 * Function will check if data contains external contents in any html tag (img, audio, video),
		 * and will also check for external stylesheets.
		 * @param {String} data data that should be checked for external content.
		 * @return {Boolean} true if data contains external content else false.
		 */
		hasExternalContent : function(data)
		{
			if(Ext.isEmpty(data)) {
				return false;
			}

			// @TODO more work needs for these regular expressions or else a dom based html parser
			// check tags whose attributes are src or background
			if(data.search(/(src|background)\s*=\s*([\'\"])*?\s*(https*:[^ \'\"]*)([\'\"])*/igm) !== -1) {
				return true;
			}

			// check tags whose attributes contains style attribute with external url
			if(data.search(/(style)\s*=(\S*)(url)\(([\'\"]*?)\s*(https*:.*[^\'\"])([\'\"]*?)\)/igm) !== -1) {
				return true;
			}

			return false;
		},

		/**
		 * Function will replace external content links with blank strings, so external content would not be loaded.
		 * @param {String} data raw data.
		 * @return {String} filtered data.
		 */
		blockExternalContent : function(data)
		{
			if(Ext.isEmpty(data)) {
				return data;
			}

			if (!Zarafa.core.HTMLParser.hasExternalContent(data)) {
				return data;
			}

			// @TODO more work needs for these regular expressions or else a dom based html parser
			data = data.replace(/(src|background)\s*=\s*([\'\"])*?\s*(https*:[^ \'\"]*)\s*([\'\"])*/igm, "$1=$2$4");
			data = data.replace(/(style)\s*=(\S*)(url)\(([\'\"]*?)\s*(https*:.*[^\'\"])([\'\"]*?)\)/igm, "$1=$2$3($4$6)");

			return data;
		},

		/**
		 * Function will return translation table for HTML entities which can be used to
		 * encode/decode HTML entities.
		 * @param {String} tableType type of table to get, options are HTML_SPECIALCHARS or HTML_ENTITIES.
		 * @param {String} quoteStyle options are ENT_COMPAT, ENT_NOQUOTES or ENT_QUOTES.
		 * @return {Object} table for translation of HTML entities
		 */
		getHTMLTranslationTable : function(tableType, quoteStyle)
		{
			if(!tableType) {
				tableType = 'HTML_SPECIALCHARS';
			}

			if(!quoteStyle) {
				quoteStyle = 'ENT_COMPAT';
			}

			var entities = {};
			entities['38'] = '&amp;';

			if (tableType === 'HTML_ENTITIES') {
				entities['94'] = '&circ;';
				entities['126'] = '&tilde;';

				entities['130'] = '&sbquo;';	// Single Low-9 Quotation Mark
				entities['131'] = '&fnof;';		// Latin Small Letter F With Hook
				entities['132'] = '&bdquo;';	// Double Low-9 Quotation Mark
				entities['133'] = '&hellip;';	// Horizontal Ellipsis
				entities['134'] = '&dagger;';	// Dagger
				entities['135'] = '&Dagger;';	// Double Dagger
				entities['136'] = '&circ;';		// Modifier Letter Circumflex Accent
				entities['137'] = '&permil;';	// Per Mille Sign
				entities['138'] = '&Scaron;';	// Latin Capital Letter S With Caron
				entities['139'] = '&lsaquo;';	// Single Left-Pointing Angle Quotation Mark
				entities['140'] = '&OElig;';	// Latin Capital Ligature OE
				entities['145'] = '&lsquo;';	// Left Single Quotation Mark
				entities['146'] = '&rsquo;';	// Right Single Quotation Mark
				entities['147'] = '&ldquo;';	// Left Double Quotation Mark
				entities['148'] = '&rdquo;';	// Right Double Quotation Mark
				entities['149'] = '&bull;';		// Bullet
				entities['150'] = '&ndash;';	// En Dash
				entities['151'] = '&mdash;';	// Em Dash
				entities['152'] = '&tilde;';	// Small Tilde
				entities['153'] = '&trade;';	// Trade Mark Sign
				entities['154'] = '&scaron;';	// Latin Small Letter S With Caron
				entities['155'] = '&rsaquo;';	// Single Right-Pointing Angle Quotation Mark
				entities['156'] = '&oelig;';	// Latin Small Ligature OE
				entities['159'] = '&Yuml;';		// Latin Capital Letter Y With Diaeresis

				entities['160'] = '&nbsp;';		// Non-breaking space
				entities['161'] = '&iexcl;';	// Inverted exclamation mark
				entities['162'] = '&cent;';		// Cent sign
				entities['163'] = '&pound;';	// Pound sign
				entities['164'] = '&curren;';	// Currency sign
				entities['165'] = '&yen;';		// Yen sign
				entities['166'] = '&brvbar;';	// Broken vertical bar
				entities['167'] = '&sect;';		// Section sign
				entities['168'] = '&uml;';		// Diaeresis
				entities['169'] = '&copy;';		// Copyright sign
				entities['170'] = '&ordf;';		// Feminine ordinal indicator
				entities['171'] = '&laquo;';	// Left-pointing double angle quotation mark
				entities['172'] = '&not;';		// Not sign
				entities['173'] = '&shy;';		// Soft hyphen
				entities['174'] = '&reg;';		// Registered sign
				entities['175'] = '&macr;';		// Macron
				entities['176'] = '&deg;';		// Degree sign
				entities['177'] = '&plusmn;';	// Plus-minus sign
				entities['178'] = '&sup2;';		// Superscript two
				entities['179'] = '&sup3;';		// Superscript three
				entities['180'] = '&acute;';	// Acute accent
				entities['181'] = '&micro;';	// Micro sign
				entities['182'] = '&para;';		// Pilcrow sign
				entities['183'] = '&middot;';	// Middle dot
				entities['184'] = '&cedil;';	// Cedilla
				entities['185'] = '&sup1;';		// Superscript one
				entities['186'] = '&ordm;';		// Masculine ordinal indicator
				entities['187'] = '&raquo;';	// Right-pointing double angle quotation mark
				entities['188'] = '&frac14;';	// Vulgar fraction one-quarter
				entities['189'] = '&frac12;';	// Vulgar fraction one-half
				entities['190'] = '&frac34;';	// Vulgar fraction three-quarters
				entities['191'] = '&iquest;';	// Inverted question mark
				entities['192'] = '&Agrave;';	// A with grave
				entities['193'] = '&Aacute;';	// A with acute
				entities['194'] = '&Acirc;';	// A with circumflex
				entities['195'] = '&Atilde;';	// A with tilde
				entities['196'] = '&Auml;';		// A with diaeresis
				entities['197'] = '&Aring;';	// A with ring above
				entities['198'] = '&AElig;';	// AE
				entities['199'] = '&Ccedil;';	// C with cedilla
				entities['200'] = '&Egrave;';	// E with grave
				entities['201'] = '&Eacute;';	// E with acute
				entities['202'] = '&Ecirc;';	// E with circumflex
				entities['203'] = '&Euml;';		// E with diaeresis
				entities['204'] = '&Igrave;';	// I with grave
				entities['205'] = '&Iacute;';	// I with acute
				entities['206'] = '&Icirc;';	// I with circumflex
				entities['207'] = '&Iuml;';		// I with diaeresis
				entities['208'] = '&ETH;';		// Eth
				entities['209'] = '&Ntilde;';	// N with tilde
				entities['210'] = '&Ograve;';	// O with grave
				entities['211'] = '&Oacute;';	// O with acute
				entities['212'] = '&Ocirc;';	// O with circumflex
				entities['213'] = '&Otilde;';	// O with tilde
				entities['214'] = '&Ouml;';		// O with diaeresis
				entities['215'] = '&times;';	// Multiplication sign
				entities['216'] = '&Oslash;';	// O with stroke
				entities['217'] = '&Ugrave;';	// U with grave
				entities['218'] = '&Uacute;';	// U with acute
				entities['219'] = '&Ucirc;';	// U with circumflex
				entities['220'] = '&Uuml;';		// U with diaeresis
				entities['221'] = '&Yacute;';	// Y with acute
				entities['222'] = '&THORN;';	// Thorn
				entities['223'] = '&szlig;';	// Sharp s. Also known as ess-zed
				entities['224'] = '&agrave;';	// a with grave
				entities['225'] = '&aacute;';	// a with acute
				entities['226'] = '&acirc;';	// a with circumflex
				entities['227'] = '&atilde;';	// a with tilde
				entities['228'] = '&auml;';		// a with diaeresis
				entities['229'] = '&aring;';	// a with ring above
				entities['230'] = '&aelig;';	// ae. Also known as ligature ae
				entities['231'] = '&ccedil;';	// c with cedilla
				entities['232'] = '&egrave;';	// e with grave
				entities['233'] = '&eacute;';	// e with acute
				entities['234'] = '&ecirc;';	// e with circumflex
				entities['235'] = '&euml;';		// e with diaeresis
				entities['236'] = '&igrave;';	// i with grave
				entities['237'] = '&iacute;';	// i with acute
				entities['238'] = '&icirc;';	// i with circumflex
				entities['239'] = '&iuml;';		// i with diaeresis
				entities['240'] = '&eth;';		// eth
				entities['241'] = '&ntilde;';	// n with tilde
				entities['242'] = '&ograve;';	// o with grave
				entities['243'] = '&oacute;';	// o with acute
				entities['244'] = '&ocirc;';	// o with circumflex
				entities['245'] = '&otilde;';	// o with tilde
				entities['246'] = '&ouml;';		// o with diaeresis
				entities['247'] = '&divide;';	// Division sign
				entities['248'] = '&oslash;';	// o with stroke. Also known as o with slash
				entities['249'] = '&ugrave;';	// u with grave
				entities['250'] = '&uacute;';	// u with acute
				entities['251'] = '&ucirc;';	// u with circumflex
				entities['252'] = '&uuml;';		// u with diaeresis
				entities['253'] = '&yacute;';	// y with acute
				entities['254'] = '&thorn;';	// thorn
				entities['255'] = '&yuml;';		// y with diaeresis
				entities['264'] = '&#264;';		// Latin capital letter C with circumflex
				entities['265'] = '&#265;';		// Latin small letter c with circumflex
				entities['338'] = '&OElig;';	// Latin capital ligature OE
				entities['339'] = '&oelig;';	// Latin small ligature oe
				entities['352'] = '&Scaron;';	// Latin capital letter S with caron
				entities['353'] = '&scaron;';	// Latin small letter s with caron
				entities['372'] = '&#372;';		// Latin capital letter W with circumflex
				entities['373'] = '&#373;';		// Latin small letter w with circumflex
				entities['374'] = '&#374;';		// Latin capital letter Y with circumflex
				entities['375'] = '&#375;';		// Latin small letter y with circumflex
				entities['376'] = '&Yuml;';		// Latin capital letter Y with diaeresis
				entities['402'] = '&fnof;';		// Latin small f with hook, function, florin
				entities['710'] = '&circ;';		// Modifier letter circumflex accent
				entities['732'] = '&tilde;';	// Small tilde
				entities['913'] = '&Alpha;';	// Alpha
				entities['914'] = '&Beta;';		// Beta
				entities['915'] = '&Gamma;';	// Gamma
				entities['916'] = '&Delta;';	// Delta
				entities['917'] = '&Epsilon;';	// Epsilon
				entities['918'] = '&Zeta;';		// Zeta
				entities['919'] = '&Eta;';		// Eta
				entities['920'] = '&Theta;';	// Theta
				entities['921'] = '&Iota;';		// Iota
				entities['922'] = '&Kappa;';	// Kappa
				entities['923'] = '&Lambda;';	// Lambda
				entities['924'] = '&Mu;';		// Mu
				entities['925'] = '&Nu;';		// Nu
				entities['926'] = '&Xi;';		// Xi
				entities['927'] = '&Omicron;';	// Omicron
				entities['928'] = '&Pi;';		// Pi
				entities['929'] = '&Rho;';		// Rho
				entities['931'] = '&Sigma;';	// Sigma
				entities['932'] = '&Tau;';		// Tau
				entities['933'] = '&Upsilon;';	// Upsilon
				entities['934'] = '&Phi;';		// Phi
				entities['935'] = '&Chi;';		// Chi
				entities['936'] = '&Psi;';		// Psi
				entities['937'] = '&Omega;';	// Omega
				entities['945'] = '&alpha;';	// alpha
				entities['946'] = '&beta;';		// beta
				entities['947'] = '&gamma;';	// gamma
				entities['948'] = '&delta;';	// delta
				entities['949'] = '&epsilon;';	// epsilon
				entities['950'] = '&zeta;';		// zeta
				entities['951'] = '&eta;';		// eta
				entities['952'] = '&theta;';	// theta
				entities['953'] = '&iota;';		// iota
				entities['954'] = '&kappa;';	// kappa
				entities['955'] = '&lambda;';	// lambda
				entities['956'] = '&mu;';		// mu
				entities['957'] = '&nu;';		// nu
				entities['958'] = '&xi;';		// xi
				entities['959'] = '&omicron;';	// omicron
				entities['960'] = '&pi;';		// pi
				entities['961'] = '&rho;';		// rho
				entities['962'] = '&sigmaf;';	// sigmaf
				entities['963'] = '&sigma;';	// sigma
				entities['964'] = '&tau;';		// tau
				entities['965'] = '&upsilon;';	// upsilon
				entities['966'] = '&phi;';		// phi
				entities['967'] = '&chi;';		// chi
				entities['968'] = '&psi;';		// psi
				entities['969'] = '&omega;';	// omega
				entities['977'] = '&thetasym;';	// Theta symbol
				entities['978'] = '&upsih;';	// Greek upsilon with hook symbol
				entities['982'] = '&piv;';		// Pi symbol
				entities['8194'] = '&ensp;';	// En space
				entities['8195'] = '&emsp;';	// Em space
				entities['8201'] = '&thinsp;';	// Thin space
				entities['8204'] = '&zwnj;';	// Zero width non-joiner
				entities['8205'] = '&zwj;';		// Zero width joiner
				entities['8206'] = '&lrm;';		// Left-to-right mark
				entities['8207'] = '&rlm;';		// Right-to-left mark
				entities['8211'] = '&ndash;';	// En dash
				entities['8212'] = '&mdash;';	// Em dash
				entities['8216'] = '&lsquo;';	// Left single quotation mark
				entities['8217'] = '&rsquo;';	// Right single quotation mark
				entities['8218'] = '&sbquo;';	// Single low-9 quotation mark
				entities['8220'] = '&ldquo;';	// Left double quotation mark
				entities['8221'] = '&rdquo;';	// Right double quotation mark
				entities['8222'] = '&bdquo;';	// Double low-9 quotation mark
				entities['8224'] = '&dagger;';	// Dagger
				entities['8225'] = '&Dagger;';	// Double dagger
				entities['8226'] = '&bull;';	// Bullet
				entities['8230'] = '&hellip;';	// Horizontal ellipsis
				entities['8240'] = '&permil;';	// Per mille sign
				entities['8242'] = '&prime;';	// Prime
				entities['8243'] = '&Prime;';	// Double Prime
				entities['8249'] = '&lsaquo;';	// Single left-pointing angle quotation
				entities['8250'] = '&rsaquo;';	// Single right-pointing angle quotation
				entities['8254'] = '&oline;';	// Overline
				entities['8260'] = '&frasl;';	// Fraction Slash
				entities['8364'] = '&euro;';	// Euro sign
				entities['8472'] = '&weierp;';	// Script capital
				entities['8465'] = '&image;';	// Blackletter capital I
				entities['8476'] = '&real;';	// Blackletter capital R
				entities['8482'] = '&trade;';	// Trade mark sign
				entities['8501'] = '&alefsym;';	// Alef symbol
				entities['8592'] = '&larr;';	// Leftward arrow
				entities['8593'] = '&uarr;';	// Upward arrow
				entities['8594'] = '&rarr;';	// Rightward arrow
				entities['8595'] = '&darr;';	// Downward arrow
				entities['8596'] = '&harr;';	// Left right arrow
				entities['8629'] = '&crarr;';	// Downward arrow with corner leftward. Also known as carriage return
				entities['8656'] = '&lArr;';	// Leftward double arrow. ISO 10646 does not say that lArr is the same as the 'is implied by' arrow but also does not have any other character for that function. So ? lArr can be used for 'is implied by' as ISOtech suggests
				entities['8657'] = '&uArr;';	// Upward double arrow
				entities['8658'] = '&rArr;';	// Rightward double arrow. ISO 10646 does not say this is the 'implies' character but does not have another character with this function so ? rArr can be used for 'implies' as ISOtech suggests
				entities['8659'] = '&dArr;';	// Downward double arrow
				entities['8660'] = '&hArr;';	// Left-right double arrow

				// Mathematical Operators
				entities['8704'] = '&forall;';	// For all
				entities['8706'] = '&part;';	// Partial differential
				entities['8707'] = '&exist;';	// There exists
				entities['8709'] = '&empty;';	// Empty set. Also known as null set and diameter
				entities['8711'] = '&nabla;';	// Nabla. Also known as backward difference
				entities['8712'] = '&isin;';	// Element of
				entities['8713'] = '&notin;';	// Not an element of
				entities['8715'] = '&ni;';		// Contains as member
				entities['8719'] = '&prod;';	// N-ary product. Also known as product sign. Prod is not the same character as U+03A0 'greek capital letter pi' though the same glyph might be used for both
				entities['8721'] = '&sum;';		// N-ary summation. Sum is not the same character as U+03A3 'greek capital letter sigma' though the same glyph might be used for both
				entities['8722'] = '&minus;';	// Minus sign
				entities['8727'] = '&lowast;';	// Asterisk operator
				entities['8729'] = '&#8729;';	// Bullet operator
				entities['8730'] = '&radic;';	// Square root. Also known as radical sign
				entities['8733'] = '&prop;';	// Proportional to
				entities['8734'] = '&infin;';	// Infinity
				entities['8736'] = '&ang;';		// Angle
				entities['8743'] = '&and;';		// Logical and. Also known as wedge
				entities['8744'] = '&or;';		// Logical or. Also known as vee
				entities['8745'] = '&cap;';		// Intersection. Also known as cap
				entities['8746'] = '&cup;';		// Union. Also known as cup
				entities['8747'] = '&int;';		// Integral
				entities['8756'] = '&there4;';	// Therefore
				entities['8764'] = '&sim;';		// tilde operator. Also known as varies with and similar to. The tilde operator is not the same character as the tilde, U+007E, although the same glyph might be used to represent both
				entities['8773'] = '&cong;';	// Approximately equal to
				entities['8776'] = '&asymp;';	// Almost equal to. Also known as asymptotic to
				entities['8800'] = '&ne;';		// Not equal to
				entities['8801'] = '&equiv;';	// Identical to
				entities['8804'] = '&le;';		// Less-than or equal to
				entities['8805'] = '&ge;';		// Greater-than or equal to
				entities['8834'] = '&sub;';		// Subset of
				entities['8835'] = '&sup;';		// Superset of. Note that nsup, 'not a superset of, U+2283' is not covered by the Symbol font encoding and is not included.
				entities['8836'] = '&nsub;';	// Not a subset of
				entities['8838'] = '&sube;';	// Subset of or equal to
				entities['8839'] = '&supe;';	// Superset of or equal to
				entities['8853'] = '&oplus;';	// Circled plus. Also known as direct sum
				entities['8855'] = '&otimes;';	// Circled times. Also known as vector product
				entities['8869'] = '&perp;';	// Up tack. Also known as orthogonal to and perpendicular
				entities['8901'] = '&sdot;';	// Dot operator. The dot operator is not the same character as U+00B7 middle dot

				// Miscellaneous Technical
				entities['8968'] = '&lceil;';	// Left ceiling. Also known as an APL upstile
				entities['8969'] = '&rceil;';	// Right ceiling
				entities['8970'] = '&lfloor;';	// left floor. Also known as APL downstile
				entities['8971'] = '&rfloor;';	// Right floor
				entities['9001'] = '&lang;';	// Left-pointing angle bracket. Also known as bra. Lang is not the same character as U+003C 'less than'or U+2039 'single left-pointing angle quotation mark'
				entities['9002'] = '&rang;';	// Right-pointing angle bracket. Also known as ket. Rang is not the same character as U+003E 'greater than' or U+203A 'single right-pointing angle quotation mark'

				// Geometric Shapes
				entities['9642'] = '&#9642;';	// Black small square
				entities['9643'] = '&#9643;';	// White small square
				entities['9674'] = '&loz;';		// Lozenge

				// Miscellaneous Symbols
				entities['9702'] = '&#9702;';	// White bullet
				entities['9824'] = '&spades;';	// Black (filled) spade suit
				entities['9827'] = '&clubs;';	// Black (filled) club suit. Also known as shamrock
				entities['9829'] = '&hearts;';	// Black (filled) heart suit. Also known as shamrock
				entities['9830'] = '&diams;';   // Black (filled) diamond suit
			}

			if (quoteStyle !== 'ENT_NOQUOTES') {
				entities['34'] = '&quot;';
			}

			if (quoteStyle === 'ENT_QUOTES') {
				entities['39'] = '&#39;';
			}

			entities['60'] = '&lt;';
			entities['62'] = '&gt;';

			// ascii decimals to real symbols
			var decimal;
			var hashMap = {};
			for (decimal in entities) {
				hashMap[String.fromCharCode(decimal)] = entities[decimal];
			}

			return hashMap;
		},

		/**
		 * Function will decode HTML entities in the string.
		 * @param {String} content string that should be decoded.
		 * @param {String} quoteStyle options are ENT_COMPAT, ENT_NOQUOTES or ENT_QUOTES.
		 * @return {String} decoded string.
		 */
		entityDecode : function(content, quoteStyle)
		{
			var hashMap = Zarafa.core.HTMLParser.getHTMLTranslationTable('HTML_ENTITIES', quoteStyle);
			var symbol = '';
			var entity = '';

			for (symbol in hashMap) {
				entity = hashMap[symbol];
				content = content.split(entity).join(symbol);
			}
			content = content.split('&#039;').join('\'');

			return content;
		},

		/**
		 * Function will encode HTML entities in the string.
		 * @param {String} content string that should be encoded.
		 * @param {String} quoteStyle options are ENT_COMPAT, ENT_NOQUOTES or ENT_QUOTES.
		 * @return {String} decoded string.
		 */
		entityEncode : function(content, quoteStyle)
		{
			var hashMap = Zarafa.core.HTMLParser.getHTMLTranslationTable('HTML_ENTITIES', quoteStyle);
			var symbol = '';
			var entity = '';

			for (symbol in hashMap) {
				entity = hashMap[symbol];
				content = content.split(symbol).join(entity);
			}
			content = content.split('\'').join('&#039;');

			return content;
		},

		/**
		 * Function to convert from Outlook inline attachment format (src="cid:...") to img tag
		 * that will display the image (by querying download_attachment.php)
		 * Builds up the query string for asking the image, using store and record entryid, and content id
		 * @param {String} body The message body to be modified
		 * @param {String} storeEntryId The store entryid
		 * @param {String} entryId The message entryid
		 * @param {Array} attachNum Attachment number of the attachment that should be downloaded.
		 * When accessing embedded messages this array can contain multiple elements indicating
		 * attachment numbers at each level, So value [0, 1] will indicate we want to download
		 * second attachment of first embedded message.
		 * @return {String} the modified HTML body
		 */
		inlineImgOutlookToZarafa : function(body, storeEntryId, entryId, attachNum)
		{
			var cidToUrl = function(match, srcStart, imgCid, srcEnd, offset, str) {
				if(imgCid) {
					var url = container.getBaseURL();
					url = Ext.urlAppend(url, 'load=download_attachment');
					url = Ext.urlAppend(url, 'attachCid=' + imgCid);
					url = Ext.urlAppend(url, 'store=' + storeEntryId);
					url = Ext.urlAppend(url, 'entryid=' + entryId);
					url = Ext.urlAppend(url, 'contentDispositionType=inline');
					if(!Ext.isEmpty(attachNum)) {
						for (var i = 0; i< attachNum.length; i++)
						{
							url = Ext.urlAppend(url, 'attachNum[]=' + attachNum[i]);
						}
					}

					// return our own url for getting inline attachments
					return srcStart + url + srcEnd;
				}

				// return match as it is but in a real world this is not going to happen
				return match;
			};

			// replace cid: with our own url to get inline attachment
			return body.replace(cidToUrlRe, cidToUrl);
		},

		/**
		 * Function to convert from Zarafa inline img format to Outlook format (src="cid:...")
		 * Grabs the cid from the img tag (src="...attachCid=...")
		 * @param {String} body the message body to be modified
		 * @return {String} the modified html body
		 */
		inlineImgZarafaToOutlook : function(body)
		{
			if(!Ext.isDefined(body)){
				return;
			}

			var urlToCid = function(match, srcStart, imgCid, srcEnd, offset, str) {
				if(imgCid) {
					// return img src with just cid: tag
					return srcStart + 'cid:' + imgCid +  srcEnd;
				}

				// return match as it is but in a real world this is not going to happen
				return match;
			};

			// replace our own url with cid:
			return body.replace(urlToCidRe, urlToCid);
		}
	};
})();
