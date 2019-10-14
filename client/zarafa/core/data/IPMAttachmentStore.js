Ext.namespace('Zarafa.core.data');
/**
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 */

/**
 * @class Zarafa.core.data.IPMAttachmentStore
 * @extends Zarafa.core.data.MAPISubStore
 */
Zarafa.core.data.IPMAttachmentStore = Ext.extend(Zarafa.core.data.MAPISubStore, {
	/**
	 * @cfg {String} id ID to communicate with the server for the location of the cached attachments.
	 */
	id : null,

	/**
	 * @cfg {Zarafa.core.ObjectType} attachmentRecordType to create a custom {Zarafa.core.data.IPMAttachmentRecord}
	 */
	attachmentRecordType : Zarafa.core.mapi.ObjectType.MAPI_ATTACH,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			id : Zarafa.generateId(32),
			// provide a default proxy
			proxy : new Zarafa.core.data.IPMAttachmentProxy({
				listModuleName : 'attachments',
				itemModuleName : 'attachments'
			}),
			// provide a default writer
			writer : new Zarafa.core.data.JsonAttachmentWriter(),
			// provide a default reader
			reader : new Zarafa.core.data.JsonAttachmentReader({}, Zarafa.core.data.RecordFactory.getRecordClassByCustomType(this.attachmentRecordType))
		});

		Zarafa.core.data.IPMAttachmentStore.superclass.constructor.call(this, config);

		// Update the 'hasattach' property whenever the store changes
		this.on({
			'update' : this.onAttachmentsChange,
			'add' : this.onAttachmentsChange,
			'remove' : this.onAttachmentsChange,
			'datachanged' : this.onAttachmentsChange,
			'scope' : this
		});

		// add the custom events of the Attachmentstore to the EventDispatcher
		Zarafa.core.data.ZarafaCustomEventDispatcher.addEvents(
			'attachmentstorebeforecheck',
			'attachmentstorebeforeupload',
			'attachmentstorebeforedestroyrecord',
			'attachmentstorebeforegetbaseurl'
		);
	},

	/**
	 * Event handler which is fired when data in this store has changed.
	 *
	 * This will update hasattach property of parentrecord
	 * If there are any attachments in store then,
	 * it will set hasattach property of record to true,
	 * otherwise it will set it to false.
	 *
	 * @param {Store} store
	 * @param {Ext.data.Record/Ext.data.Record[]} record
	 * @param {Number} index
	 * @private
	 */
	onAttachmentsChange : function()
	{
		if(this.getParentRecord()){
			if(this.getCount() > 0) {
				this.getParentRecord().set('hasattach', true);
			} else {
				this.getParentRecord().set('hasattach', false);
			}
		}
	},

	/**
	 * Obtain the ID to communicate with the
	 * server for the location of cached attachments
	 * @return {String} The ID of the server attachment location
	 */
	getId : function()
	{
		return this.id;
	},

	/**
	 * Set the ID to communicate with the server
	 * for the location of cached attachments
	 * @param {String} id The ID of the server attachment location
	 */
	setId : function(id)
	{
		this.id = id;
	},

	/**
	 * Builds and returns inline image URL to download inline images,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} attachmentRecord Attachment record.
	 * @return {String} URL for downloading inline images.
	 */
	getInlineImageUrl : function(attachmentRecord)
	{
		var url = this.getDownloadAttachmentUrl(attachmentRecord);
		return Ext.urlAppend(url, 'contentDispositionType=inline');
	},

	/**
	 * Builds and returns attachment URL to download attachment,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} attachmentRecord Attachment record.
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 * @return {String} URL for downloading attachment.
	 */
	getAttachmentUrl : function(attachmentRecord, allAsZip)
	{
		var url = this.getDownloadAttachmentUrl(attachmentRecord, allAsZip);
		return Ext.urlAppend(url, 'contentDispositionType=attachment');
	},

	/**
	 * Builds and returns attachment URL to download inline images/attachments,
	 * it uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} attachmentRecord Attachment record.
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 * @return {String} URL for downloading attachments.
	 */
	getDownloadAttachmentUrl : function(attachmentRecord, allAsZip)
	{
		var parentRecord = this.getParentRecord();
		var isSubMessage = parentRecord.isSubMessage();

		var url = this.getAttachmentBaseUrl();
		url = Ext.urlAppend(url, 'load=download_attachment');

		// If all the attachments are requested to be downloaded in a ZIP, then there is no need to
		// send 'attach_num' property.
		if(!allAsZip || (allAsZip && isSubMessage)){

			var attachNum = [];
			// Don't go for attachNum property of parent in case the parent record is an exception of meeting request.
			// Because, exception of meeting request it self is an attachment.
			if(!Ext.isFunction(parentRecord.isRecurringException) || (Ext.isFunction(parentRecord.isRecurringException) && !parentRecord.isRecurringException())) {
				attachNum = attachmentRecord.getParentAttachNum(parentRecord);
			}

			if (attachmentRecord.get('attach_num') != -1) {
				// add attachment number of parent sub messages
				attachNum.push(attachmentRecord.get('attach_num'));

				for(var index = 0, len = attachNum.length; index < len; index++) {
					url = Ext.urlAppend(url, 'attachNum[]=' + attachNum[index]);
				}
			} else {
				url = Ext.urlAppend(url, 'attachNum[]=' + attachmentRecord.get('tmpname'));
			}
		}

		if(allAsZip) {
			url = Ext.urlAppend(url, 'AllAsZip=true');
			if(isSubMessage){
				url = Ext.urlAppend(url, 'isSubMessage=true');
			}
			url = Ext.urlAppend(url, 'subject='+parentRecord.get('subject'));
		}

		// fire the 'attachmentstorebeforegetbaseurl' event.
		var eventData = {
			url: url
		};
		Zarafa.core.data.ZarafaCustomEventDispatcher.fireEvent('attachmentstorebeforegetbaseurl', this, attachmentRecord, allAsZip, eventData);

		return eventData.url;
	},

	/**
	 * Function returns parent/source record entryid and store entryid for the attachment.
	 * If parent record has an entryid then return that entryid and respective store entryid.
	 * For phantom records i.e. forward mail, parent record won't have entryid so get
	 * source_entryid and source_store_entryid from record's message action data and return it.
	 * @return {Object} The object which container parent/source message entry id and store entryid.
	 * @private
	 */
	getAttachmentParentRecordIds : function()
	{
		var parentRecord = this.getParentRecord();
		var entryID = parentRecord.get('entryid') || '';
		var storeEntryId =  parentRecord.get('store_entryid') || '';
		var messageAction = parentRecord.getMessageActions();

		if (Ext.isEmpty(entryID) && messageAction) {
			switch(messageAction.action_type) {
				case 'forward':
				case 'edit_as_new':
					entryID = messageAction.source_entryid;
					storeEntryId = messageAction.source_store_entryid;
					break;
				case 'reply':
				case 'replyall':
				// @TODO: Need to check for inline images, whether we
				// should pass entryid or any need in future.
			}
		}

		return {
			'entryid' : entryID,
			'store_entryid' : storeEntryId
		};
	},

	/**
	 * Function returns parent record entry id for the attachment.
	 * @return {String} entryid parent record entryid.
	 * @private
	 */
	getAttachmentParentRecordEntryId : function()
	{
		// Function is used by the Files plugin.
		return this.getAttachmentParentRecordIds().entryid;
	},

	/**
	 * Builds and returns base attachment URL.
	 * @return {String} URL for attachments
	 * @private
	 */
	getAttachmentBaseUrl : function()
	{
		var url = container.getBaseURL();
		var source = this.getAttachmentParentRecordIds();
		url = Ext.urlAppend(url, 'store=' + source.store_entryid);
		url = Ext.urlAppend(url, 'entryid=' + source.entryid);
		url = Ext.urlAppend(url, 'dialog_attachments=' + this.getId());
		return url;
	},

	/**
	 * Builds and returns attachment URL to upload files.
	 * @return {String} URL for uploading attachments
	 * @private
	 */
	getUploadAttachmentUrl : function()
	{
		return Ext.urlAppend(this.getAttachmentBaseUrl(), 'load=upload_attachment');
	},

	/**
	 * Builds and returns attachment-URL to import attachments.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} attachmentRecord The attachment to import into given folder
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 * @return {String} URL for importing attachments to respective folder
	 * @private
	 */
	getImportAttachmentUrl : function(attachmentRecord, folder)
	{
		var url = this.getDownloadAttachmentUrl(attachmentRecord);
		var isEmbedded = attachmentRecord.isEmbeddedMessage();
		url = Ext.urlAppend(url, 'import=true');
		url = Ext.urlAppend(url, 'destination_folder=' + folder.get('entryid'));

		if (isEmbedded) {
			url = Ext.urlAppend(url, 'is_embedded=' + isEmbedded);
		}

		return url;
	},

	/**
	 * Check if the given files can be added to this store, this is
	 * only possible when none of the limits from the {@link Zarafa.core.data.ServerConfig ServerConfig}
	 * configuration have been exceeded.
	 *
	 * @param {FileList|Array} files The array of Files objects from the file input field.
	 * @param {Object} options (optional) Additional parameters for the call to
	 * {@link Zarafa.core.ui.notifier.Notifier#notify} if one of the limits was
	 * exceeded.
	 * @return {Boolean} True if the files can be uploaded, false otherwise
	 * @private
	 */
	canUploadFiles : function(files, options)
	{
		// If there are no files we can exit. Ext.isEmpty()
		// checks if files is null or undefined. If files is
		// a FileList, then Ext.isEmpty() will not perform
		// a proper check for the length of the list.
		if (Ext.isEmpty(files) || files.length === 0) {
			return false;
		}

		// fire the 'beforeuploadcheck' event.
		var eventData = {
			handledfiles: [],
			checkfailed: false
		};
		Zarafa.core.data.ZarafaCustomEventDispatcher.fireEvent('attachmentstorebeforecheck', this, files, options, eventData);

		// do a fast check if one of the plugins failed checking the files
		// error handling (notifying the used for example is handled by the plugin)
		if(eventData.checkfailed) {
			return false;
		}

		var server = container.getServerConfig();
		// Maximum number of attachments that can be uploaded in message.
		var max_attachments = server.getMaxAttachments();
		// Maximum size of single file that can be uploaded in message.
		var max_attachment_size = server.getMaxAttachmentSize();
		// Maximum size of attachments that can be uploaded in message.
		var max_attachment_total_size = server.getMaxAttachmentTotalSize();

		/**
		 * Here all three checks are regarding maximum upload attachments in message.
		 *
		 * first check is check's that maximum number of attachments are possible to attach in single message.
		 * by default there is no limit for number of attachments in message.
		 *
		 * second check is check's that each attachment should not be more than 30 MB size.
		 *
		 * third check is check's that total maximum attachment size in single message.
		 * by default there is no limit for maximum attachments in message.
		 */
		// 1) Check for the total number of attachments
		if (Ext.isDefined(max_attachments)) {
			if ((this.getCount() + files.length - eventData.handledfiles.length) >= max_attachments) {
				container.getNotifier().notify('error.attachment', _('Attachment error'),
					String.format(_('Cannot upload attachment, only {0} attachments are allowed to be added to the message'), max_attachments),
					options);
				return false;
			}
		}

		// total Post request size in single request.
		var totalPostSize = 0;
		var totalSize = this.sum('size');

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var fileSize = file.fileSize || file.size;

			// check if file was already handled by any other plugin
			if(eventData.handledfiles.indexOf(file) !== -1) {
				continue; // skip already handled files
			}

			// Update totalPostSize
			totalPostSize += fileSize;

			// Update totalSize
			totalSize += fileSize;

			// 2) Check if the size exceeds the maximum upload size
			if (Ext.isDefined(max_attachment_size)) {
				if (fileSize > max_attachment_size) {
					container.getNotifier().notify('error.attachment', _('Attachment error'),
						String.format(_('Cannot upload attachment, attachment is {0} while the allowed maximum is {1}.'),
							Ext.util.Format.fileSize(fileSize), Ext.util.Format.fileSize(max_attachment_size)),
						options);
					return false;
				}
			}
		}

		// 3) Check if the size exceeds the total maximum attachment size
		if (Ext.isDefined(max_attachment_total_size)) {
			if (totalSize > max_attachment_total_size) {
				container.getNotifier().notify('error.attachment', _('Attachment error'),
					String.format(_('Cannot upload attachment, the total attachment size is {0} while the allowed maximum is {1}'),
						Ext.util.Format.fileSize(totalSize), Ext.util.Format.fileSize(max_attachment_total_size)),
					options);
				return false;
			}
		}

		// Maximum number of files that can be uploaded in a single request.
		var max_file_uploads = server.getMaxFileUploads();
		// Maximum size of post request that can be send in a single request.
		var max_post_size = server.getMaxPostRequestSize();

		/**
		 * Here both the checks are for post request size in single message,
		 *
		 * first check is check that user can not
		 * able to send post request more then 31 MB size in single request.
		 * max_post_size has default configuration in php ini(Apache) settings.
		 *
		 * second check is check that user can not able to send post request
		 * more then 20 files in single request. max_file_uploads has default
		 * configuration in php ini (Apache) settings.
		 */
		// 1) Check if the size exceeds the maximum post size.
		if(Ext.isDefined(max_post_size)) {
			if (totalPostSize > max_post_size) {
				container.getNotifier().notify('error.attachment', _('Attachment error'),
					String.format(_('Cannot upload attachment, total attachment is {0} while the allowed maximum attachment in single request is {1}.'),
						Ext.util.Format.fileSize(totalPostSize), Ext.util.Format.fileSize(max_post_size)),
					options);
				return false;
			}
		}

		var totalFilesUploads = files.length;
		// 2) check if the maximum file uploads in single request.
		if(Ext.isDefined(max_file_uploads)) {
			if (totalFilesUploads > max_file_uploads) {
				container.getNotifier().notify('error.attachment', _('Attachment error'),
					String.format(_('Cannot upload attachment, total attachments are {0} files while the maximum {1} files are allowed in single request.'),
						totalFilesUploads , max_file_uploads),
					options);
				return false;
			}
		}

		return true;
	},

	/**
	 * Upload the given files to the server, this will generate new
	 * {@link Zarafa.core.data.IPMAttachmentRecord attachment records} and
	 * add those to the store.
	 * @param {FileList/String} files The array of file objects to upload
	 * @param {Ext.form.BasicForm} form (optional) If only filenames were provided in files
	 * argument, then this form must be the form which contains all file input elements
	 * @param {Boolean} isHidden if isHidden is true it will hide the attachments.
	 * @param {Object} params (optional) the params which contains source type of the attachment,
	 * i.e 'contactphoto', 'embedded' attachment or file attachment 'default'
	 */
	uploadFiles : function(files, form, isHidden, params)
	{
		var attachments = [];
		var uploadFiles = [];

		// For a proper instance check demanded by some of the browser, we must have to
		// use relevant FileList object which belongs to respective browser window.
		var activeBrowserWindow = Zarafa.core.BrowserWindowMgr.getActive() || window;
		var isFileList = files instanceof activeBrowserWindow.FileList;

		// fire the 'attachmentstorebeforeupload' event.
		// the eventhandler can not directly remove the handled files from the "files" FileList as this property is read
		// only. So we have to check the eventData for handled files.
		var eventData = {
			handledfiles: []
		};
		Zarafa.core.data.ZarafaCustomEventDispatcher.fireEvent('attachmentstorebeforeupload', this, files, form, isHidden, params, eventData);

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var originalName = file.name;

			if (!(Ext.isIE || Ext.isEdge)) {
				file = this.cloneFile(file);
			}

			// check if file was already handled by any other plugin
			if(eventData.handledfiles.indexOf(file) !== -1) {
				continue; // skip already handled files
			}

			var attach;
			if (isFileList) {
				// add the file to the upload parameters
				uploadFiles.push(file);

				// Create an attachment record, with all the passed data, use record factory so default values will be applied
				attach = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(this.attachmentRecordType, {
					'name' : originalName,
					'size' : file['size'],
					'filetype' : file['type'],
					'hidden' : Ext.isDefined(isHidden) ? isHidden : false,
					'attach_method' : Zarafa.core.mapi.AttachMethod.ATTACH_BY_VALUE,
					'attach_id' : file['attach_id']
				});
			} else {
				// If the file is a String, it is the file name including a fake path
				// ('C:\fakepath\<filename>') which must be stripped of its silly path.
				attach = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(this.attachmentRecordType, {
					'name' : Ext.util.Format.basename(file),
					'hidden' : Ext.isDefined(isHidden) ? isHidden : false
				});
			}

			attach.file = file;

			attachments.push(attach);
		}

		// Add it to the store
		this.add(attachments);

		// Prepare the upload
		var data = {};

		// Add source type if attachment record is contact photo.
		data = Ext.apply(data, params);

		// If we received a FileList we can should provide
		// the files into the data so it can be added to the request.
		// Otherwise we expect the form object to hold the files.
		if (isFileList) {
			data['attachments'] = uploadFiles;
		}

		var options = {
			'params' : data,
			'requestUrl' : this.getUploadAttachmentUrl(),
			'requestForm' : form
		};

		if (this.batch) {
			this.addToBatch(++this.batchCounter);
		}

		// if the user has only uploaded files that where handled by external plugins then this array is empty
		if(attachments.length > 0) {
			var action = Ext.data.Api.actions['create'];
			var callback = this.createCallback(action, attachments, false);
			this.proxy.request(action, attachments, options.params, this.reader, callback, this, options);
		}
	},

	/**
	 * Clone given file to postfix an eight digit unique id to filename.
	 * This particular unique id will then extracted on server side and act as attach_id for unsaved attachments.
	 * @param {File} record File which needs to be cloned to pass uid postfixed to filename
	 * @return {File} Cloned file.
	 */
	cloneFile : function(file)
	{
		var postfixId = Zarafa.generateId(8);
		// create a Blob object from existing file
		var blob = [file.slice(0, file.size, file.type)];
		var postfixedName = file.name + postfixId;
		var clonedFile = new File(blob, postfixedName, {type : file.type});
		clonedFile.attach_id = postfixId;

		return clonedFile;
	},


	/**
	 * Wrapper function which call either {@link #addIcsAsAttachment} or {@link #addEmbeddedAttachment}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which needs to be added as an attachment into store.
	 * @param {Object} config (optional) The configuration object
	 */
	addAsAttachment : function(record, config)
	{
		var data = [];
		if(Ext.isDefined(config) && config.attachAsIcs) {
			data = this.addIcsAsAttachment(record);
		} else {
			data = this.addEmbeddedAttachment(record);
		}

		// Create an attachment record, with all the passed data, use record factory so default values will be applied
		var attach = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, data);

		// Add it to the store
		this.add(attach);

		var options = {
			'params' : attach.data,
			'requestUrl' : this.getUploadAttachmentUrl()
		};

		var action = Ext.data.Api.actions['create'];
		var callback = this.createCallback(action, attach, false);
		this.proxy.request(action, attach, options.params, this.reader, callback, this, options);
	},

	/**
	 * Add given {@link Zarafa.core.data.IPMRecord IPMRecord} as embedded attachment to
	 * {@link Zarafa.core.data.IPMAttachmentStore IPMAttachmentStore}, this will generate new
	 * {@link Zarafa.core.data.IPMAttachmentRecord attachment record} and add those to the store and
	 * will send request to server to save ics attachment info to state file.
	 * @param {Zarafa.core.data.IPMRecord} record The record which needs to be added as ics attachment into store.
	 *
	 * @return data object which is used to create attachment record.
	 */
	addIcsAsAttachment : function(record)
	{
		var data = {
			'entryid' : record.get('entryid'),
			'store_entryid' : record.get('store_entryid'),
			// attach method to indicate this is an embedded attachment
			'attach_method' : Zarafa.core.mapi.AttachMethod.ATTACH_BY_VALUE,
			'attach_id' : Zarafa.generateId(8)
		};

		// Some optional data which should be present only if it is not empty
		if(!Ext.isEmpty(record.get('subject'))) {
			data['name'] = record.get('subject') + ".ics";
		}

		data['extension'] = "ics";

		if(!Ext.isEmpty(record.get('message_class'))) {
			data['attach_message_class'] = record.get('message_class');
		}

		if(!Ext.isEmpty(record.get('message_size'))) {
			data['size'] = record.get('message_size');
		}

		return data;
	},

 	/**
	 * Add given {@link Zarafa.core.data.IPMRecord IPMRecord} as embedded attachment to {@link Zarafa.core.data.IPMAttachmentStore IPMAttachmentStore}, this will generate new
	 * {@link Zarafa.core.data.IPMAttachmentRecord attachment record} and
	 * add those to the store and will send request to server to save embedded attachment info to state file.
	 * @param {Zarafa.core.data.IPMRecord} record The record which needs to be added as embedded attachment into store.
	 *
	 * @return data object which is used to create attachment record.
	 */
	addEmbeddedAttachment : function(record)
	{
		var data = {
			'entryid' : record.get('entryid'),
			'store_entryid' : record.get('store_entryid'),
			// attach method to indicate this is an embedded attachment
			'attach_method' : Zarafa.core.mapi.AttachMethod.ATTACH_EMBEDDED_MSG,
			'attach_id' : Zarafa.generateId(8)
		};

		// Some optional data which should be present only if it is not empty
		if(!Ext.isEmpty(record.get('subject'))) {
			data['name'] = record.get('subject');
		}

		if(!Ext.isEmpty(record.get('message_class'))) {
			data['attach_message_class'] = record.get('message_class');
		}

		if(!Ext.isEmpty(record.get('message_size'))) {
			data['size'] = record.get('message_size');
		}

		return data;
	},

	/**
	 * Destroys a record or records. Should not be used directly. It's called by Store#remove automatically
	 * @param {Store} store
	 * @param {Ext.data.Record/Ext.data.Record[]} record
	 * @param {Number} index
	 * @private
	 */
	destroyRecord : function(store, record, index)
	{
		Zarafa.core.data.IPMAttachmentStore.superclass.destroyRecord.apply(this, arguments);

		var data = {};

		if (!record.isUploaded()) {
			data['deleteattachment'] = true;
			data['attach_id'] = record.get('attach_id');
		} else if (record.isTmpFile()) {
			data['deleteattachment'] = true;
			data['attach_num'] = record.get('tmpname');
		} else {
			data['deleteattachment'] = true;
			data['attach_num'] = record.get('attach_num');
		}

		var options = {
			'params' : data,
			'requestUrl' : this.getUploadAttachmentUrl()
		};

		// fire the 'attachmentstorebeforedestroyrecord' event that can change the event options.
		var eventData = {
			options: options
		};
		Zarafa.core.data.ZarafaCustomEventDispatcher.fireEvent('attachmentstorebeforedestroyrecord', this, record, eventData);

		var action = Ext.data.Api.actions['destroy'];
		var callback = this.createCallback(action, record, false);
		this.proxy.request(action, record, options.params, this.reader, callback, this, eventData.options);
	},

	/**
	 * Imports an attachment into given folder.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} attachmentRecord The attachment to import into given folder
	 * @param {Zarafa.core.data.IPMRecord IPMRecord} message The record to which given attachment belongs
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 * @private
	 */
	importRecord : function(attachmentRecord, message, folder)
	{
		var options = {
			'params' : {},
			'requestUrl' : this.getImportAttachmentUrl(attachmentRecord, folder)
		};

		var action = 'import';
		var callback = this.createCallback(action, folder, false);
		this.proxy.request(action, message, options.params, this.reader, callback, this, options);
	},

	/**
	 * Possibly temporary until Ext framework has an exception-handler.
	 * See {@link Ext.data.Store}.
	 * @protected
	 */
	handleException : Ext.data.Store.prototype.handleException,

	/**
	 * callback-handler for remote CRUD actions.
	 * Do not override -- override loadRecords, onCreateRecords, onDestroyRecords and onUpdateRecords instead.
	 * See {@link Ext.data.Store}.
	 * @private
	 */
	createCallback : Ext.data.Store.prototype.createCallback,

	/**
	 * Proxy callback for create action.
	 * Callback function as created by {@Link #createCallback}.
	 * See {@link Ext.data.Store}.
	 * @protected
	 */
	onCreateRecords : Ext.data.Store.prototype.onCreateRecords,

	/**
	 * Proxy callback for destroy action
	 * Callback function as created by {@Link #createCallback}.
	 * See {@link Ext.data.Store}.
	 * @protected
	 */
	onDestroyRecords : Ext.data.Store.prototype.onDestroyRecords,

	/**
	 * remap record ids in MixedCollection after records have been realized. See {@link Ext.dataStore#onCreateRecords}, and
	 * {@link Ext.data.DataReader#realize}
	 * @private
	 */
	reMap : Ext.data.Store.prototype.reMap,

	/**
	 * Add request to batch
	 * See {@link Ext.data.Store}.
	 * @private
	 */
	addToBatch : Ext.emptyFn,

	/**
	 * Remove request from batch
	 * See {@link Ext.data.Store}.
	 * @private
	 */
	removeFromBatch : Ext.emptyFn,

	/**
	 * Proxy callback for import action
	 * Callback function as created by {@Link #createCallback}.
	 * See {@link Ext.data.Store}.
	 * @protected
	 */
	onImportRecords : function(success, rs, data)
	{
		if (success === true) {
			container.getNotifier().notify('info.import', _('Import'), String.format(_('Successfully imported item(s) to {0}'), rs.getFullyQualifiedDisplayName()));
		} else {
			container.getNotifier().notify('info.import', _('Import'), String.format(_('Failed to import item(s) to {0}'), rs.getFullyQualifiedDisplayName()));
		}
	}
});
