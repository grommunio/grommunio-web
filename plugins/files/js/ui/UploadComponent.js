Ext.namespace('Zarafa.plugins.files.ui');
/**
 * @class Zarafa.plugins.files.ui.UploadComponent
 * @extends Ext.Component
 * @xtype filesplugin.uploadcomponent
 */
Zarafa.plugins.files.ui.UploadComponent = Ext.extend(Ext.Component, {
	/**
	 * @cfg {Function} callback The callback function which must be called when the
	 * file has be selected from Browser's file selection dialog.
	 */
	callback: Ext.emptyFn,

	/**
	 * @cfg {Object} scope The scope for the {@link #callback} function
	 */
	scope: undefined,

	/**
	 * @cfg {Boolean} multiple The multiple true to allow upload multiple files
	 * else allow single file only. by default it is false.
	 */
	multiple: false,

	/**
	 * @cfg {String} accept the accept define which type of files allow to
	 * show in Browser's file selection dialog. i.e image/* to allow all type of images.
	 */
	accept: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'filesplugin.uploadcomponent'
		});

		Zarafa.plugins.files.ui.UploadComponent.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for opening the Browser's file selection dialog.
	 * See {@link #onFileInputChange} for the handling of the selected files.
	 * @private
	 */
	openUploadDialog: function () {
		var uploadEl = this.getUploadEl();

		// Register the change event handler
		// so we detect when the user selects a file.
		uploadEl.on('change', this.onFileInputChange, this);

		// Mimick clicking on the <input> field
		// to open the File Selection dialog.
		uploadEl.dom.click();
	},

	/**
	 * Obtain or instantiate the {@link Ext.Element attachment} &lt;input&gt; element used
	 * for opening the File selection dialog.
	 * @return {Ext.Element} The file input element
	 * @private
	 */
	getUploadEl: function () {
		var uploadEl = Ext.DomHelper.append(Ext.getBody(), {
			cls : 'x-hidden',
			tag : 'input',
			type: 'file'
		});

		if (Ext.isDefined(this.multiple) && this.multiple) {
			uploadEl.multiple = this.multiple;
		}

		if (Ext.isDefined(this.accept)) {
			uploadEl.accept = this.accept;
		}

		uploadEl = Ext.get(uploadEl);
		return uploadEl;
	},

	/**
	 * Event handler which is fired when the {@link #attachEl} has been changed.
	 * @param {Ext.EventObject} event The event
	 * @private
	 */
	onFileInputChange: function (event) {
		var browserEvent = event.browserEvent;
		var uploadEl = Ext.get(browserEvent.target);
		var transfer = browserEvent.dataTransfer;
		var transferFile = transfer ? transfer.files : undefined;
		var files = uploadEl.dom.files || transferFile;

		this.callback.call(this.scope, files);

		// remove attachment element.
		uploadEl.remove();
	}
});

Ext.reg('filesplugin.uploadcomponent', Zarafa.plugins.files.ui.UploadComponent);
