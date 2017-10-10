/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMAttachmentRecordFields
 *
 * Array of default fields for the {@link Zarafa.core.data.IPMAttachmentRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.core.data.IPMAttachmentRecord record}.
 *
 * @FIXME attach_num is used to identify attachment number in the attachments table, only for saved attachments
 * for temporary uploaded attachments (not yet saved in attachments table), we use random string with file name as attach_num
 */
Zarafa.core.data.IPMAttachmentRecordFields = [
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_ATTACH},
	{name: 'attach_num', type: 'int', defaultValue: -1},
	{name: 'attach_method', type: 'int', defaultValue: Zarafa.core.mapi.AttachMethod.NO_ATTACHMENT},
	{name: 'attach_message_class', type: 'string', defaultValue: 'IPM.Note'},
	{name: 'size', type: 'int', defaultValue: 0},
	{name: 'cid'},
	{name: 'filetype'},
	{name: 'hidden', type: 'boolean', defaultValue: false},
	{name: 'name', type: 'string', defaultValue: _('Untitled')},
	{name: 'tmpname'},

	{name: 'attachment_contactphoto', type: 'boolean', defaultValue: false},	// rename to contactphoto ???
	// @FIXME check do we need below properties ?
	{name: 'attachment_contactphoto_sizex', type: 'int'},	// rename to contactphoto_sizex ???
	{name: 'attachment_contactphoto_sizey', type: 'int'},	// rename to contactphoto_sizey ???

	// Properties that will only be used when opening embedded attachment from unsaved message
	{name : 'entryid'},
	{name : 'store_entryid'}
];

/**
 * @class Zarafa.core.data.IPMAttachmentRecord
 * @extends Ext.data.Record
 */
Zarafa.core.data.IPMAttachmentRecord = Ext.extend(Ext.data.Record, {
	/**
	 * Indicates whether it has been attempted to upload this record.
	 * @property
	 * @type Boolean
	 */
	uploadAttempted : false,

	/**
	 * Indicates this attachment is an inline image for an HTML mail
	 * @property
	 * @type private
	 */
	inline : false,

	/**
	 * Applies all data from an {@link Zarafa.core.data.IPMAttachmentRecord IPMAttachmentRecord}
	 * to this instance. This will update all data.
	 *
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The record to apply to this
	 * @return {Zarafa.core.data.IPMAttachmentRecord} this
	 */
	applyData : function(record)
	{
		this.beginEdit();

		Ext.apply(this.data, record.data);
		Ext.apply(this.modified, record.modified);

		this.inline = record.inline;
		this.uploadAttempted = record.uploadAttempted;
		this.dirty = record.dirty;

		this.endEdit(false);

		return this;
	},
	/**
	 * @param {Boolean} inline
	 */
	setInline : function(inline)
	{
		this.inline = inline;
	},

	/**
	 * @return {Boolean} True if this attachment is uploaded or otherwise
	 * present on the server
	 */
	isUploaded : function()
	{
		return !Ext.isEmpty(this.get('tmpname')) || (this.get('attach_num') > -1);
	},

	/**
	 * @return {Boolean} True if this attachment is a temporary file.
	 */
	isTmpFile : function()
	{
		return this.get('attach_num') <= -1;
	},

	/**
	 * @return {Boolean} True if the attachment is inline
	 */
	isInline : function()
	{
		return this.inline;
	},

	/**
	 * @return {Boolean} True if the attachment is hidden
	 */
	isHidden : function()
	{
		return this.get('hidden');
	},

	/**
	 * @return {Boolean} True if the attachment is an exception to a recurring appointment
	 */
	isRecurrenceException : function()
	{
		return this.isHidden() && Zarafa.core.MessageClass.isClass(this.get('attach_message_class'), 'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}');
	},

	/**
	 * @return {Boolean} True if the attachment is contact photo.
	 */
	isContactPhoto : function()
	{
		return this.get('attachment_contactphoto');
	},

	/**
	 * Checks if {@link Zarafa.core.data.IPMAttachmentRecord IPMAttachmentRecord} is embedded message
	 * @return {Boolean} true if attachment record is an embedded message
	 */
	isEmbeddedMessage : function()
	{
		return this.get('attach_method') === Zarafa.core.mapi.AttachMethod.ATTACH_EMBEDDED_MSG && !this.isRecurrenceException();
	},

	/**
	 * Builds and returns inline image URL to download inline images,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 * @return {String} URL for downloading inline images.
	 */
	getInlineImageUrl : function()
	{
		return this.store.getInlineImageUrl(this);
	},

	/**
	 * Builds and returns attachment URL to download attachment,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 * @return {String} URL for downloading attachment.
	 */
	getAttachmentUrl : function(allAsZip)
	{
		return this.store.getAttachmentUrl(this, allAsZip);
	},

	/**
	 * Returns attach_num proeprty of all the parents of this record.
	 * @param {Zarafa.core.data.IPMRecord} parentRecord parent record that holds this attachment
	 * @return {Array} attach_num of parent
	 */
	getParentAttachNum : function(parentRecord)
	{
		if(!parentRecord) {
			parentRecord = this.store.getParentRecord();
		}

		var attachNum = parentRecord.get('attach_num');

		// check if attachNum is not -1, because if it is then we are opening an embedded message from unsaved message
		// so we need to break chain after getting topmost parent object
		return !Ext.isEmpty(attachNum) && attachNum[0] !== -1 ? [].concat(attachNum) : [];
	},

	/**
	 * @return {Boolean} True if it was attempted to upload this attachment
	 */
	attemptedToUpload: function()
	{
		return this.uploadAttempted;
	},

	/**
	 * Convert this attachment into a {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @return {Zarafa.core.data.IPMRecord} The IPMRecord which is an embedded message as attachment.
	 */
	convertToIPMRecord : function()
	{
		var messageClass = this.get('attach_message_class');

		if(Ext.isEmpty(messageClass)) {
			// no messageclass then we can't do anything
			return;
		}

		if(!this.isTmpFile()) {
			// Embedded attachment is saved in message so use attach_num and entryids of parent record to open the record
			var parentRecord = this.store.getParentRecord();
			var parentAttachNum = [];

			// Don't go for attachNum property of parent in case the parent record is an exception of meeting request.
			// Because, exception of meeting request it self is an attachment.
			if(!Ext.isFunction(parentRecord.isRecurringException) || (Ext.isFunction(parentRecord.isRecurringException) && !parentRecord.isRecurringException())){
				parentAttachNum = this.getParentAttachNum(parentRecord);
			}

			// always pass attach_num as an array
			var attachNum = parentAttachNum.concat(this.get('attach_num'));
			var parentRecordEntryId = parentRecord.get('entryid');

			return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(messageClass, {
				message_class : messageClass,
				object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE,
				attach_num : attachNum,

				// pass entryids of parent record
				entryid : parentRecordEntryId,
				store_entryid : parentRecord.get('store_entryid')
			}, parentRecordEntryId + attachNum.join(''));
		} else {
			// Embedded attachment is not saved yet in message, so we can use entryids from the attachment record itself to open the message
			var originalRecordEntryId = this.get('entryid');
			// HACK ALERT!!!
			// parent message is not saved so attachment is also not saved so we don't have attach_num value yet
			// but its important to make sure that this message will be treated as sub message so add -1 as attach_num
			// (-1 will come from default value of field)
			var attachNum = [].concat(this.get('attach_num'));

			return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(messageClass, {
				message_class : messageClass,
				object_type : Zarafa.core.mapi.ObjectType.MAPI_MESSAGE,
				attach_num : attachNum,

				// pass entryids of original record from which this embedded attachment record has been made
				entryid : originalRecordEntryId,
				store_entryid : this.get('store_entryid')
			}, originalRecordEntryId + attachNum.join(''));
		}
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, Zarafa.core.data.IPMAttachmentRecord);
Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, Zarafa.core.data.IPMAttachmentRecordFields);
