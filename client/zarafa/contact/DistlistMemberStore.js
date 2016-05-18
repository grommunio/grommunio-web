/*
 * We depend on DistlistMemberRecord rather the RecordCustomObjectType
 * as ZARAFA_DISTLIST_MEMBER is defined in DistlistMemberRecord.
 * #dependsFile client/zarafa/contact/DistlistMemberRecord.js
 */
Ext.namespace('Zarafa.contact');

/**
 * @class Zarafa.contact.DistlistMemberStore
 * @extends Zarafa.core.data.MAPISubStore
 */
Zarafa.contact.DistlistMemberStore = Ext.extend(Zarafa.core.data.MAPISubStore, {
	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// provide a default writer
			writer : new Zarafa.contact.data.JsonMemberWriter(),
			// provide a default reader
			reader : new Zarafa.contact.data.JsonMemberReader({
				customObjectType : config.customObjectType || this.customObjectType	
			})
		});

		Zarafa.contact.DistlistMemberStore.superclass.constructor.call(this, config);
	},

	/**
	 * Parse a String into a {@link Zarafa.contact.DistlistMemberRecord}.
	 * @param {String} str The string to parse
	 * @return {Zarafa.contact.DistlistMemberRecord} The created member
	 */
	parseMember : function(str)
	{
		var member = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(this.customObjectType);
		var mailStart = str.indexOf('<');
		var mailEnd = str.indexOf('>');

		if ((mailStart != -1 && mailEnd == -1) || (mailStart == -1 && mailEnd != -1)) {
			return null;
		}

		member.beginEdit();

		if (mailStart != -1) {
			member.set('display_name', str.substring(0, mailStart-1).trim());
			member.set('email_address', str.substring(mailStart + 1, mailEnd).trim());
		} else {
			member.set('display_name', str);

			/* The string may be just a user@domain.com, if so then we can already fill in the SMTP address */
			if (!Zarafa.core.Util.validateEmailAddress(str)) {
				member.set('email_address', '');
			} else {
				member.set('email_address', str);
			}
		}

		member.set('address_type', 'SMTP');
		member.set('distlist_type', Zarafa.core.mapi.DistlistType.DL_EXTERNAL_MEMBER);

		member.endEdit();

		return member;
	}
});
