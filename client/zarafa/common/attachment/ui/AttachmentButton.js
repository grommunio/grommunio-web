Ext.namespace('Zarafa.common.attachment.ui');

/**
 * @class Zarafa.common.attachment.ui.AttachmentButton
 * @extends Ext.SplitButton
 * @xtype zarafa.attachmentbutton
 *
 * Special button which can be used for attaching items to a {@link Zarafa.core.data.IPMRecord IPMRecord}.
 * This utilizes the {@link #main.attachment.method} insertion point to allow plugins to register
 * alternative methods for attaching items to the record. These options will be shown inside the dropdown
 * list, while the default button action will be opening the Browsers File Selection dialog
 *
 * If the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Zarafa.core.data.MAPIRecord record} into the component.
 * Otherwise the user of this component needs to call {@link #bindRecord}.
 */
Zarafa.common.attachment.ui.AttachmentButton = Ext.extend(Ext.SplitButton, {
	/**
	 * @insert main.attachment.method
	 * Provide a new method for attaching files to a {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * This can be used by 3rd party plugins to insert a new MenuItem into the dropdown
	 * box for the {@link Zarafa.common.attachment.ui.AttachmentButton AttachmentButton}.
	 * This insertion point should return a {@link Ext.menu.Item item} instance of configuration
	 * @param {Zarafa.common.attachment.ui.AttachmentButton} button This button
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			menu : {
				items : [{
					text : _('File upload'),
					handler : this.onFileUpload,
					scope: this,
					iconCls : 'icon_paperclip'
				}, {
					text : _('Attach item'),
					handler : this.onFileAttach,
					scope: this,
					iconCls : 'icon_embed_attachment'
				},
				container.populateInsertionPoint('main.attachment.method', this)
				]
			},
			handler : this.onFileUpload,
			scope : this
		});

		Zarafa.common.attachment.ui.AttachmentButton.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for opening the Browser's file selection dialog.
	 * See {@link #onFileInputChange} for the handling of the selected files.
	 * @param {Ext.Button} button the button on which click event is performed.
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onFileUpload : function(button, event)
	{
		var attachComponent = new Zarafa.common.attachment.ui.UploadAttachmentComponent({
			callback : this.uploadAttachmentCallback,
			multiple : true,
			scope : this
		});

		attachComponent.openAttachmentDialog();
	},

	/**
	 * The callback function of {@link Zarafa.common.attachment.ui.UploadAttachmentComponent}
	 * which used to upload the attachment file on server.
	 *
	 * @param {Object/Array} files The files contains file information.
	 * @param {Object} form the form is contains {@link Ext.form.BasicForm bacisform} info.
	 */
	uploadAttachmentCallback : function(files, form)
	{
		var store = this.record.getSubStore('attachments');
		store.uploadFiles(files, form);
	},

	/**
	 * Event handler for opening the {@link Zarafa.common.attachment.AttachItemContentPanel AttachItemContentPanel}.
	 * @private
	 */
	onFileAttach : function(field, event)
	{
		// get the parent from which we can find the editorfield
		var panel = this.findParentByType('zarafa.recordcontentpanel');
		var editor = panel.findByType('zarafa.editorfield');
		if(!Ext.isEmpty(editor)) {
			editor = editor[0];
		}

		Zarafa.common.Actions.openAttachItemSelectionContent(this.record, {editor : editor});
	},

	/**
	 * Apply the record to the button. The given record will be used by the attachment handlers
	 * for adding the attachments to the record.
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	bindRecord : function(record)
	{
		this.record = record;
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (record && record instanceof Zarafa.core.data.MAPIRecord) {
			// In case the recordcomponentupdaterplugin is installed
			// we have a special action to update the component.
			if (contentReset) {
				this.bindRecord(record);
			}
		} else {
			// The recordcomponentupdaterplugin is not installed and the
			// caller really wants to perform the update() function. Probably
			// a bad move, but lets not disappoint the caller.
			Zarafa.common.attachment.ui.AttachmentButton.superclass.update.apply(this, arguments);
		}
	}
});

Ext.reg('zarafa.attachmentbutton', Zarafa.common.attachment.ui.AttachmentButton);
