Ext.namespace('Zarafa.common.attachment.ui');
/**
 * @class Zarafa.common.attachment.ui.AttachmentDownloader
 * @extends Ext.Component
 * @xtype zarafa.attachmentdownloader
 *
 * Independent component to encapsulate process of downloading attachments,
 * this is achieved by use of hidden iframe, in which we will set url of the
 * attachment that needs to be downloaded. The file pointed by url should
 * return attachment data with content disposition type as attachment, so
 * browser will show a dialog to open/save attachment, but if the server side
 * needs to send an error then make sure it returns it with content disposition
 * type as inline, so that iframe's onload event will be fired and proper error
 * message will be displayed to user.
 */
Zarafa.common.attachment.ui.AttachmentDownloader = Ext.extend(Ext.Component, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.attachmentdownloader',
			renderTo : Ext.getBody(),
			hidden : true,
			autoEl: {
				tag: 'iframe',
				src: Ext.SSL_SECURE_URL
			}
		});

		Zarafa.common.attachment.ui.AttachmentDownloader.superclass.constructor.call(this, config);

		//Register a listener to onload event of iframe, but please take a note that
		//the 'load' event is fired only if content disposition type is configured as 'inline'.
		Ext.EventManager.on(this.getEl(), 'load', this.onIframeLoad, this);
	},

	/**
	 * Will get iframe element and set its src property to the supplied url.
	 * After successfull response, iframe will pops up and ask user to start/cancel
	 * downloading of that particular message/attachment as file.
	 * @param {String} url The url to download message/attachment, containing necessary parameters.
	 */
	downloadItem : function(url)
	{
		var iframeElement = Ext.getDom(this.getEl());

		//setting iframe's location to the download url
		iframeElement.src = url;
	},

	/**
	 * Function prepares necessary HTML structure to send post request containing
	 * entryids of all the selected messages needs to be downloaded as eml in ZIP.
	 * Will get iframe element and create a form element dynamically.
	 * Create input elements for every entryid we need to send into post request,
	 * and append those dynamically created input elements into form.
	 * 
	 * @param {Zarafa.core.data.IPMRecord} records The records which user want to save in eml format as ZIP.
	 */
	downloadMessageAsZip : function(records)
	{
		// Get the total size of all the messages which is requested to be included in ZIP
		var totalSize = 0;
		Ext.each(records, function(record) {
			totalSize += record.get('message_size');
		}, this);

		// Check if total size of eml is more than 30 MB, avoid ZIP creation as the request will
		// be timed out by the time while preparing eml for next message and there is no
		// technical provision to detect request-time-out exception.
		// 31457280 byte is equivalent to 30MB.
		if (totalSize < 31457280) {
			var url = records[0].getDownloadMessageUrl(true);

			var iframeBody = Ext.getDom(this.getEl()).contentDocument.body;
			var form = Ext.DomHelper.append( iframeBody || Ext.getBody(), {tag : 'form', action : url, method : 'POST'}, true);

			// Create and append input elements containing entryid as its value
			for (var i = 0; i < records.length; i++) {
				Ext.DomHelper.append(form, {tag : 'input', type : 'hidden', name : 'entryids[]', value : records[i].get('entryid')});
			}

			// Submit the form to send a POST request
			form.dom.submit();
		} else {
			container.getNotifier().notify(
				'error.attachment',
				_('Attachment error'),
				_('Cannot create ZIP, The allowed maximum size is 30 MB.')
			);
			return;
		}
	},

	/**
	 * Handler for the 'load' event of iframe, fired immediately after iframe is loaded.
	 * The exception response is received in json format, so we are using {@link Ext.util.JSON#decode}
	 * to decode (parse) a JSON string to an object.
	 * @private
	 */
	onIframeLoad : function()
	{
		var contentDocument;
		var responseText;

		contentDocument = this.getEl().dom.contentDocument;

		if (!Ext.isEmpty(contentDocument)) {
			responseText = contentDocument.body.textContent;
		}

		if (!Ext.isEmpty(responseText)) {
			var responseObject = Ext.util.JSON.decode(responseText);
			this.displaySaveEmailException(responseObject);
		}
	},

	/**
	 * Raise a warning dialog to inform user that there is some embedded attachments which can not be included in ZIP.
	 * otherwise continue with creating ZIP for normal attachments.
	 * 
	 * @param {Zarafa.core.data.IPMAttachmentRecord} records The record of the file to be downloaded
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 */
	checkForEmbeddedAttachments : function(record, allAsZip)
	{
		var containsEmbedded = false;
		var attachmentStore = record.store;

		// We need all this additional checking only when we are going to download attachments as ZIP, skip otherwise.
		if(allAsZip) {
			// If user already made his/her decision to not show this warning again then it is there is state setting, just act accordingly.
			var dontShowWarning = container.getSettingsModel().get('zarafa/v1/state/dialogs/mixattachitemcontentpanel/dontshowagain');

			// Check if there is any embedded attachments only when user want this warning to be raised
			// and there is more than one attachments.
			if(!dontShowWarning && attachmentStore.getCount() > 1) {
				attachmentStore.each(function(record){
					if(record.isEmbeddedMessage()){
						containsEmbedded = true;
						return false;
					}
				});
			}
		}

		// Embedded attachment(s) found, raise warning dialog
		if(containsEmbedded) {
			this.openMixAttachmentsDialog(attachmentStore.getRange(), {'allAsZip' : allAsZip});
		} else {
			this.downloadItem(record.getAttachmentUrl(allAsZip));
		}
	},

	/**
	 * Opens a {@link Zarafa.common.attachment.dialogs.MixAttachItemContentPanel MixAttachItemContentPanel} for informing
	 * user that there is some embedded attachments are requested to be included in ZIP, which is not possible.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the attachments are 
	 * requested to be downloaded as ZIP
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openMixAttachmentsDialog : function(records, config)
	{
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		config = Ext.applyIf(config || {}, {
			modal : true,
			downloadItem : this.downloadItem.createDelegate(this, [ records[0].getAttachmentUrl(config.allAsZip) ], 1)
		});

		var componentType = Zarafa.core.data.SharedComponentType['common.attachment.dialog.mixattachitem'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * It displays proper message to user, as per the exception received
	 * while unsuccessful download.
	 * @param {Object} responseObject Object contained the exception details.
	 * @private
	 */
	displaySaveEmailException : function(responseObject)
	{
		Ext.MessageBox.show({
			title : _('Kopano WebApp'),
			msg : responseObject.zarafa.error.info.display_message,
			icon: Ext.MessageBox.ERROR,
			buttons : Ext.MessageBox.OK
		});
	}
});
Ext.reg('zarafa.attachmentdownloader', Zarafa.common.attachment.ui.AttachmentDownloader);
