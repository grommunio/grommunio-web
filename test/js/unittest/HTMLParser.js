/*
 * Test the Zarafa.core.HTMLParser
 */
describe('HTMLParser', function() {
	// Create container
	container = new Zarafa.core.Container();

	var checkExternalContent;
	var blockExternalContent;

	beforeEach(function() {
		checkExternalContent = function(body) {
			return Zarafa.core.HTMLParser.hasExternalContent(body);
		};

		blockExternalContent = function(body) {
			return Zarafa.core.HTMLParser.blockExternalContent(body);
		};
	});

	/*
	 * Test functions related to blocking external content is working propery.
	 */
	describe('External Content', function() {
		/*
		 * Test functions related to detecting external content is working propery.
		 */
		describe('Detect External Content', function() {
			it('can check external content properly', function() {
				expect(checkExternalContent).not.toThrow();
				expect(checkExternalContent('')).toBeFalsy();
				expect(checkExternalContent()).toBeFalsy();
			});

			// check for src/background tags
			it('can handle src attribute links without quotes', function() {
				expect(checkExternalContent('<img alt=text src=http://www.google.com/images/icon.gif width=120 height=500>')).toBeTruthy();
			});

			it('can handle src attribute links with quotes', function() {
				expect(checkExternalContent('<img alt=\'text\' src=\'http://www.google.com/images/icon.gif\' width=\'120\' height=\'500\' />')).toBeTruthy();
			});

			it('can handle src attribute links with double quotes', function() {
				expect(checkExternalContent('<img alt="text" src="http://www.google.com/images/icon.gif" width="120" height="500">')).toBeTruthy();
			});

			it('can handle src attribute relative links', function() {
				expect(checkExternalContent('<img alt="text" src="../images/icon.gif" width=120 height=500>')).toBeFalsy();
			});

			it('can handle body tag with background attribute', function() {
				expect(checkExternalContent('<body background="https://www.google.com/images/bgimage.jpg">')).toBeTruthy();
			});

			it('can handle table tag with background attribute', function() {
				expect(checkExternalContent('<table width="300" bgcolor="#c6eff7" background="http://www.google.com/images/oakwood.gif" border="3">')).toBeTruthy();
			});

			// check for external stylesheets
			it('can handle style tag with external stylesheet', function() {
				expect(checkExternalContent('<body style="background-image:url(http://www.google.com/images/bgimage.jpg)">')).toBeTruthy();
			});
		});

		/*
		 * Test functions related to blocking external content is working propery.
		 */
		describe('Block External Content', function() {
			it('can block external content properly', function() {
				expect(blockExternalContent).not.toThrow();
			});

			// block src/background attribute with external links
			// not working because regular expression is not correctly handling links without quotes
			xit('can block src attribute links without quotes', function() {
				expect(blockExternalContent('<img alt=text src=http://www.google.com/images/icon.gif width=120 height=500>')).toEqual('<img alt=text src= width=120 height=500>');
			});

			it('can block src attribute links with quotes', function() {
				expect(blockExternalContent('<img alt=\'text\' src=\'http://www.google.com/images/icon.gif\' width=\'120\' height=\'500\' />')).toEqual('<img alt=\'text\' src=\'\' width=\'120\' height=\'500\' />');
			});

			it('can block src attribute links with double quotes', function() {
				expect(blockExternalContent('<img alt="text" src="http://www.google.com/images/icon.gif" width="120" height="500">')).toEqual('<img alt="text" src="" width="120" height="500">');
			});

			it('should not block relative links', function() {
				expect(blockExternalContent('<img alt="text" src="../images/icon.gif" width=120 height=500>')).toEqual('<img alt="text" src="../images/icon.gif" width=120 height=500>');
			});

			it('can block body tag with background attribute', function() {
				expect(blockExternalContent('<body background="https://www.google.com/images/bgimage.jpg" width="100">')).toEqual('<body background="" width="100">');
			});

			it('can block table tag with background attribute', function() {
				expect(blockExternalContent('<table width="300" bgcolor="#c6eff7" background="http://www.google.com/images/oakwood.gif" border="3">')).toEqual('<table width="300" bgcolor="#c6eff7" background="" border="3">');
			});

			// block external stylesheets
			it('can block style tag with external stylesheet', function() {
				expect(blockExternalContent('<body style="background-image:url(http://www.google.com/images/bgimage.jpg)">')).toEqual('<body style="background-image:url()">');
			});
		});
	});

	/*
	 * Test converting HTML contents to plain-text
	 */
	describe('HTML to plain-text conversion', function() {

		it('can convert empty text to empty', function() {
			expect(Zarafa.core.HTMLParser.convertPlainToHTML('')).toEqual('');
		});

		it('can convert end-of-line characters correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('This is a multi-line message<br /><br>That means that the message spans multiple lines.');
			expect(plain).toEqual('This is a multi-line message\n\nThat means that the message spans multiple lines.');
		});

		it('can convert select / options tags correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<select><br /><option value="volvo">Volvo</option><br /><option value="saab">Saab</option><br /><option value="mercedes">Mercedes</option><br /><option value="audi">Audi</option><br /></select>');
			expect(plain).toEqual('\n\tVolvo\t\n\tSaab\t\n\tMercedes\t\n\tAudi\t');
		});

		it('can convert horizontal rule correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('This is a multi-line message<hr />That means that the message spans multiple lines.');
			expect(plain).toEqual('This is a multi-line message\n-----------\nThat means that the message spans multiple lines.');
		});

		it('can convert block level elements (h1-6, div, p, title) correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('This is <h1>string</h1> <h6> consisting</h6> of multiple <div style="font: 20px;">block level elements</div>. This should be <title>converted</title> with <p>one newlines.</p>');
			expect(plain).toEqual('This is \nstring\n consisting\n of multiple \nblock level elements\n. This should be \nconverted\n with \none newlines.');
		});

		it('can convert inline elements (span, abbr, strong) correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('This is <span>string</span> consisiting of multiple <strong>inline elements</strong>. This should be <abbr>converted</abbr> with empty space.');
			expect(plain).toEqual('This is string consisiting of multiple inline elements. This should be converted with empty space.');
		});

		it('can convert data definition (dd, dt, dl) correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<dl><br /><dt>data term 1</dt><br /><dd>- data def 1</dd><br /></dl>');
			expect(plain).toEqual('\ndata term 1\n\n\t- data def 1\t');
		});

		it('can convert unordered lists (ul, li) correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<ul><br /> <li>Coffee</li><br> <li>Milk</li><br /></ul>');
			expect(plain).toEqual('\n \tCoffee\t\n \tMilk\t');
		});

		it('can convert ordered lists (ol, li) correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<ol><br /> <li>Coffee</li><br> <li>Milk</li><br /></ol>');
			expect(plain).toEqual('\n \tCoffee\t\n \tMilk\t');
		});

		it('can convert textarea / image tag correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<textarea>This text is in textarea</textarea><br /><img src="src of image" alt="alternate text of image" />The image will also be removed.');
			expect(plain).toEqual('This text is in textarea\n\nThe image will also be removed.');
		});

		it('can convert pre tag correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<pre>This is a\n preformated\n text</pre>');
			expect(plain).toEqual('This is a\n preformated\n text');
		});

		it('can convert table tags (table, tbody, thead, tfoot, tr, td, th, caption) correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('<table border="1"><thead><tr><th>Month</th></tr> </thead> <tfoot> <tr><td>Sum</td></tr> </tfoot> <tbody> <tr><td>January</td></tr> <tr><td>February</td></tr> </tbody></table>');
			expect(plain).toEqual('\n\nMonth\n\nSum\n\nJanuary\n\nFebruary');
		});

		it('can remove style tag completely', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('before style<style type="text/css"><br /> h1 {color:red;}<br />p {color:blue;}<br /></style> after style');
			expect(plain).toEqual('before style after style');
		});

		it('can remove script tag completely', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('before script<script type="text/javascript"><br />document.write("Hello World!")<br /></script> after script');
			expect(plain).toEqual('before script after script');
		});

		it('can remove comments completely', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('before comment<!-- this is a html comment which should be completely removed. --> after comment');
			expect(plain).toEqual('before comment after comment');
		});

		it('can convert anchor tag correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('click <a href="www.google.com">here</a>');
			expect(plain).toEqual('click here <www.google.com>');
		});

		it('can convert anchor tags without quotes correctly', function() {
			const plain = Zarafa.core.HTMLParser.convertHTMLToPlain('click <a href=www.google.com>here</a>');
			expect(plain).toEqual('click here <www.google.com>');
		});
	});

	/*
	 * Test converting plain-text contents to HTML
	 */
	describe('plain-text to HTML conversion', function() {

		it('can convert simple text to html', function() {
			const html = Zarafa.core.HTMLParser.convertPlainToHTML('abc');
			expect(html).toEqual('<div><pre wrap style="white-space: pre-wrap; word-wrap: break-word;">abc</pre></div>');
		});

		it('can convert simple text to html with enters', function() {
			const html = Zarafa.core.HTMLParser.convertPlainToHTML('abc\n\nabc');
			expect(html).toEqual('<div><pre wrap style="white-space: pre-wrap; word-wrap: break-word;">abc<br><br>abc</pre></div>');
		});
	});

	describe('nl2br', function() {
		it('can convert newline to br', function() {
			expect(Zarafa.core.HTMLParser.nl2br("\n\n")).toEqual("<br><br>");
		});

		it('can convert no newlines to no br', function() {
			expect(Zarafa.core.HTMLParser.nl2br("henk")).toEqual("henk");
		});
	});

	describe('rlnl2nl', function() {
		it('can convert rlnl2nl to \n', function() {
			expect(Zarafa.core.HTMLParser.rlnl2nl('\r\n')).toEqual('\n');
		});
	});

	/*
	 * Test converting inline image urls
	 */
	describe('Inline images', function() {

		describe('Outlook to webapp format', function() {
			const storeEntryId = '0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000000153914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000';
			const entryId = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000225534895B4CA5AC93F06388C00000000';
      var expectedSrc = container.getBaseURL();
      expectedSrc = Ext.urlAppend(expectedSrc, 'load=download_attachment');
      expectedSrc = Ext.urlAppend(expectedSrc, 'attachCid=' + 'image001.jpg@01CEA5A6.0121A760');
      expectedSrc = Ext.urlAppend(expectedSrc, 'store=' + storeEntryId);
      expectedSrc = Ext.urlAppend(expectedSrc, 'entryid=' + entryId);
      expectedSrc = Ext.urlAppend(expectedSrc, 'contentDispositionType=inline');

			it('can convert urls with double quotes', function() {
				const url = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa('<img width="1024" height="768" id="Picture_x0020_0" src="cid:image001.jpg@01CEA5A6.0121A760" alt="Chrysanthemum.jpg" />', storeEntryId, entryId);
				expect(url).toEqual('<img width="1024" height="768" id="Picture_x0020_0" src="' + expectedSrc + '" alt="Chrysanthemum.jpg" />');
			});

			it('can convert urls with single quotes', function() {
				const url = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa('<img width=\'1024\' height=\'768\' id=\'Picture_x0020_0\' src=\'cid:image001.jpg@01CEA5A6.0121A760\' alt=\'Chrysanthemum.jpg\' />', storeEntryId, entryId);
				expect(url).toEqual('<img width=\'1024\' height=\'768\' id=\'Picture_x0020_0\' src=\'' + expectedSrc + '\' alt=\'Chrysanthemum.jpg\' />');
			});

			it('can convert urls without quotes', function() {
				const url = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa('<img width=1024 height=768 id=Picture_x0020_0 src=cid:image001.jpg@01CEA5A6.0121A760 alt=Chrysanthemum.jpg />', storeEntryId, entryId);
				expect(url).toEqual('<img width=1024 height=768 id=Picture_x0020_0 src=' + expectedSrc + ' alt=Chrysanthemum.jpg />');
			});

			it('should not change image tags for external images', function() {
				const url = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa('<img src="https://www.google.co.in/images/srpr/logo4w.png" title="" alt="" align="" border="0" height="50" hspace="0" vspace="0" width="50" />', storeEntryId, entryId);
				expect(url).toEqual('<img src="https://www.google.co.in/images/srpr/logo4w.png" title="" alt="" align="" border="0" height="50" hspace="0" vspace="0" width="50" />');
			});

			it('should show inline images with embedded messages', function() {
				const url = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa('<img width="1024" height="768" id="Picture_x0020_0" src="cid:image001.jpg@01CEA5A6.0121A760" alt="Chrysanthemum.jpg" />', storeEntryId, entryId, [0]);
				expect(url).toEqual('<img width="1024" height="768" id="Picture_x0020_0" src="' + expectedSrc + '&attachNum[]=0" alt="Chrysanthemum.jpg" />');
			});

			it('should show inline images with embedded message in an embedded message', function() {
				const url = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa('<img width="1024" height="768" id="Picture_x0020_0" src="cid:image001.jpg@01CEA5A6.0121A760" alt="Chrysanthemum.jpg" />', storeEntryId, entryId, [1,2]);
				expect(url).toEqual('<img width="1024" height="768" id="Picture_x0020_0" src="' + expectedSrc + '&attachNum[]=1&attachNum[]=2" alt="Chrysanthemum.jpg" />');
			});
		});

		describe('Webapp to outlook format', function() {

			it('can convert urls with double quotes', function() {
				const url = Zarafa.core.HTMLParser.inlineImgZarafaToOutlook('<img width="1024" height="768" id="Picture_x0020_0" src="/saket/webapp_new/index.php?load=download_attachment&sessionid=q30f2vav73r95lqo8dc35auqk5&attachCid=image001.jpg@01CEA5A6.0121A760&store=0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c0000000000f27a29f89e9e488d941107e300c2142f0100000001000000be7a82ba7ec6480eb51a40a72e635c7470736575646f3a2f2f5a617261666100&entryid=00000000f27a29f89e9e488d941107e300c2142f0100000005000000cd29086390b343e3a47d4ad2aeee332d00000000&contentDispositionType=inline" alt="Chrysanthemum.jpg" />');
				expect(url).toEqual('<img width="1024" height="768" id="Picture_x0020_0" src="cid:image001.jpg@01CEA5A6.0121A760" alt="Chrysanthemum.jpg" />');
			});

			it('can convert urls with single quotes', function() {
				const url = Zarafa.core.HTMLParser.inlineImgZarafaToOutlook('<img width=\'1024\' height=\'768\' id=\'Picture_x0020_0\' src=\'/saket/webapp_new/index.php?load=download_attachment&sessionid=q30f2vav73r95lqo8dc35auqk5&attachCid=image001.jpg@01CEA5A6.0121A760&store=0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c0000000000f27a29f89e9e488d941107e300c2142f0100000001000000be7a82ba7ec6480eb51a40a72e635c7470736575646f3a2f2f5a617261666100&entryid=00000000f27a29f89e9e488d941107e300c2142f0100000005000000cd29086390b343e3a47d4ad2aeee332d00000000&contentDispositionType=inline\' alt=\'Chrysanthemum.jpg\' />');
				expect(url).toEqual('<img width=\'1024\' height=\'768\' id=\'Picture_x0020_0\' src=\'cid:image001.jpg@01CEA5A6.0121A760\' alt=\'Chrysanthemum.jpg\' />');
			});

			it('can convert urls without quotes', function() {
				const url = Zarafa.core.HTMLParser.inlineImgZarafaToOutlook('<img width=1024 height=768 id=Picture_x0020_0 src=/saket/webapp_new/index.php?load=download_attachment&sessionid=q30f2vav73r95lqo8dc35auqk5&attachCid=image001.jpg@01CEA5A6.0121A760&store=0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c0000000000f27a29f89e9e488d941107e300c2142f0100000001000000be7a82ba7ec6480eb51a40a72e635c7470736575646f3a2f2f5a617261666100&entryid=00000000f27a29f89e9e488d941107e300c2142f0100000005000000cd29086390b343e3a47d4ad2aeee332d00000000&contentDispositionType=inline alt=Chrysanthemum.jpg />');
				expect(url).toEqual('<img width=1024 height=768 id=Picture_x0020_0 src=cid:image001.jpg@01CEA5A6.0121A760 alt=Chrysanthemum.jpg />');
			});

			it('should not change image tags for external images', function() {
				const url = Zarafa.core.HTMLParser.inlineImgZarafaToOutlook('<img src="https://www.google.co.in/images/srpr/logo4w.png" title="" alt="" align="" border="0" height="50" hspace="0" vspace="0" width="50" />');
				expect(url).toEqual('<img src="https://www.google.co.in/images/srpr/logo4w.png" title="" alt="" align="" border="0" height="50" hspace="0" vspace="0" width="50" />');
			});
		});
	});
});

