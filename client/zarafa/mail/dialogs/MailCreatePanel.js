Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailCreatePanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.mailcreatepanel
 *
 * Panel that is used to compose a mail messages.
 */
Zarafa.mail.dialogs.MailCreatePanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Boolean} useHtml True to enable the HTML editor in this panel.
	 */
	useHtml: false,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.mailcreatepanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			cls: 'zarafa-mailcreatepanel',
			bodyStyle: 'background-color: inherit;',
			defaults: {
				border: false
			},
			items: [
				this.initMessageFormPanel(config)
			]
		});

		Zarafa.mail.dialogs.MailCreatePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Called automatically when the {@link Zarafa.mail.dialogs.MailCreateContentPanel content panel}
	 * is being rendered. This will add a listener to to the {@link Zarafa.mail.dialogs.MailCreateContentPanel#bcctoggle} button.
	 * @private
	 */
	onRender: function()
	{
		Zarafa.mail.dialogs.MailCreatePanel.superclass.onRender.apply(this, arguments);

		if (this.dialog) {
			this.mon(this.dialog, 'bcctoggle', this.onDialogBccToggle, this);
			this.mon(this.dialog, 'fromtoggle', this.onDialogFromToggle, this);
		}
	},

	/**
	 * Returns items for the splitbutton
	 * @private
	 */
	initSendAsList: function()
	{
		var recipients = container.getSettingsModel().get('zarafa/v1/contexts/mail/sendas', true);
		var items = [];

		if(Ext.isEmpty(recipients)) {
			return;
		}

		Ext.each(recipients, function(recipient) {
			var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, recipient);

			var item = {
				text: record.formatRecipient(true),
				handler: this.onSelectSendAsRecipient,
				scope: this,
				record: record
			};

			items.push(item);
		}, this);

		return items;
	},

	/**
	 * Creates the form panel
	 * @private
	 */
	initMessageFormPanel: function(config)
	{
		var sendAsMenu = this.initSendAsList();
		var hasEmptySendAsList = Ext.isEmpty(sendAsMenu);

		return [{
			xtype: 'container',
			cls: 'zarafa-mailcreatepanel-extrainfo',
			ref: 'extraInfoPanel',
			autoHeight: true,
			hidden: true
		},{
			xtype: 'zarafa.compositefield',
			hideLabel: true,
			ref: 'fromField',
			cls: hasEmptySendAsList ? 'zarafa-mailcreatepanel-field-from-large' : 'zarafa-mailcreatepanel-field-from',
			anchor: '100%',
			autoHeight: true,
			items: [{
				xtype: hasEmptySendAsList ? 'button' : 'splitbutton',
				autoHeight: true,
				text: _('From') + ':',
				handler: this.onSelectUser,
				menu: hasEmptySendAsList ? false : new Ext.menu.Menu({
					showSeparator: false,
					items: sendAsMenu
				}),
				scope: this
			},{
				xtype: 'zarafa.addressbookboxfield',
				enableKeyEvents: true,
				ref: '../fromRecipientField',
				boxType: 'zarafa.recipientbox',
				boxStore: new Zarafa.core.data.IPMRecipientStore({
					listeners: {
						// When recipient is added/removed/resolved in from field's
						// store set sent_representing_* properties on record.
						'add': this.onFromRecipientChanged,
						'resolved': this.onFromRecipientChanged,
						'remove': this.onFromRecipientChanged,
						scope: this
					}}),
				flex: 1,
				boxLimit: 1
			}]
		},{
			xtype: 'zarafa.resizablecompositefield',
			hideLabel: true,
			cls: 'zarafa-mailcreatepanel-field-to',
			anchor: '100%',
			autoHeight: false,
			items: [{
				xtype: 'button',
				text: _('To'),
				autoHeight: true,
				handler: function() {
					Zarafa.mail.Actions.openRecipientSelectionContent(this.record, {
						defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO
					});
				},
				scope: this
			},{
				xtype: 'zarafa.recipientfield',
				ref: '../toRecipientField',
				enableKeyEvents: true,
				plugins: [ 'zarafa.recordcomponentupdaterplugin' ],
				flex: 1,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO
			}]
		},
		{
			xtype: 'zarafa.resizablecompositefield',
			hideLabel: true,
			cls: 'zarafa-mailcreatepanel-field-cc',
			anchor: '100%',
			autoHeight: false,
			items: [{
				xtype: 'button',
				autoHeight: true,
				text: _('Cc'),
				handler: function() {
					Zarafa.mail.Actions.openRecipientSelectionContent(this.record, {
						defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_CC
					});
				},
				scope: this
			},{
				xtype: 'zarafa.recipientfield',
				enableKeyEvents: true,
				plugins: [ 'zarafa.recordcomponentupdaterplugin' ],
				flex: 1,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_CC,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_CC
			}]
		},
		{
			xtype: 'zarafa.resizablecompositefield',
			ref: 'bccField',
			hideLabel: true,
			cls: 'zarafa-mailcreatepanel-field-bcc',
			anchor: '100%',
			autoHeight: false,
			items: [{
				xtype: 'button',
				autoHeight: true,
				text: _('Bcc'),
				handler: function() {
					Zarafa.mail.Actions.openRecipientSelectionContent(this.record, {
						defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_BCC
					});
				},
				scope: this
			},{
				xtype: 'zarafa.recipientfield',
				enableKeyEvents: true,
				plugins: [ 'zarafa.recordcomponentupdaterplugin' ],
				flex: 1,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_BCC,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_BCC
			}]
		},
		{
			xtype: 'textfield',
			cls: 'zarafa-mailcreatepanel-field-subject',
			name: 'subject',
			enableKeyEvents: true,
			value: undefined,
			height: 36,
			emptyText: _('Subject') + ':',
			listeners: {
				change: this.onChange,
				scope: this
			}
		},{
			xtype: 'zarafa.resizablecompositefield',
			hideLabel: true,
			cls: 'zarafa-mailcreatepanel-field-attachments',
			anchor: '100%',
			autoHeight: true,
			items: [{
				xtype: 'zarafa.attachmentbutton',
				autoHeight: true,
				plugins: [ 'zarafa.recordcomponentupdaterplugin' ],
				text: _('Attachments')
			},{
				xtype: 'zarafa.attachmentfield',
				enableKeyEvents: true,
				plugins: [ 'zarafa.recordcomponentupdaterplugin' ],
				flex: 1,
				tabIndex: -1,
				hideLabel: true,
				value: undefined
			}]
		},{
			xtype: 'zarafa.editorfield',
			cls: 'zarafa-mailcreatepanel-field-editor',
			enableKeyEvents: true,
			ref: 'editorField',
			hideLabel: true,
			useHtml:config.useHtml,
			flex: 1,
			listeners: {
				change: this.onBodyChange,
				initialized: this.onEditorInitialized,
				valuecorrection: this.onBodyValueCorrection,
				scope: this
			}
		}];
	},

	/**
	 * Updates the panel by loading data from the record into the header template, and
	 * loading the body html into the embedded iframe.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.record = record;
		this.getForm().loadRecord(record);
		// record will contain body only when its already opened
		if(record.isOpened()) {
			if(contentReset) {
				this.editorField.setHtmlEditor(this.useHtml, false);
				this.editorField.bindRecord(record);

				var body;
				if (this.useHtml) {
					body = record.getSanitizedHtmlBody();
				} else {
					body = record.getBody(this.useHtml);
				}
				this.editorField.setValue(body);
			}
		}

		if (contentReset) {
			record.setDefaultFromRecipeint();
			record.setDefaultCcRecipients();
		}

		this.updateExtraInfoPanel();
	},

	/**
	 * Function will update the {@link #extraInfoPanel} with extra information that should be shown
	 * @private
	 */
	updateExtraInfoPanel: function()
	{
		// clear the previous contents
		var el = this.extraInfoPanel.getEl();
		if(Ext.isDefined(el.dom)) {
			el.dom.innerHTML = '';
		}

		var infoMessage = this.getExtraInfoMessage();

		if (infoMessage) {
			el.createChild({tag: 'div', html: pgettext('calendar.dialog', infoMessage)});
		}

		this.extraInfoPanel.setVisible(infoMessage !== false);
		this.doLayout();
	},

	/**
	 * Helper function to prepare extra-info-message based on configured flag properties.
	 *
	 * @param {String|Boolean} Message to show, false otherwise.
	 */
	getExtraInfoMessage: function()
	{
		var flagStatus = this.record.get('flag_status');
		if (flagStatus !== Zarafa.core.mapi.FlagStatus.flagged) {
			return false;
		}

		var configuredFlag = Zarafa.common.flags.Util.getConfiguredFlag(this.record);
		if (configuredFlag === 'no_date') {
			return _("This message will be flagged for follow up when it is sent.");
		} else {
			return String.format("This message will be flagged for follow up {0} when it is sent.", configuredFlag);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.common.ui.HtmlEditor#valuecorrection valuecorrection}
	 * event handler which is fired when the Browser has changed the HTML data after it has been set
	 * into the {@link Zarafa.common.ui.HtmlEditor}. This will apply the corrected value
	 * directly back into the {@link #record} to ensure we don't consider this as a change (as technically
	 * the data is still the same, but the browser formatted/validated it).
	 * @param {Zarafa.common.ui.HtmlEditor} field The field which fired the event
	 * @param {String} value The corrected value
	 * @param {String} oldValue the original value which was applied.
	 * @private
	 */
	onBodyValueCorrection: function(field, value, oldValue)
	{
		var record = this.record;

		if (this.editorField.isHtmlEditor()) {
			record.data.html_body = record.inlineImgZarafaToOutlook(value);
		} else {
			record.data.body = value;
		}

		// Go for valuecorrection after record gets opened
		this.record.store.on('open', this.onRecordOpen, this);
	},

	/**
	 * Event Handler for {@link Zarafa.core.data.IPMStore store} open event. Handling a
	 * special situation where two open requests made to server while double clicking
	 * the mail from grid, first for tab panel, second for preview panel.
	 * The html_body property of record, which belongs to tab panel, gets updated while
	 * handling the response of second open request discarding the tinyMCE incurred changes,
	 * left us with the situation where UI and underlying record differs.
	 * To resolve this, we need to go for valuecorrection once the record gets opened successfully.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store of the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record which will be converted to a task
	 */
	onRecordOpen: function(store, record)
	{
		if (this.editorField) {
			var fieldValue = this.editorField.getValue();
			var recordBody = false;

			if (Ext.isFunction(record.getBody)) {
				recordBody = record.getBody(this.editorField.isHtmlEditor());
			}

			// Go further only if editor value differs with html_body of record
			if ( fieldValue !== recordBody ) {
				this.onBodyValueCorrection(this.editorField, fieldValue);
			}
		}
	},

	/**
	 * Update the given {@link Zarafa.core.data.IPMRecord record} with
	 * the values from this {@link Ext.Panel panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 */
	updateRecord: function(record)
	{
		record.beginEdit();
		this.getForm().updateRecord(record);

		record.setBody(this.editorField.getValue(), this.editorField.isHtmlEditor());

		record.endEdit();
	},

	/**
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange: function(field, value)
	{
		var record = this.record;
		var fieldname = field.name;
		if(fieldname === 'subject') {
			record.set('normalized_subject', value);
			record.set(fieldname, value);
		}
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange: function(field, newValue, oldValue)
	{
		var record = this.record;

		record.beginEdit();

		record.setBody(this.editorField.getValue(), this.editorField.isHtmlEditor());

		record.endEdit();
	},

	/**
	 * Event handler which is triggered when {@link Zarafa.common.ui.HtmlEditor editor}
	 * is created inside the editor field.
	 * @param {Zarafa.common.ui.HtmlEditor} htmlEditor The editor which is initialized.
	 * @param {tinymce.Editor} tinymceEditor The tinymce editor instance
	 * @private
	 */
	onEditorInitialized: function(htmlEditor, tinymceEditor)
	{
		/*
		 * Fixed issue with FF that when we change focus in FF using tab key it sets focus
		 * on iframe's 'document' element rather then 'body' element, so register keymap
		 * event on iframe's 'document'.
		 * Another issue is that Ext.Element.get will return null for document element of iframes
		 * because actually it isn't Ext.Element, So we need to create a dummy element explicitly
		 * using editor's(iframe's) document element.
		 */
		var element = new Ext.Element(tinymceEditor.getDoc());

		// Here we are passing dialog as a component and editor's document as element, so
		// that when key events are fired on the element it will pass dialog component
		// as an argument in callback function.
		Zarafa.core.KeyMapMgr.activate(this.dialog, 'global', element);
		Zarafa.core.KeyMapMgr.activate(this.dialog, 'contentpanel.record.message', element);
	},

	/**
	 * Event handler that is fired when the BCC field visibility must be changed.
	 * This will update UI of the {@link Zarafa.mail.dialogs.MailCreateContentPanel}
	 * @param {Zarafa.core.ui.ContentPanel} contentpanel
	 * @param {Boolean} enabled true if the the BCC field should be shown
	 * @private
	 */
	onDialogBccToggle: function(contentpanel, enabled)
	{
		this.bccField.setVisible(enabled);
		this.doLayout();
	},

	/**
	 * Event handler that is fired when the BCC field visibility must be changed.
	 * This will update UI of the {@link Zarafa.mail.dialogs.MailCreateContentPanel}
	 * @param {Zarafa.core.ui.ContentPanel} contentpanel
	 * @param {Boolean} enabled true if the the BCC field should be shown
	 * @private
	 */
	onDialogFromToggle: function(contentpanel, enabled)
	{
		this.fromField.setVisible(enabled);
		this.doLayout();
	},

	/**
	 * @param {Number} signatureId, The signatureId which is used to get correct signature.
	 * which is going to be added in editor.
	 */
	setSignatureInEditor: function(signatureId)
	{
		var model = this.dialog.getContextModel();
		var useHtmlEditor = this.editorField.isHtmlEditor();
		var signatureData = model.getSignatureData(useHtmlEditor, signatureId, false);

		if (Ext.isEmpty(signatureData)) {
			return;
		}

		if (useHtmlEditor) {
			var editorComponent = this.editorField.getEditor();
			if (editorComponent && Ext.isFunction(editorComponent.getEditor)) {
				var tinyMceEditor = editorComponent.getEditor();
				if (tinyMceEditor && tinyMceEditor.dom) {
					var bodyElement = tinyMceEditor.getBody();
					var existingSignature = null;

					Ext.each(tinyMceEditor.dom.select('.signatureContainer') || [], function(node) {
						if (node.parentNode === bodyElement) {
							existingSignature = node;
							return false;
						}
					});

					if (existingSignature) {
						// Replace the content of the existing signature container instead of appending a new one.
						tinyMceEditor.dom.setHTML(existingSignature, signatureData);
						tinyMceEditor.selection.select(existingSignature);
						tinyMceEditor.selection.collapse(false);
						this.editorField.currentSignatureHtml = tinyMceEditor.dom.getOuterHTML(existingSignature);
						return;
					}
				}
			}

			signatureData = model.wrapSignature(signatureData);
			this.editorField.currentSignatureHtml = signatureData;
		}

		this.editorField.insertAtCursor(signatureData);
	},

	/**
	 * Function will be called when user/recipients is added/removed or resolved
	 * which is added in from field.
	 * Function will set sent_representing_* properties to send mails on behalf.
	 * @private
	 */
	onFromRecipientChanged: function()
	{
		var store = this.fromRecipientField.getBoxStore();
		var record = this.record;
		record.beginEdit();

		var recipientRecord = store.getAt(0);

		if(recipientRecord) {
			this.getTopToolbar().showFrom.disable();

			record.set('sent_representing_name', recipientRecord.get('display_name'));
			record.set('sent_representing_email_address', recipientRecord.get('email_address'));
			record.set('sent_representing_address_type', recipientRecord.get('address_type'));
			record.set('sent_representing_entryid', recipientRecord.get('entryid'));
			record.set('sent_representing_search_key', recipientRecord.get('search_key'));
		} else {
			this.getTopToolbar().showFrom.enable();

			record.set('sent_representing_name', '');
			record.set('sent_representing_email_address', '');
			record.set('sent_representing_address_type', '');
			record.set('sent_representing_entryid', '');
			record.set('sent_representing_search_key', '');
		}

		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user presses the 'Name' button.
	 * This will open the Address Book User Selection Dialog to select a user.
	 * @private
	 */
	onSelectUser: function()
	{
		Zarafa.common.Actions.openABUserSelectionContent({
			callback: this.abCallBack,
			scope: this,
			hideContactsFolders: true,
			listRestriction: {
				hide_users: ['system', 'everyone'],
				hide_companies: true
			}
		});
	},

	/**
	 * Event handler which is fired when the user selects a send as recipient for from field.
	 *
	 * @private
	 */
	onSelectSendAsRecipient: function(item)
	{
		if(!item.record) {
			// can't do anything here
			return;
		}

		var store = this.fromRecipientField.getBoxStore();

		// We need to maintain that in from field there should be only one user,
		// So remove earlier added user.
		store.removeAll();
		store.add(item.record);
	},

	/**
	 * Callback function for {@link Zarafa.addressbook.dialogs.ABUserSelectionContent AddressBook}
	 * @param {Ext.data.Record} record user selected from AddressBook
	 * @private
	 */
	abCallBack: function(record)
	{
		var store = this.fromRecipientField.getBoxStore();

		// We need to maintain that in from field there should be only one user,
		// So remove earlier added user.
		store.removeAll();
		store.add(record.convertToRecipient());
	}
});

Ext.reg('zarafa.mailcreatepanel', Zarafa.mail.dialogs.MailCreatePanel);
