Ext.namespace('Zarafa.common.attachment.ui');

/**
 * @class Zarafa.common.attachment.ui.AttachmentBox
 * @extends Zarafa.common.ui.Box
 * @xtype zarafa.attachmentbox
 *
 * Extension to the normal {@link Zarafa.common.ui.Box} which must be used
 * together with the {@link Zarafa.common.attachment.ui.AttachmentField AttachmentField}.
 * This box offers some extra functionality concerning the displaying of attachments.
 */
Zarafa.common.attachment.ui.AttachmentBox = Ext.extend(Zarafa.common.ui.Box, {

	/**
	 * @cfg {String} validCls The CSS class which must be applied on {@link #el}
	 * when the attachment has been {@link #isValidRecord uploaded} or is
	 * otherwise present on the server.
	 */
	validCls : 'x-zarafa-boxfield-attachment-item-uploaded',

	/**
	 * @cfg {String} invalidCls The CSS class which must be applied on {@link #el}
	 * when the attachment has not been {@link #isValidRecord uploaded} and the
	 * attempt to upload the file has failed.
	 */
	invalidCls : 'x-zarafa-boxfield-attachment-item-invalid',

	/**
	 * @cfg {String} uploadingCls The CSS class which must be applied on {@link #el}
	 * when the attachment has not yet been uploaded to the server.
	 */
	uploadingCls : 'x-zarafa-boxfield-attachment-item-uploading',

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'x-zarafa-boxfield-attachment-item',
			ellipsisStringStartLength : 20,
			ellipsisStringEndLength : 20,
			textTpl :
				'<tpl if="!Ext.isEmpty(values.name)">' +
					'{name:htmlEncodeElide(this.ellipsisStringStartLength, this.ellipsisStringEndLength)}' +
				'</tpl>' +
				'<tpl if="!Ext.isEmpty(values.size) && values.size &gt; 0">' +
					'&nbsp;({values.size:fileSize})' +
				'</tpl>'
		});

		Zarafa.common.attachment.ui.AttachmentBox.superclass.constructor.call(this, config);
	},

	/**
	 * Check if the given {@link Ext.data.Record record} is valid. This function can be
	 * overridden by the childclasses to indicate if the given record is valid.
	 *
	 * This class will check if the given record is {@link Zarafa.core.data.IPMAttachmentRecord#isUploaded uploaded},
	 * or otherwise present on the server.
	 *
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The record to check
	 * @return {Boolean} True if the record is valid
	 * @protected
	 */
	isValidRecord : function(record)
	{
		return record.isUploaded();
	},

	/**
	 * Update the {@link #textEl inner HTML} of this component using the {@link #textTpl template}.
	 * @param {Ext.data.Record} record The Ext.data.Record which data must be applied to the template
	 */
	update : function(record)
	{
		Zarafa.common.attachment.ui.AttachmentBox.superclass.update.apply(this, arguments);

		if (this.isValidRecord(record)) {
			this.el.removeClass(this.uploadingCls);
			this.el.removeClass(this.invalidCls);
			this.el.addClass(this.validCls);
		} else if (record.attemptedToUpload()) {
			this.el.removeClass(this.uploadingCls);
			this.el.addClass(this.invalidCls);
			this.el.removeClass(this.validCls);
		} else {
			this.el.addClass(this.uploadingCls);
			this.el.removeClass(this.invalidCls);
			this.el.removeClass(this.validCls);
		}
	}
});

Ext.reg('zarafa.attachmentbox', Zarafa.common.attachment.ui.AttachmentBox);
