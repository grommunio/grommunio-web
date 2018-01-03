/**
 * Test that urls are correctly shown in the messagebody
 */
describe('Messagebody links', function() {
	var messagebody;
	container = new Zarafa.core.Container();
	container.setServerConfig({'client_timeout': 10});
	container.setUser({'fullname': 'henk'});
	const data = {
		'entryid' : '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000',
		'object_type' : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE,
		'message_class': 'IPM.Note',
		'body': 'b',
		'isHTML' : false,
	}
	const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', data);

	beforeAll(function() {
		messagebody = new Zarafa.common.ui.messagepanel.MessageBody({renderTo: Ext.getBody()});
	});

	/**
	 * Test that valid urls are shown in the correct href in the messagebody
	 */
	describe("Valid url", function() {
		// This test requires a associated array since the code changes the url
		const validUrls = { 
			"http://www.google.com": "http://www.google.com/",
			"http://google.com": "http://google.com/",
			"https://google.com": "https://google.com/",
			"www.google.com": "http://www.google.com/",
			"http://google.com/help.php?a=5": "http://google.com/help.php?a=5",
			"https://subdomain.domain:8080/test/test.xhtml?info=4": "https://subdomain.domain:8080/test/test.xhtml?info=4"
		};

		for(var url in validUrls) {

			it('it should shown link ' + validUrls[url] + ' in messagebody', function() {
				// Set url in body of record
				record.set('body',this.url);
				messagebody.update(record);

				// Select href
				var element = Ext.DomQuery.select('a',messagebody.getEl().dom.contentDocument);
				var href = element[0].href;

				expect(href).toEqual(this.expectedUrl);
			}.createDelegate({ expectedUrl: validUrls[url], url: url }));
		}
	});

	/**
	 * Test that invalid urls aren't shown in the href in the messagebody
	 */
	describe("Invalid url", function() {
		const invalidUrls = ['http:// google.com', 'www. google .com', 'http://',  'http://???', 'httpf://', 'google.com'];

		for(var i = 0, len = invalidUrls.length; i < len; i++) {
			it('it should not shown link ' + invalidUrls[i] + ' in messagebody', function() {
				// Set url in body of record
				record.set('body',this.link);
				messagebody.update(record);

				// Select href
				var element = Ext.DomQuery.select('a',messagebody.getEl().dom.contentDocument);
				expect(Ext.isEmpty(element)).toBeTruthy();
			}.createDelegate({ link: invalidUrls[i] }));
		}
	});
});
