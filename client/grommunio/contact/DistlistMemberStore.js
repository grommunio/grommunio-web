/*
 * We depend on DistlistMemberRecord rather the RecordCustomObjectType
 * as GROMMUNIO_DISTLIST_MEMBER is defined in DistlistMemberRecord.
 * #dependsFile client/grommunio/contact/DistlistMemberRecord.js
 */
Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.DistlistMemberStore
 * @extends Grommunio.core.data.MAPISubStore
 */
Grommunio.contact.DistlistMemberStore = Ext.extend(Grommunio.core.data.MAPISubStore, {
	/**
	 * @cfg {Grommunio.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Grommunio.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType: Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_DISTLIST_MEMBER,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// provide a default writer
			writer: new Grommunio.contact.data.JsonMemberWriter(),
			// provide a default reader
			reader: new Grommunio.contact.data.JsonMemberReader({
				customObjectType: config.customObjectType || this.customObjectType
			})
		});

		Grommunio.contact.DistlistMemberStore.superclass.constructor.call(this, config);
	},

	/**
	 * Parse a String into a {@link Grommunio.contact.DistlistMemberRecord}.
	 * @param {String} str The string to parse
	 * @return {Grommunio.contact.DistlistMemberRecord} The created member
	 */
	parseMember: function(str)
	{
		var member = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(this.customObjectType);
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
			if (!Grommunio.core.Util.validateEmailAddress(str)) {
				member.set('email_address', '');
			} else {
				member.set('email_address', str);
			}
		}

		member.set('address_type', 'SMTP');
		member.set('distlist_type', Grommunio.core.mapi.DistlistType.DL_EXTERNAL_MEMBER);

		member.endEdit();

		return member;
	}
});
