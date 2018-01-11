<?php
require_once('classes/KopanoTest.php');

/**
 * Filter test
 *
 * Tests on the result of the HTML filter safeHTML in the Filter object
 */
class FilterTest extends KopanoTest {

	/**
	 * The reference to the Filter object
	 */
	private $filter;

	/**
	 * The HTML that is used to test the basic operations
	 */
	private $basicHTML = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
	<html>
		<head>
			<title>Some title</title>
			<base target="newwindow"/>
			<style type="text/css">testCSSStyle { font-family: Arial; }</style>
		</head>
		<body>
			<div id="testsafehtml1">TEST</div>
			<div id="testsafehtml2">Smaller than sign <</div>
			<div id="testsafehtml3"><a href="mailto:john@doe.com">MAILLINK</a></div>
		</body>
	</html>';

	/**
	 * The HTML that is used to check whether correct information stays in
	 */
	private $correctHTML = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
	<html>
		<head>
			<style>
			<!--
				/* Font Definitions */
				@font-face {font-family:"Cambria Math"}
			-->
			</style>
			<title>Some title</title>
		</head>
		<body>
			<div id="testsafehtml1"><p>CONTENT<style>testCSSStyle { font-family: Arial; }</style></p></div>
		</body>
	</html>';

	/**
	 * During setup we initialize the Filter object
	 */
	protected function setUp()
	{
		parent::setUp();
		$this->filter = new filter();
	}

	/**
	 * Test the basic operations of the safeHTML function.
	 */
	public function testBasicSafeHTML()
	{
		$result = $this->filter->safeHTML($this->basicHTML);

		$this->assertNotFalse(stripos($result, '<div id="testsafehtml2">Smaller than sign &lt;</div>'), 'Test that it converts < symbols');

		$this->assertFalse(stripos($result, '<base target="newwindow"/>'), 'Test that the custom BASE-target is removed ');
		$this->assertNotFalse(stripos($result, '<base target="_blank" title="This external link will open in a new window" rel="noreferrer noopener" />'), 'Test that the default _blank BASE-target is added');

		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result, '<style type="text/css">testCSSStyle { font-family: Arial; }</style>'), 'Test that the custom STYLE-tag is preserved');

		// Only when the HTMLBODY filter is enabled then tags like HTML, HEAD and BODY are filtered out
		if(!DISABLE_HTMLBODY_FILTER){
			$this->assertFalse(stripos($result, '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'), 'Test that the DOCTYPE is removed');

			$this->assertFalse(stripos($result, '<html>'), 'Test that the HTML-tag is removed');
			$this->assertFalse(stripos($result, '</html>'), 'Test that the closing HTML-tag is removed');

			$this->assertFalse(stripos($result, '<head>'), 'Test that the HEAD-tag is removed');
			$this->assertFalse(stripos($result, '</head>'), 'Test that the closing HEAD-tag is removed');

			$this->assertFalse(stripos($result, '<body>'), 'Test that the BODY-tag is removed');
			$this->assertFalse(stripos($result, '</body>'), 'Test that the closing BODY-tag is removed');

			$this->assertFalse(stripos($result, '<title>Some title</title>'), 'Test that the TITLE-tag is removed');
		}
	}

	/**
	 * Test that the safeHTML function does not filter out information that should remain in the HTML.
	 */
	public function testSafeHTMLNotFilteringOutCorrectInformation()
	{
		$result = $this->filter->safeHTML($this->correctHTML);

		// When you have an STYLE-tag with a text node as sibbling, like the following string...
		// <p>CONTENT<style></style></p>
		// ...it would remove the "CONTENT" text node. This test check whether that does not happen.
		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result, '<div id="testsafehtml1"><p>CONTENT<style>testCSSStyle { font-family: Arial; }</style></p></div>'), 'Test that the filter does not remove a text nodes that is a sibbling of a nested STYLE-tag');

		// When you have html comment in style node then should not be considered as comment
		// and should not be removed from style tag
		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result, '@font-face {font-family:"Cambria Math"}'), 'Test that the filter does not remove a html comment node that is added in style node');
	}

	/**
	 * Test different Cross-Side Scripting (XSS) bugs which can hang html filter.
	 */
	public function testXSSFilterHang()
	{
		$xssString = '<img src="http://www.e-office.com/eog/emailing2b.nsf/processagent?Openagent&action=openemail&mailingkey=NT0009119A&#8834;=AA11E" />';

		$result = $this->filter->safeHTML($xssString);

		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result, $xssString), 'Test that the XSS filter doesn\'t hang');
	}

	/**
	 * Test that base tag is moved to the first line of content
	 * This is needed because IE discards base tag if it is not in first line
	 */
	public function testXSSFilterBasePromoteToTop()
	{
		$xssString = '<div id="testsafehtml"><base href="kopano.local"></div>';

		$result = $this->filter->safeHTML($xssString);

		// stripos returns the index of the found string.
		$this->assertEquals(0, stripos($result, '<base href="kopano.local" target="_blank" title="This external link will open in a new window" />'), 'Test that the XSS filter promotes base tag to first line');
	}

	/**
	 * Test different Cross-Side Scripting (XSS) exploits.
	 * @dataProvider providerXSStest
	 */
	public function testXSSSafeHTML($xssString, $replacedString)
	{
		$result = $this->filter->safeHTML($xssString);

		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result, $replacedString), 'Test that the XSS string is filtered out ');
	}

	/**
	 * Test that the Event handler are removed correctly to prevent XSS.
	 * @dataProvider providerEventHandlerXSStest
	 */
	public function testEventHandlerXSSSafeHTML($xssString, $replacedString)
	{
		$result = $this->filter->safeHTML($xssString);

		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result, $replacedString), 'Test that the Event handler is filtered out ');
	}

	/**
	 * Test that an <area> element with a href opens in a new window
	 */
	public function testMapAreaHref()
	{
		$html = '<map><area href="http://john.doe"/></map>';
		$result = $this->filter->safeHTML($html);

		// stripos returns the index of the found string. This could also be 0.
		// Therefore we need a check it matches false explicitly.
		$this->assertNotFalse(stripos($result,'<map><area href="http://john.doe" target="_blank" title="This external link will open in a new window" rel="noreferrer noopener" /></map>'), 'Test that the href in an area elements are opened in new tab');
	}

	/**
	 * Tests edge cases for the sq_skipspace function
	 *
	 * This weird piece of HTML makes the HTML Filter hang in sq_skipspace
	 */
	public function testSkipSpace()
	{
		$html = '<td
			style="padding: 5px 12px; background-color: #FFFFFF; height: 100px;
margin-right: 2px; width: 160px; overflow: hidden; vertical-align:
top;padding-right: 0px;">
                                                                  <img
src="/foo/alt.jpg"
                                                                      
                                                                      
                    alt="This is my alt/>
';
		$result = $this->filter->safeHTML($html);
		$this->assertNotTrue(empty($result), 'Test that the filter does not hang');
	}

	/**********************************************************************************************************/
	/* Data Providers */
	/**********************************************************************************************************/

	/**
	 * Special data provider which delivers 2 arguments for the test cases.
	 * The first argument is an array containing the fields "user_name", "folder_type" and "subfolders" which
	 * indicate how the Shared Store must be opened.
	 * The second argument is an array containing the property names and values which
	 * indicate what the contents of the root folder of the store must be.
	 */
	public function providerXSStest()
	{
		return Array(

			Array(
				'<div id="testsafehtml"><style>*{width:expression( var xss1; if (xss1==undefined) {alert(\'XSS1\');xss1=true} );} </DIV></style></div>',
				'<div id="testsafehtml"><style>*{width:idiocy(varxss1;if(xss1==undefined){alert(\'XSS1\');xss1=true});}</DIV></style></div>'
			),

			Array(
				'<div id="testsafehtml"><div style="{ left:expRessioN( var xss2; if (xss2==undefined)\\{alert(\'XSS2\'); xss2=true\\} ) }"></div></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>'
			),

			Array(
				'<div id="testsafehtml"><div style="{ left:&#x0065;xpression( var xss3; if (xss3==undefined)\\{alert(\'XSS3\'); xss3=true\\} ) }"></div></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>'
			),

			Array(
				'<div id="testsafehtml"><div style="{ left:exp/*  */ression( var xss4; if (xss4==undefined)\\{alert(\'XSS4\'); xss4=true\\} ) }"></div></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>'
			),

			Array(
				'<div id="testsafehtml"><div style="{ left:\0065\0078pression( var xss5; if (xss5==undefined)\\{alert(\'XSS5\'); xss5=true\\} ) }"></div></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>'
			),

			Array(
				'<div id="testsafehtml"><div style="wi\dth: expres\sion( var xss6; if (xss6==undefined)\\{alert(\'XSS6\'); xss6=true\\} )"></div></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>'
			),

			Array(
				'<div id="testsafehtml"><iframe src=\'vbscript:msgbox("XSS7")\'></div>',
				'<div id="testsafehtml"></div>'
			),

			// The following cases come from https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet

			//XSS Locator, not applicable here
			//XSS Locator2, not applicable here

			//No Filter Evasion
			Array(
				'<div id="testsafehtml"><SCRIPT SRC=http://ha.ckers.org/xss.js></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			//Image XSS using the JavaScript directive
			Array(
				'<div id="testsafehtml"><IMG SRC="javascript:alert(\'XSS\');"></div>',
				// The IMG-tag is what the current HTML Filter replaces the XSS-image with
				'<div id="testsafehtml"><img src="" /></div>',
			),
			//No quotes and no semicolon
			Array(
				'<div id="testsafehtml"><IMG SRC=javascript:alert(\'XSS\')></div>',
				// The IMG-tag is what the current HTML Filter replaces the XSS-image with
				'<div id="testsafehtml"><img src="" /></div>',
			),
			//Case insensitive XSS attack vector
			Array(
				'<div id="testsafehtml"><IMG SRC=JaVaScRiPt:alert(\'XSS\')></div>',
				// The IMG-tag is what the current HTML Filter replaces the XSS-image with
				'<div id="testsafehtml"><img src="" /></div>',
			),
			//HTML entities
			Array(
				'<div id="testsafehtml"><IMG SRC=javascript:alert("XSS")></div>',
				// The IMG-tag is what the current HTML Filter replaces the XSS-image with
				'<div id="testsafehtml"><img src="" /></div>',
			),
			//Grave accent obfuscation
			Array(
				'<div id="testsafehtml"><IMG SRC=`javascript:alert("RSnake says, \'XSS\'")`></div>',
				// Unlike the previous cases, the filter does not put a special IMG-tag here probably because of the grave accent usage
				'<div id="testsafehtml"></div>',
			),
			// Malformed IMG tags
			Array(
				'<div id="testsafehtml"><IMG """><SCRIPT>alert("XSS")</SCRIPT>"></div>',
				// The returned result is '">', but the XSS code is removed
				'<div id="testsafehtml">"></div>',
			),
			// fromCharCode
			Array(
				'<div id="testsafehtml"><IMG SRC=javascript:alert(String.fromCharCode(88,83,83))></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// UTF-8 Unicode encoding
			Array(
				'<div id="testsafehtml"><IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Long UTF-8 Unicode encoding without semicolons
			Array(
				'<div id="testsafehtml"><IMG SRC=&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Hex encoding without semicolons
			Array(
				'<div id="testsafehtml"><IMG SRC=&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x27&#x58&#x53&#x53&#x27&#x29></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Embedded tab
			Array(
				'<div id="testsafehtml"><IMG SRC="jav	ascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Embedded Encoded tab
			Array(
				'<div id="testsafehtml"><IMG SRC="jav&#x09;ascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Embedded newline to break up XSS
			Array(
				'<div id="testsafehtml"><IMG SRC="jav&#x0A;ascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Embedded carriage return to break up XSS
			Array(
				'<div id="testsafehtml"><IMG SRC="jav&#x0D;ascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Spaces and meta chars before the JavaScript in images for XSS
			Array(
				'<div id="testsafehtml"><IMG SRC=" &#14;  javascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// Non-alpha-non-digit XSS #1
			Array(
				'<div id="testsafehtml"><SCRIPT/XSS SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// Non-alpha-non-digit XSS #2
			Array(
				'<div id="testsafehtml"><BODY onload!#$%&()*~+-_.,:;?@[/|\]^`=alert("XSS")></div>',
				'<div id="testsafehtml"></div>',
			),
			// Non-alpha-non-digit XSS #3
			Array(
				'<div id="testsafehtml"><SCRIPT/SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// Extraneous open brackets
			Array(
				'<div id="testsafehtml"><<SCRIPT>alert("XSS");//<</SCRIPT></div>',
				'<div id="testsafehtml">&lt;</div>',
			),
			// No closing script tags
			Array(
				'<div id="testsafehtml"><SCRIPT SRC=http://ha.ckers.org/xss.js?< B ></div>',
				'<div id="testsafehtml"></div>',
			),
			// Protocol resolution in script tags
			Array(
				'<div id="testsafehtml"><SCRIPT SRC=//ha.ckers.org/.j></div>',
				'<div id="testsafehtml"></div>',
			),
			// Half open HTML/JavaScript XSS vector
			Array(
				'<div id="testsafehtml"><IMG SRC="javascript:alert(\'XSS\')"</div>',
				'<div id="testsafehtml"></div>',
			),
			// Double open angle brackets
			Array(
				'<div id="testsafehtml"><iframe src=http://ha.ckers.org/scriptlet.html <</div>',
				'<div id="testsafehtml"></div>',
			),
			// Escaping JavaScript escapes (not done)

			// End title tag
			Array(
				'<div id="testsafehtml"></TITLE><SCRIPT>alert("XSS");</SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// INPUT image
			Array(
				'<div id="testsafehtml"><INPUT TYPE="IMAGE" SRC="javascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"><input type="IMAGE" src="" /></div>',
			),
			// BODY image
			Array(
				'<BODY BACKGROUND="javascript:alert(\'XSS\')"><div id="testsafehtml"></div></body>',
				'<div class=\'bodyclass\'><div id="testsafehtml"></div></div>',
			),
			// IMG Dynsrc
			Array(
				'<div id="testsafehtml"><IMG DYNSRC="javascript:alert(\'XSS\')"></div>',
				'<div id="testsafehtml"><img /></div>',
			),
			// IMG lowsrc
			Array(
				'<div id="testsafehtml"><IMG LOWSRC="javascript:alert(\'XSS\')"></div>',
				'<div id="testsafehtml"><img /></div>',
			),
			// List-style-image
			Array(
				'<div id="testsafehtml"><STYLE>li {list-style-image: url("javascript:alert(\'XSS\')");}</STYLE><UL><LI>XSS</br></div>',
				'<div id="testsafehtml"><style>li{list-style-image:url("idiocy:alert(\'XSS\')");}</style><ul><li>XSS</div></ul></li>',
			),
			// VBscript in an image
			Array(
				'<div id="testsafehtml"><IMG SRC=\'vbscript:msgbox("XSS")\'></div>',
				'<div id="testsafehtml"><img src="" /></div>',
			),
			// BODY tag
			Array(
				'<BODY ONLOAD=alert(\'XSS\')><div id="testsafehtml"></div></body>',
				'<div class=\'bodyclass\'><div id="testsafehtml"></div></div>',
			),

			// BGSOUND
			Array(
				'<div id="testsafehtml"><BGSOUND SRC="javascript:alert(\'XSS\');" /></div>',
				'<div id="testsafehtml"><bgsound src="" /></div>',
			),

			// STYLE sheet
			Array(
				'<div id="testsafehtml"><LINK REL="stylesheet" HREF="javascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"></div>',
			),
			// Remote style sheet
			Array(
				'<div id="testsafehtml"><LINK REL="stylesheet" HREF="http://ha.ckers.org/xss.css"></div>',
				'<div id="testsafehtml"></div>',
			),
			// Remote style sheet part 2
			Array(
				'<div id="testsafehtml"><STYLE>@import\'http://ha.ckers.org/xss.css\';</STYLE></div>',
				'<div id="testsafehtml"><style>'."\n".'<!-- @import rules forbidden -->'."\n".'</style></div>',
			),
			// Remote style sheet part 3
			Array(
				'<div id="testsafehtml"><META HTTP-EQUIV="Link" Content="<http://ha.ckers.org/xss.css>; REL=stylesheet"></div>',
				'<div id="testsafehtml"></div>',
			),
			// Remote style sheet part 4
			Array(
				'<div id="testsafehtml"><STYLE>BODY{-moz-binding:url("http://ha.ckers.org/xssmoz.xml#xss")}</STYLE></div>',
				'<div id="testsafehtml"><style>.bodyclass{-moz-idiocy:url("http://ha.ckers.org/xssmoz.xml#xss")}</style></div>',
			),
			// STYLE tags with broken up JavaScript for XSS
			Array(
				'<div id="testsafehtml"><STYLE>@im\\port\'\\ja\\vasc\\ript:alert("XSS")\';</STYLE></div>',
				'<div id="testsafehtml"><style>'."\n".'<!-- @import rules forbidden -->'."\n".'</style></div>',
			),
			// STYLE attribute using a comment to break up expression
			Array(
				'<div id="testsafehtml"><IMG STYLE="xss:expr/*XSS*/ession(alert(\'XSS\'))"></div>',
				'<div id="testsafehtml"><img style="xss:idiocy(alert(\'XSS\'))" /></div>',
			),

			// STYLE tag using background-image
			Array(
				'<div id="testsafehtml"><STYLE>.XSS{background-image:url("javascript:alert(\'XSS\')");}</STYLE><A CLASS=XSS></A></div>',
				'<div id="testsafehtml"><style>.XSS{background-image:url("idiocy:alert(\'XSS\')");}</style><a class="XSS" target="_blank" title="Click the link to open the URL in a new window." rel="noreferrer noopener"></a></div>',
			),
			// STYLE tag using background
			Array(
				'<div id="testsafehtml"><STYLE type="text/css">BODY{background:url("javascript:alert(\'XSS\')")}</STYLE></div>',
				'<div id="testsafehtml"><style type="text/css">.bodyclass{background:url("idiocy:alert(\'XSS\')")}</style></div>',
			),
			// Anonymous HTML with STYLE attribute
			Array(
				'<div id="testsafehtml"><XSS STYLE="xss:expression(alert(\'XSS\'))" /></div>',
				'<div id="testsafehtml"><xss style="xss:idiocy(alert(\'XSS\'))" /></div>',
			),
			// Local htc file
			Array(
				'<div id="testsafehtml"><XSS STYLE="behavior: url(xss.htc);" /></div>',
				'<div id="testsafehtml"><xss style="idiocy:url(xss.htc);" /></div>',
			),

			// META
			Array(
				'<div id="testsafehtml"><META HTTP-EQUIV="refresh" CONTENT="0;url=javascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"></div>',
			),
			// META using data
			Array(
				'<div id="testsafehtml"><META HTTP-EQUIV="refresh" CONTENT="0;url=data:text/html base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K"></div>',
				'<div id="testsafehtml"></div>',
			),
			// META with additional URL parameter
			Array(
				'<div id="testsafehtml"><META HTTP-EQUIV="refresh" CONTENT="0; URL=http://;URL=javascript:alert(\'XSS\');"></div>',
				'<div id="testsafehtml"></div>',
			),
			// IFRAME
			Array(
				'<div id="testsafehtml"><IFRAME SRC="javascript:alert(\'XSS\');"></IFRAME></div>',
				'<div id="testsafehtml"></div>',
			),
			// FRAME
			Array(
				'<div id="testsafehtml"><FRAMESET><FRAME SRC="javascript:alert(\'XSS\');"></FRAMESET></div>',
				'<div id="testsafehtml"></div>',
			),
			// TABLE
			Array(
				'<div id="testsafehtml"><TABLE BACKGROUND="javascript:alert(\'XSS\')"></TABLE></div>',
				'<div id="testsafehtml"><table background=""></table></div>',
			),
			// TD
			Array(
				'<div id="testsafehtml"><TABLE><TD BACKGROUND="javascript:alert(\'XSS\')"></TD></TABLE></div>',
				'<div id="testsafehtml"><table><td background=""></td></table></div>',
			),
			// DIV background-image
			Array(
				'<div id="testsafehtml"><DIV STYLE="background-image: url(javascript:alert(\'XSS\'))"></div>',
				'<div id="testsafehtml"><div style="background-image:url(#)"></div></div>',
			),
			// DIV background-image with unicoded XSS exploit
			Array(
				'<div id="testsafehtml"><DIV STYLE="background-image:\0075\0072\006C\0028\'\006a\0061\0076\0061\0073\0063\0072\0069\0070\0074\003a\0061\006c\0065\0072\0074\0028.1027\0058.1053\0053\0027\0029\'\0029"></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>',
			),
			// DIV background-image plus extra characters
			Array(
				'<div id="testsafehtml"><DIV STYLE="background-image: url(&#1;javascript:alert(\'XSS\'))"></div>',
				'<div id="testsafehtml"><div style=idiocy></div></div>',
			),
			// DIV expression
			Array(
				'<div id="testsafehtml"><DIV STYLE="width: expression(alert(\'XSS\'));"></div>',
				'<div id="testsafehtml"><div style="width:idiocy(alert(\'XSS\'));"></div></div>', 16
			),
			// BASE tag
			Array(
				'<div id="testsafehtml"><BASE HREF="javascript:alert(\'XSS\');//"></div>',
				'<base href="#" target="_blank" title="This external link will open in a new window" rel="noreferrer noopener" />',
			),
			// OBJECT tag
			Array(
				'<div id="testsafehtml"><OBJECT TYPE="text/x-scriptlet" DATA="http://ha.ckers.org/scriptlet.html"></OBJECT></div>',
				'<div id="testsafehtml"></div>',
			),
			// Using an EMBED tag you can embed a Flash movie that contains XSS
			Array(
				'<div id="testsafehtml"><EMBED SRC="http://ha.ckers.Using an EMBED tag you can embed a Flash movie that contains XSS. Click here for a demo. If you add the attributes allowScriptAccess="never" and allownetworking="internal" it can mitigate this risk (thank you to Jonathan Vanasco for the info).:org/xss.swf" AllowScriptAccess="always"></EMBED></div>',
				'<div id="testsafehtml"></div>',
			),
			// You can EMBED SVG which can contain your XSS vector
			Array(
				'<div id="testsafehtml"><EMBED SRC="data:image/svg+xml;base64,PHN2ZyB4bWxuczpzdmc9Imh0dH A6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcv MjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hs aW5rIiB2ZXJzaW9uPSIxLjAiIHg9IjAiIHk9IjAiIHdpZHRoPSIxOTQiIGhlaWdodD0iMjAw IiBpZD0ieHNzIj48c2NyaXB0IHR5cGU9InRleHQvZWNtYXNjcmlwdCI+YWxlcnQoIlh TUyIpOzwvc2NyaXB0Pjwvc3ZnPg==" type="image/svg+xml" AllowScriptAccess="always"></EMBED></div>',
				'<div id="testsafehtml"></div>',
			),

			// Using ActionScript inside flash can obfuscate your XSS vector
			// Not sure how to test this

			// XML data island with CDATA obfuscation
			Array(
				'<div id="testsafehtml"><XML ID="xss"><I><B><IMG SRC="javas<!-- -->cript:alert(\'XSS\')"></B></I></XML><SPAN DATASRC="#xss" DATAFLD="B" DATAFORMATAS="HTML"></SPAN></div>',
				'<div id="testsafehtml"><span></span></div>',
			),
			// Locally hosted XML with embedded JavaScript that is generated using an XML data island
			Array(
				'<div id="testsafehtml"><XML SRC="xsstest.xml" ID=I></XML><SPAN DATASRC=#I DATAFLD=C DATAFORMATAS=HTML></SPAN></div>',
				'<div id="testsafehtml"><span></span></div>',
			),
			// Assuming you can only fit in a few characters and it filters against ".js"
			Array(
				'<div id="testsafehtml"><SCRIPT SRC="http://ha.ckers.org/xss.jpg"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// SSI (Server Side Includes)
			Array(
				'<div id="testsafehtml"><!--#exec cmd="/bin/echo \'<SCR\'"--><!--#exec cmd="/bin/echo \'IPT SRC=http:\/\/ha.ckers.org/xss.js></SCRIPT>\'"--></div>',
				'<div id="testsafehtml"></div>',
			),

			// PHP, not applicable
			// IMG Embedded commands, can not be tested
			// IMG Embedded commands part II, can not be tested

			// Cookie manipulation
			/* Admittidly this is pretty obscure but I have seen a few examples where <META
			 * is allowed and you can use it to overwrite cookies. There are other examples
			 * of sites where instead of fetching the username from a database it is stored
			 * inside of a cookie to be displayed only to the user who visits the page. With
			 * these two scenarios combined you can modify the victim's cookie which will be
			 * displayed back to them as JavaScript (you can also use this to log people out
			 * or change their user states, get them to log in as you, etc...):
			 */
			Array(
				'<div id="testsafehtml"><META HTTP-EQUIV="Set-Cookie" Content="USERID=<SCRIPT>alert(\'XSS\')</SCRIPT>"></div>',
				'<div id="testsafehtml"></div>',
			),

			// XSS using HTML quote encapsulation #1
			/* This was tested in IE, your mileage may vary. For
			 * performing XSS on sites that allow "<SCRIPT>" but
			 * don't allow "<SCRIPT SRC..." by way of a regex
			 * filter "/<script[^>]+src/i":
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT a=">" SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #2
			/* For performing XSS on sites that allow "<SCRIPT>" but don't allow
			 * "<script src..." by way of a regex filter
			 * "/<script((\s+\w+(\s*=\s*(?:"(.)*?"|'(.)*?'|[^'">\s]+))?)+\s*|\s*)src/i"
			 * (this is an important one, because I've seen this regex in the wild):
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT =">" SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #3
			/* Another XSS to evade the same filter,
			 * "/<script((\s+\w+(\s*=\s*(?:"(.)*?"|'(.)*?'|[^'">\s]+))?)+\s*|\s*)src/i":
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT a=">" \'\' SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #4
			/* Yet another XSS to evade the same filter,
			 * "/<script((\s+\w+(\s*=\s*(?:"(.)*?"|'(.)*?'|[^'">\s]+))?)+\s*|\s*)src/i".
			 * I know I said I wasn't goint to discuss mitigation techniques but the only
			 * thing I've seen work for this XSS example if you still want to allow <SCRIPT>
			 * tags but not remote script is a state machine (and of course there are other
			 * ways to get around this if they allow <SCRIPT> tags):
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT "a=\'>\'" SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				// Allthough it is not filtered out perfectly it should disable the XSS
				'<div id="testsafehtml">\'" SRC="http://ha.ckers.org/xss.js"></div>',
			),
			// XSS using HTML quote encapsulation #5
			/* And one last XSS attack to evade,
			 * "/<script((\s+\w+(\s*=\s*(?:"(.)*?"|'(.)*?'|[^'">\s]+))?)+\s*|\s*)src/i"
			 * using grave accents (again, doesn't work in Firefox):
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT a=`>` SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #6
			/* Here's an XSS example that bets on the fact that the regex won't catch a
			 * matching pair of quotes but will rather find any quotes to terminate a
			 * parameter string improperly:
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT a=">\'>" SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #7
			/* This XSS still worries me, as it would be nearly impossible to stop this
			 * without blocking all active content:
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT>document.write("<SCRI");</SCRIPT>PT SRC="http://ha.ckers.org/xss.js"></SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #8
			/* This XSS is an example where the regexp that is used to find the script tags
			 * does not match script tags. 
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT>alert("hello world");</SCRIPT></div>',
				'<div id="testsafehtml"></div>',
			),
			// XSS using HTML quote encapsulation #9
			/* This XSS is an example where the regexp that is used to find the script tags
			 * does not match closing script tags with more than one space in it. 
			 */
			Array(
				'<div id="testsafehtml"><SCRIPT>alert("hello world");</SCRIPT    ></div>',
				'<div id="testsafehtml"></div>',
			),

			// URL string evasion
			// It is on the list of XSS issues, but this should be allowed as it is a normal
			// link. The filter does add the message that it will be opened in another window.
			// IP verses hostname
			Array(
				'<div id="testsafehtml"><A HREF="http://66.102.7.147/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://66.102.7.147/" target="_blank" title="http://66.102.7.147/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// URL encoding
			Array(
				'<div id="testsafehtml"><A HREF="http://%77%77%77%2E%67%6F%6F%67%6C%65%2E%63%6F%6D">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://%77%77%77%2E%67%6F%6F%67%6C%65%2E%63%6F%6D" target="_blank" title="http://%77%77%77%2E%67%6F%6F%67%6C%65%2E%63%6F%6D'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Dword encoding
			Array(
				'<div id="testsafehtml"><A HREF="http://1113982867/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://1113982867/" target="_blank" title="http://1113982867/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Hex encoding
			Array(
				'<div id="testsafehtml"><A HREF="http://0x42.0x0000066.0x7.0x93/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://0x42.0x0000066.0x7.0x93/" target="_blank" title="http://0x42.0x0000066.0x7.0x93/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Octal encoding
			Array(
				'<div id="testsafehtml"><A HREF="http://0102.0146.0007.00000223/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://0102.0146.0007.00000223/" target="_blank" title="http://0102.0146.0007.00000223/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Mixed encoding
			/* Let's mix and match base encoding and throw in some tabs and newlines - why
			 * browsers allow this, I'll never know). The tabs and newlines only work if this
			 * is encapsulated with quotes:
			 */
			Array(
				'<div id="testsafehtml"><A HREF="h'."\n".'tt	p://6	6.000146.0x7.147/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://66.000146.0x7.147/" target="_blank" title="http://66.000146.0x7.147/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Protocol resolution bypass
			/* // translates to http:// which saves a few more bytes). This is really handy when
			 * space is an issue too (two less characters can go a long way) and can easily bypass
			 * regex like "(ht|f)tp(s)?://" (thanks to Ozh for part of this one). You can also
			 * change the "//" to "\\". You do need to keep the slashes in place, however,
			 * otherwise this will be interpreted as a relative path URL.
			 */
			Array(
				'<div id="testsafehtml"><A HREF="//www.google.com/">XSS</A></div>',
				'<div id="testsafehtml"><a href="//www.google.com/" target="_blank" title="//www.google.com/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Google "feeling lucky" part 1.
			Array(
				'<div id="testsafehtml"><A HREF="//google">XSS</A></div>',
				'<div id="testsafehtml"><a href="//google" target="_blank" title="//google'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Google "feeling lucky" part 2.
			Array(
				'<div id="testsafehtml"><A HREF="http://ha.ckers.org@google">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://ha.ckers.org@google" target="_blank" title="http://ha.ckers.org@google'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Google "feeling lucky" part 3.
			Array(
				'<div id="testsafehtml"><A HREF="http://google:ha.ckers.org">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://google:ha.ckers.org" target="_blank" title="http://google:ha.ckers.org'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Removing cnames
			Array(
				'<div id="testsafehtml"><A HREF="http://google.com/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://google.com/" target="_blank" title="http://google.com/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Extra dot for absolute DNS:
			Array(
				'<div id="testsafehtml"><A HREF="http://www.google.com./">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://www.google.com./" target="_blank" title="http://www.google.com./'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// JavaScript link location:
			Array(
				'<div id="testsafehtml"><A HREF="javascript:document.location=\'http://www.google.com/\'">XSS</A></div>',
				'<div id="testsafehtml"><a href="#" target="_blank" title="#'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),
			// Content replace as attack vector
			Array(
				'<div id="testsafehtml"><A HREF="http://www.gohttp://www.google.com/ogle.com/">XSS</A></div>',
				'<div id="testsafehtml"><a href="http://www.gohttp://www.google.com/ogle.com/" target="_blank" title="http://www.gohttp://www.google.com/ogle.com/'.PHP_EOL.'Click the link to open the URL in a new window." rel="noreferrer noopener">XSS</a></div>',
			),

			// Character Encoding
			// The listed character encodings of '<' does not seem to be useful to test

		);
	}

	public function providerEventHandlerXSStest()
	{
		$eventHandlers = ["onAbort", "onActivate", "onAfterPrint",
			"onAfterUpdate", "onBeforeActivate", "onBeforeCopy",
			"onBeforeCut", "onBeforeDeactivate",
			"onBeforeEditFocus", "onBeforePaste", "onBeforePrint",
			"onBeforeUnload", "onBegin", "onBlur", "onBounce",
			"onCellChange", "onChange", "onClick", "onContextMenu",
			"onControlSelect", "onCopy", "onCut",
			"onDataAvailable", "onDataSetChanged",
			"onDataSetComplete", "onDblClick", "onDeactivate",
			"onDrag", "onDragEnd", "onDragLeave", "onDragEnter",
			"onDragOver", "onDragDrop", "onDrop", "onEnd",
			"onError", "onErrorUpdate", "onFilterChange",
			"onFinish", "onFocus", "onFocusIn", "onFocusOut",
			"onHelp", "onKeyDown", "onKeyPress", "onKeyUp",
			"onLayoutComplete", "onLoad", "onLoseCapture",
			"onMediaComplete", "onMediaError", "onMouseDown",
			"onMouseEnter", "onMouseLeave", "onMouseMove",
			"onMouseOut", "onMouseOver", "onMouseUp",
			"onMouseWheel", "onMove", "onMoveEnd", "onMoveStart",
			"onOutOfSync", "onPaste", "onPause", "onProgress",
			"onPropertyChange", "onReadyStateChange", "onRepeat",
			"onReset", "onResize", "onResizeEnd", "onResizeStart",
			"onResume", "onReverse", "onRowsEnter", "onRowExit",
			"onRowDelete", "onRowInserted", "onScroll", "onSeek",
			"onSelect", "onSelectionChange", "onSelectStart",
			"onStart", "onStop", "onSyncRestored", "onSubmit",
			"onTimeError", "onTrackChange", "onUnload",
			"onURLFlip", "ontouchstart", "ontouchend",
			"ontouchmove", "ontouchenter", "ontouchleave",
			"ontouchcancel", "onDOMActivate", "onMutation",
			"onDOMNodeInserted", "onDOMNodeRemoved",
			"onDOMNodeRemovedFromDocument",
			"onDOMNodeInsertedIntoDocument", "onDOMAttrModified",
			"onDOMCharacterDataModified"];


		function generateTest($eventHandler) {
			return Array(
				'<div id="testsafehtml"><div ' . $eventHandler . '="alert(\'XSS\')"></div></div>',
				'<div id="testsafehtml"><div></div></div>',
			);
		}

		return array_map('generateTest', $eventHandlers);
	}
}
?>
