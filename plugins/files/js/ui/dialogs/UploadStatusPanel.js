Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.UploadStatusPanel
 * @extends Ext.form.FormPanel
 * @xtype filesplugin.uploadstatuspanel
 *
 * This panel will upload files via ajax and display some nice progressbars.
 */
Zarafa.plugins.files.ui.dialogs.UploadStatusPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @var FileList or string[]
	 */
	files: null,

	/**
	 * @var string
	 */
	destination: null,

	/**
	 * @var XMLHttpRequest[]
	 */
	xhr: [],

	/**
	 * @var object Timer object for calculating the upload speed
	 */
	statsTimer: null,

	/**
	 * @var int Lock for synchronisation between timer runs
	 */
	timerCounter: null,

	/**
	 * @var int Timerinterval in milliseconds
	 */
	timerIntervall: 200,

	/**
	 * @var function Callback gets called if all files were uploaded
	 */
	callbackAllDone: Ext.emptyFn,

	/**
	 * @var function Callback gets called if one upload fails
	 */
	callbackUploadFailed: Ext.emptyFn,

	/**
	 * @var function Callback gets called if one upload was aborted
	 */
	callbackUploadAborted: Ext.emptyFn,

	/**
	 * @cfg {@link Zarafa.plugins.files.data.FilesRecordStore store} which contains
	 * {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		Ext.applyIf(config, {
			autoScroll : true,
			defaults : {
				anchor: '100%'
			},
			items    : this.initUploadUI(config),
			listeners: {
				afterrender: this.startUpload,
				scope : this
			}
		});

		Zarafa.plugins.files.ui.dialogs.UploadStatusPanel.superclass.constructor.call(this, config);
	},

	/**
	 * This function generates a UI element that displays the file upload stats (ETA, speed, size...)
	 * @param file
	 * @param ref
	 * @returns {object}
	 */
	getBasicElement: function (file, ref) {
		var filename = file.name;
		var filesize = file.size;

		return {
			xtype        : 'panel',
			padding      : 10,
			custom_fileid: ref,
			ref          : 'fileuploadfield_' + ref,
			items        : [{
				layout  : "column",
				border  : false,
				defaults: {
					border: false
				},
				anchor  : "0",
				items   : [{
					columnWidth: .8,
					items      : {
						xtype     : 'displayfield',
						fieldClass: 'fp_upload_header',
						value     : filename
					}
				}, {
					columnWidth: .2,
					style      : 'text-align: right;',
					items      : {
						xtype     : 'displayfield',
						fieldClass: 'fp_upload_header',
						value     : Zarafa.plugins.files.data.Utils.Format.fileSizeList(filesize)
					}
				}]
			}, {
				layout  : "column",
				border  : false,
				defaults: {
					border: false
				},
				anchor  : "0",
				items   : [{
					columnWidth: .95,
					items      : {
						xtype: 'progress',
						text : dgettext('plugin_files', 'Starting upload') + '&hellip;',
						ref  : '../../progress'
					}
				}, {
					columnWidth: .05,
					items      : {
						xtype        : 'button',
						ref          : '../../cancel',
						custom_fileid: ref,
						tooltip      : dgettext('plugin_files', 'Cancel upload'),
						overflowText : dgettext('plugin_files', 'Cancel upload'),
						iconCls      : 'icon_action_cancel',
						handler      : this.doCancelUpload.createDelegate(this)
					}
				}]
			}, {
				layout  : "column",
				border  : false,
				defaults: {
					border: false
				},
				anchor  : "0",
				items   : [{
					columnWidth: .33,
					items      : {
						xtype: 'displayfield',
						value: '- kB/s',
						ref  : '../../speed'
					}
				}, {
					columnWidth: .33,
					items      : [{
						xtype: 'displayfield',
						value: '0 MB',
						ref  : '../../uploaded'
					}]
				}, {
					columnWidth: .33,
					style      : 'text-align: right;',
					items      : {
						xtype: 'displayfield',
						value: dgettext('plugin_files', '- seconds left'),
						ref  : '../../eta'
					}
				}]
			}]
		};
	},

	/**
	 * Generates one UI element for each file
	 *
	 * @param config
	 * @returns {Array}
	 */
	initUploadUI: function (config) {
		var files = config.files;

		var items = [];

		Ext.each(files, function (file, index) {
			items.push(this.getBasicElement(file, index));
		}, this);

		return items;
	},

	/**
	 * This function generates the XMLHttpRequest's and starts the upload.
	 * The upload timer gets also started in this function.
	 */
	startUpload: function ()
	{
		Ext.each(this.files, function (file, index) {
			this.xhr[index] = new XMLHttpRequest();
			this.xhr[index].open("post", "index.php?load=custom&name=upload_file&keep_both="+this.keepBoth, true);

			// progress listener
			this.xhr[index].upload.addEventListener("progress", this.onUpdateProgress.createDelegate(this, [index], true), false);

			// finish listener
			this.xhr[index].addEventListener("load", this.onFinishProgress.createDelegate(this, [index], true), false);

			// error listener
			this.xhr[index].addEventListener("error", this.onUploadFailed.createDelegate(this, [index], true), false);

			// abort listener
			this.xhr[index].addEventListener("abort", this.onUploadAborted.createDelegate(this, [index], true), false);

			// Set headers - important for the php backend!
			this.xhr[index].setRequestHeader("Content-Type", "multipart/form-data");
			this.xhr[index].setRequestHeader("X-FILE-NAME", encodeURIComponent(file.name));
			this.xhr[index].setRequestHeader("X-FILE-SIZE", file.size);
			this.xhr[index].setRequestHeader("X-FILE-TYPE", file.type);
			this.xhr[index].setRequestHeader("X-FILE-DESTINATION", this.destination);

			// Send the file
			this.xhr[index].send(file);

			this.xhr[index].cust_loaded = 0; // store loaded and total size to xhr element
			this.xhr[index].cust_total = 0;
		}, this);

		this.statsTimer = window.setInterval(this.getStats.createDelegate(this), this.timerIntervall);
		this.timerCounter = this.xhr.length; // set count for locking
	},

	/**
	 * This function gets called by the upload timer. It calculates upload speed
	 * and the remaining time.
	 */
	getStats: function () {
		Ext.each(this.xhr, function (request, index) {
			var oldloaded = request.cust_loaded_old;
			var loaded = request.cust_loaded;
			var total = request.cust_total;
			request.cust_loaded_old = loaded;

			// calculate speed and eta
			var speed = (loaded - oldloaded) / (this.timerIntervall / 1000); // bytes per second
			var speed_unit = ' B/s';

			// calc ETA
			var eta = (total - loaded) / speed; // seconds
			var eta_unit = dgettext('plugin_files', ' seconds left');

			if (eta > 60) {
				eta = eta / 60; // minutes
				eta_unit = dgettext('plugin_files', ' minutes left');
			}

			// transform speed units
			if (speed > 1000) {
				speed = speed / 1000; // kBps
				speed_unit = ' kB/s';
			}
			if (speed > 1000) {
				speed = speed / 1000; // mBps
				speed_unit = ' mB/s';
			}


			var filesUploaderPanel = this["fileuploadfield_" + index];
			if (Ext.isDefined(filesUploaderPanel)) {
				if (Ext.isDefined(oldloaded) && loaded != 0 && total != 0) {
					if (loaded != oldloaded) {
						filesUploaderPanel.speed.setValue(speed.toFixed(2) + speed_unit);
						filesUploaderPanel.eta.setValue(parseInt(eta) + eta_unit);
					}
				} else {
					filesUploaderPanel.speed.setValue('- kB/s');
					filesUploaderPanel.eta.setValue(dgettext('plugin_files', '- seconds left'));
				}
			}
		}, this);
	},

	/**
	 * Callback for the 'progress' event of the XHR request.
	 * It will update the progressbar and set the uploaded filesize.
	 *
	 * @param event
	 * @param index
	 */
	onUpdateProgress: function (event, index) {
		var filesUploaderPanel = this["fileuploadfield_" + index];

		if (Ext.isDefined(filesUploaderPanel)) {
			if (event.lengthComputable) {
				this.xhr[index].cust_loaded = event.loaded; // store loaded and total size to xhr element
				this.xhr[index].cust_total = event.total;

				var finished = ((event.loaded / event.total) * 100).toFixed(2);
				filesUploaderPanel.progress.updateProgress((event.loaded / event.total), dgettext('plugin_files', 'Uploading: ') + finished + '%', true);
				filesUploaderPanel.uploaded.setValue(Zarafa.plugins.files.data.Utils.Format.fileSizeList(event.loaded));
			} else {
				filesUploaderPanel.progress.updateProgress(0.5, dgettext('plugin_files', 'Upload status unavailable... please wait.'), true);
			}
		}
	},

	/**
	 * Callback for the 'load' event of the XHR request.
	 * This callback gets called after the file was uploaded to the server.
	 * It will update the progressbar and reset the uploaded filesize.
	 *
	 * @param event
	 * @param index
	 */
	onFinishProgress: function (event, index) {
		var filesUploaderPanel = this["fileuploadfield_" + index];
		// If files upload panel is not already closed then do go farther operations like
		// disable the cancel button and update progress bar etc.
		if (filesUploaderPanel) {
			filesUploaderPanel.progress.updateProgress(1, dgettext('plugin_files', 'Upload finished!'), true);

			// reset stats - to tell the timer to stop
			this.xhr[index].cust_loaded = 0; // store loaded and total size to xhr element
			this.xhr[index].cust_total = 0;

			filesUploaderPanel.cancel.disable();
			this.checkTimerAlive();
		}
	},

	/**
	 * Callback for the 'abort' event of the XHR request.
	 * This callback gets called after a upload was aborted by the user.
	 * It will update the progressbar.
	 *
	 * @param event
	 * @param index
	 */
	onUploadAborted: function (event, index) {
		var filesUploaderPanel = this["fileuploadfield_" + index];
		if (Ext.isDefined(filesUploaderPanel)) {
			var progressbar = filesUploaderPanel.progress;
			progressbar.updateProgress(1, dgettext('plugin_files', 'Upload aborted!'), true);
			progressbar.addClass("fp_upload_canceled");
			filesUploaderPanel.cancel.disable();

			// call callback
			this.callbackUploadAborted(this.files[index], this.destination, event);
			this.checkTimerAlive();
		}
	},

	/**
	 * Callback for the 'error' event of the XHR request.
	 * This callback gets called after a upload failed.
	 * It will update the progressbar.
	 *
	 * @param event
	 * @param index
	 */
	onUploadFailed: function (event, index) {
		var filesUploaderPanel = this["fileuploadfield_" + index];
		if (Ext.isDefined(filesUploaderPanel)) {
			var progressbar = filesUploaderPanel.progress;
			progressbar.updateProgress(1, dgettext('plugin_files', 'Upload failed!'), true);
			progressbar.addClass("fp_upload_canceled");
			filesUploaderPanel.cancel.disable();

			// call callback
			this.callbackUploadFailed(this.files[index], this.destination, event);
			this.checkTimerAlive();
		}
	},

	/**
	 * This function will decrease the timer counter lock.
	 * If the lock is zero the dialog will be closed.
	 */
	checkTimerAlive: function () {
		this.timerCounter--;
		if (this.timerCounter <= 0) {
			window.clearTimeout(this.statsTimer);
			this.onUploadsFinished();
		}
	},

	/**
	 * This function can abort one XHR request.
	 *
	 * @param button
	 * @param event
	 */
	doCancelUpload: function (button, event) {
		this.xhr[button.custom_fileid].abort();
	},

	/**
	 * Close the dialog.
	 */
	onUploadsFinished: function () {
		this.dialog.close();
		this.callbackAllDone(this.files, this.destination, this.store);
	}
});

Ext.reg('filesplugin.uploadstatuspanel', Zarafa.plugins.files.ui.dialogs.UploadStatusPanel);
