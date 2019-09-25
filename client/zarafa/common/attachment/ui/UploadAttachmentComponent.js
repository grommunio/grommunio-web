Ext.namespace('Zarafa.common.attachment.ui');
/**
 * @class Zarafa.common.attachment.ui.UploadAttachmentComponent
 * @extends Ext.Component
 * @xtype zarafa.uploadattachmentcomponent
 */
Zarafa.common.attachment.ui.UploadAttachmentComponent = Ext.extend(Ext.Component, {
	/**
	 * @cfg {Function} callback The callback function which must be called when the
	 * file has be selected from Browser's file selection dialog.
	 */
	callback : Ext.emptyFn,

	/**
	 * @cfg {Object} scope The scope for the {@link #callback} function
	 */
	scope : undefined,

	/**
	 * @cfg {Boolean} multiple The multiple true to allow upload multiple files
	 * else allow single file only. by default it is false.
	 */
	multiple : false,

	/**
	 * @cfg {String} accept the accept define which type of files allow to
	 * show in Browser's file selection dialog. i.e image/* to allow all type of images.
	 */
	accept : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config,{
			xtype : 'zarafa.uploadattachmentcomponent'
		});

		Zarafa.common.attachment.ui.UploadAttachmentComponent.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for opening the Browser's file selection dialog.
	 * See {@link #onFileInputChange} for the handling of the selected files.
	 * @private
	 */
	openAttachmentDialog : function()
	{
		var attachEl = this.getAttachmentEl();

		// Register the change event handler
		// so we detect when the user selects a file.
		attachEl.on('change', this.onFileInputChange, this);

		// Mimick clicking on the <input> field
		// to open the File Selection dialog.
		attachEl.dom.click();
	},

	/**
	 * Obtain or instantiate the {@link Ext.Element attachment} &lt;input&gt; element used
	 * for opening the File selection dialog.
	 * @return {Ext.Element} The file input element
	 * @private
	 */
	getAttachmentEl : function()
	{
		var attachEl = Ext.DomHelper.append(Ext.getBody(), {
			cls : 'x-hidden',
			tag : 'input',
			type : 'file'
		});

		if(Ext.isDefined(this.multiple) && this.multiple) {
			attachEl.multiple = this.multiple;
		}

		if(Ext.isDefined(this.accept)) {
			attachEl.accept = this.accept;
		}

		attachEl = Ext.get(attachEl);
		return attachEl;
	},

	/**
	 * Event handler which is fired when the {@link #attachEl} has been changed.
	 * @param {Ext.EventObject} event The event
	 * @private
	 */
	onFileInputChange : function(event)
	{
		var browserEvent = event.browserEvent;
		var attachEl = Ext.get(browserEvent.target);
		var transfer = browserEvent.dataTransfer;
		var transferFile = transfer ? transfer.files : undefined;
		var files = attachEl.dom.files || transferFile;
		var record = this.scope.record;
		var store = Ext.isDefined(record) ? record.getAttachmentStore() : undefined;

		// If the record is not defined assume that this is the case of importing eml via upload
		if(!Ext.isDefined(record) || (Ext.isDefined(store) && store.canUploadFiles(files))) {
			if(this.accept === 'image/*') {
				var fileType = files[0].type;
				if (this.isSupportedImage(fileType)) {
					this.callback.call(this.scope, files);
				} else {
					this.showAttachmentError();
				}
			} else {
				this.callback.call(this.scope, files);
			}
		}

		// remove attachment element.
		attachEl.remove();
	},

	/**
	 * Function shows the attachment error message when picture formate is not supported by webapp 
	 */
	showAttachmentError : function()
	{
		var message = _('Picture format is not supported. ');
		message += _('Supported format for contact pictures are');
		message += '<br/>';
		message += 'JPEG, GIF, PNG, BMP';
		Ext.MessageBox.show({
			title: _('Attachment Error'),
			msg : message,
			icon: Ext.MessageBox.ERROR,
			buttons: Ext.MessageBox.OK
		});
	},

	/**
	 * Function check that selected file is supported image or not.
	 * @param {String} fileType the fileType is defined the mime type of selected file.
	 * @return {Boolean} return true if selected picture is supported by webapp else false.
	 */
	isSupportedImage : function(fileType)
	{
		var mimeType = ['image/bmp','image/jpg','image/jpeg','image/gif','image/png'];
		return mimeType.indexOf(fileType.toLowerCase()) >= 0;
	}
});

Ext.reg('zarafa.uploadattachmentcomponent', Zarafa.common.attachment.ui.AttachmentButton);
