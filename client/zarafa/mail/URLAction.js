/*
 * #dependsFile client/zarafa/core/URLActionMgr.js
 */
Ext.namespace('Zarafa.mail');

/**
 * @class Zarafa.mail.URLAction
 * @extends Object
 *
 * The URL Actions for Mail Context. Currently only mailto action is handled.
 * @singleton
 */
Zarafa.mail.URLAction = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor : function()
	{
		var handler = {
			handler : this.handleMailTo,
			scope : this
		};

		Zarafa.core.URLActionMgr.register('mailto', handler);
	},

	/**
	 * Function reads data passed as href from {@link Zarafa.core.URLActionMgr URLActionMgr} and
	 * using that data it creates new mail record, and then opens that record into contentpanel.
	 * @param {String} action url action that is executed
	 * @param {href} href The href data using it we can handle the mailto action
	 * @param {Array|Function} handler handler config that was passed when registering this action
	 */
	handleMailTo : function(action, href, handler)
	{
		href = href.replace(/^mailto:/ig, 'to=');
		href = href.replace(/\?/i, '&');
		var urlData = Ext.urlDecode(href);
		urlData = Zarafa.core.Util.objectKeysToLowerCase(urlData);

		// get instance of mail context model by using bidding process
		var folder = container.getHierarchyStore().getDefaultFolder('drafts');
		var context = container.getContextByFolder(folder);
		var model = context.getModel();

		// create new mail record
		var record = model.createRecord(folder);

		// Set data in the mail record
		if(!Ext.isEmpty(urlData.subject)) {
			record.set('subject', urlData.subject);
		}

		if(!Ext.isEmpty(urlData.body)) {
			record.set('body', urlData.body);
			record.set('isHTML', false);
		}

		// Set recipients in the mail record
		var recipientRecords = [];

		var recipientTypes = {
			to : Zarafa.core.mapi.RecipientType.MAPI_TO,
			cc : Zarafa.core.mapi.RecipientType.MAPI_CC,
			bcc : Zarafa.core.mapi.RecipientType.MAPI_BCC
		};

		for (var key in recipientTypes) {
			if(!Ext.isEmpty(urlData[key])){
				var smtpAddresses = urlData[key].split(/[;,]/);
				for (var i=0; i<smtpAddresses.length; i++)
				{
					recipientRecords.push(Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
						display_name : smtpAddresses[i],
						smtp_address : smtpAddresses[i],
						address_type : 'SMTP',
						recipient_type : recipientTypes[key]
					}));
				}
			}
		}

		var recipientStore = record.getSubStore('recipients');
		recipientStore.add(recipientRecords);

		// Open record in contentpanel
		Zarafa.mail.Actions.openMailContent(record);
	}
});

Zarafa.mail.URLAction = new Zarafa.mail.URLAction();
