Ext.namespace('Zarafa.plugins.smime');

/**
 * @class Zarafa.plugins.smime.SmimePlugin
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.smime.SmimePlugin = Ext.extend(Zarafa.core.Plugin, {
	/*
	 * Called after constructor.
	 * Registers insertion points.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.smime.SmimePlugin.superclass.initPlugin.apply(this, arguments);

		// One compose toolbar is shared by all available security protocols.
		Zarafa.common.ui.SecurityButtons.register(this.securityProvider());

		// S/MIME Settings widget insertion point
		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategories, this);

		// Insertion point which shows the verified/decrypted status
		this.registerInsertionPoint('previewpanel.toolbar.detaillinks', this.showSmimeInfo, this);

		// S/MIME Icons
		this.registerInsertionPoint('context.mail.gridrow', this.showMessageClass , this);
		this.registerInsertionPoint('context.mail.griddefaultcolumn', this.showDefaultColumn, this);

		Zarafa.core.data.SharedComponentType.addProperty('plugin.smime.dialog.passphrasewindow');
		Zarafa.core.data.SharedComponentType.addProperty('plugin.smime.dialog.changepassphrasecontentpanel');
	},

	securityProvider: function()
	{
		var plugin = this;
		return {id: 'smime', label: 'S/MIME', priority: 10,
			isSelected: function(record, action) { return plugin.isProtectionSelected(record, action); },
			attach: function(dialog) { plugin.attachCompose(dialog); },
			setAction: function(dialog, action, enabled) {
				if (plugin.isProtectionSelected(dialog.record, action) === enabled) { return; }
				// Keep the existing certificate/passphrase flow without changing the
				// icon of the shared button; its record updater supplies that state.
				var button = {securityDialog: dialog, ownerCt: {record: dialog.record, dialog: dialog}, setIconClass: Ext.emptyFn};
				if (action === 'sign') { plugin.onSignButton(button); }
				else { plugin.onEncryptButton(button); }
			},
			getOptions: function(action, dialog) {
				var property = action === 'sign' ? 'digest' : 'cipher';
				var fallback = action === 'sign' ? 'sha256' : 'aes-256-gcm';
				var selected = dialog.record.get('smime_' + property) || container.getSettingsModel().get('zarafa/v1/plugins/smime/default_' + property, fallback);
				var choices = action === 'sign' ? [['sha256', 'SHA-256'], ['sha384', 'SHA-384'], ['sha512', 'SHA-512']] :
					[['aes-256-gcm', 'AES-256-GCM'], ['aes-128-gcm', 'AES-128-GCM'], ['aes-256-cbc', 'AES-256-CBC (' + _('Legacy') + ')']];
				var group = 'security-smime-' + Ext.id();
				return choices.map(function(choice) {
					return {xtype: 'menucheckitem', text: choice[1], checked: selected === choice[0], group: group,
						checkHandler: function(item, checked) { if (checked) { dialog.record.set('smime_' + property, choice[0]); } }};
				});
			}
		};
	},
	isProtectionSelected: function(record, action)
	{
		var messageClass = record.get('message_class');
		return messageClass === 'IPM.Note.deferSMIME.SignedEncrypt' ||
			messageClass === (action === 'sign' ? 'IPM.Note.deferSMIME.MultipartSigned' : 'IPM.Note.deferSMIME');
	},
	attachCompose: function(dialog)
	{
		if (!dialog.smimeSendHook) {
			dialog.smimeSendHook = true;
			dialog.on('beforesendrecord', this.onBeforeSendRecord, this);
		}
	},

	/**
	 * Create a category in settings for S/MIME
	 *
	 * @return {smimesettingscategory}
	 */
	createSettingsCategories : function(insertionName, settingsMainPanel, settingsContext)
	{
		return [{
			xtype : 'smime.settingssmimecategory',
			settingsContext: settingsContext
		}];
	},

	/**
	 * Displays S/MIME information in the previewpanel
	 *
	 * @return {Object} a box which on record update displays S/MIME information
	 */
	showSmimeInfo : function()
	{
		return {
			xtype: 'button',
			plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
			autoEl: {
				tag: 'div',
				ref: 'smimeInfoBox'
			},
			scope : this,
			update : this.onSmimeInfo,
			handler : this.onSmimeButton
		};
	},

	/**
	 * Create button which sets the MessageClass to IPM.Note.deferSMIME.MultiPartSigned
	 * when creating an email.
	 * If certificate is unlocked we can display the Sign button, else a blank label
	 *
	 * @return {Config} creates a button for signing email
	 */
	showSignButton : function()
	{
		var defaultDigest = container.getSettingsModel().get('zarafa/v1/plugins/smime/default_digest', 'sha256');
		var groupId = 'smime-digest-' + Ext.id();
		return {
			xtype : 'splitbutton',
			smimePlugin : this,
			plugins : ['zarafa.recordcomponentupdaterplugin'],
			update : function(record) {
				this.record = record;
				this.smimePlugin.onAfterRenderSmimeButton(this);
			},
			text : _('Sign'),
			tooltip: {
				cls: 'smime-tooltip',
				title: _('Sign message'),
				text: _('Ensure the authenticity of the message by adding a digital signature to this message. Any changes to the message will invalidate the signature.')
			},
			iconCls : 'icon_smime_sign',
			listeners : {
				added : function(button) {
					button.update = function(record) { this.record = record; this.smimePlugin.onAfterRenderSmimeButton(this); };
				},
				afterrender : this.onAfterRenderSmimeButton,
				beforeshow : this.onAfterRenderSmimeButton,
				scope : this
			},
			handler : this.onSignButton,
			scope : this,
			menu : {
				items : [{
					xtype : 'menucheckitem',
					text : 'SHA-256',
					digest : 'sha256',
					group : groupId,
					checked : defaultDigest === 'sha256',
					handler : this.onDigestSelect,
					scope : this
				},{
					xtype : 'menucheckitem',
					text : 'SHA-384',
					digest : 'sha384',
					group : groupId,
					checked : defaultDigest === 'sha384',
					handler : this.onDigestSelect,
					scope : this
				},{
					xtype : 'menucheckitem',
					text : 'SHA-512',
					digest : 'sha512',
					group : groupId,
					checked : defaultDigest === 'sha512',
					handler : this.onDigestSelect,
					scope : this
				}]
			}
		};
	},

	/**
	 * Create button which sets the MessageClass to IPM.Note.deferSMIME
	 * when creating an email in context.mail.mailcreatecontentpanel.toolbar.option
	 *
	 * @return {Object} creates a button for encrypting an email
	 */
	showEncryptButton : function()
	{
		var defaultCipher = container.getSettingsModel().get('zarafa/v1/plugins/smime/default_cipher', 'aes-256-gcm');
		var groupId = 'smime-cipher-' + Ext.id();
		return {
			xtype : 'splitbutton',
			smimePlugin : this,
			plugins : ['zarafa.recordcomponentupdaterplugin'],
			update : function(record) {
				this.record = record;
				this.smimePlugin.onAfterRenderSmimeButton(this);
			},
			text : _('Encrypt'),
			tooltip: {
				cls: 'smime-tooltip',
				title: _('Encrypt message'),
				text: _('Ensure the privacy of the message by encrypting its contents. Only the recipient of the message will be able to open it.')
			},
			iconCls : 'icon_smime_encrypt',
			listeners : {
				added : function(button) {
					button.update = function(record) { this.record = record; this.smimePlugin.onAfterRenderSmimeButton(this); };
				},
				afterrender : this.onAfterRenderSmimeButton,
				beforeshow : this.onAfterRenderSmimeButton,
				scope : this
			},
			handler : this.onEncryptButton,
			scope : this,
			menu : {
				items : [{
					xtype : 'menucheckitem',
					text : 'AES-256-GCM',
					cipher : 'aes-256-gcm',
					group : groupId,
					checked : defaultCipher === 'aes-256-gcm',
					handler : this.onCipherSelect,
					scope : this
				},{
					xtype : 'menucheckitem',
					text : 'AES-128-GCM',
					cipher : 'aes-128-gcm',
					group : groupId,
					checked : defaultCipher === 'aes-128-gcm',
					handler : this.onCipherSelect,
					scope : this
				},{
					xtype : 'menucheckitem',
					text : 'AES-256-CBC (' + _('Legacy') + ')',
					cipher : 'aes-256-cbc',
					group : groupId,
					checked : defaultCipher === 'aes-256-cbc',
					handler : this.onCipherSelect,
					scope : this
				}]
			}
		};
	},

	/**
	 * Handler which is responsible to retain the icon class of sign and encrypt buttons,
	 * while opening a Draft.
	 * It just retrieve message_class from respective record and set the icon-class accordingly.
	 *
	 * @param {Ext.button} button Which just gets rendered
	 */
	onAfterRenderSmimeButton : function(button)
	{
		var dialog = this.getRespectiveDialog(button);
		var record = button.record || (dialog && dialog.record);
		if (!record) {
			return;
		}
		button.setDisabled(!!(record.get('pgp_sign') || record.get('pgp_encrypt')));
		if (button.iconCls === 'icon_smime_sign_selected') {
			button.setIconClass('icon_smime_sign');
		} else if (button.iconCls === 'icon_smime_encrypt_selected') {
			button.setIconClass('icon_smime_encrypt');
		}
		switch(record.get('message_class')) {
		case 'IPM.Note.deferSMIME':
			if (button.iconCls === 'icon_smime_encrypt') {
				button.setIconClass('icon_smime_encrypt_selected');
			}
			break;
		case 'IPM.Note.deferSMIME.MultipartSigned':
			if (button.iconCls === 'icon_smime_sign') {
				button.setIconClass('icon_smime_sign_selected');
			}
			break;
		case 'IPM.Note.deferSMIME.SignedEncrypt':
			if (button.iconCls === 'icon_smime_sign') {
				button.setIconClass('icon_smime_sign_selected');
			} else {
				button.setIconClass('icon_smime_encrypt_selected');
			}
			break;
		}
	},

	/**
	 * Handler for the button which is displayed when a encrypted / signed message is opened
	 * When an encrypted message is opened, we will send a request to unlock the certificate.
	 * When an signed email is opened, we will show a popup with extra information about the signed message
	 */
	onSmimeButton: function(button)
	{
		var smimeInfo = button.record.get('smime');
		if (!button.record.isOpened() || !smimeInfo)
			return;
		switch (smimeInfo.type) {
		case 'encrypted':
			if (smimeInfo.success === Zarafa.plugins.smime.SMIME_STATUS_GOOD)
				break;
			var user = container.getUser();
			container.getRequest().singleRequest(
				'pluginsmimemodule',
				'certificate',
				{
					'user' : user.getSMTPAddress()
				},
				new Zarafa.plugins.smime.data.SmimeResponseHandler({
					successCallback : this.onCertificateCallback.createDelegate(button.record)
				})
			);
			break;
		case 'signed':
		case 'encryptsigned':
			var popupText = Zarafa.plugins.smime.SmimeText.getPopupText(smimeInfo.info);
			var algoText = Zarafa.plugins.smime.SmimeText.formatAlgorithms(smimeInfo.algorithms);
			if (algoText) {
				popupText += '<br><br><b>' + _('Algorithms used') + '</b><br>' + algoText;
			}
			container.getNotifier().notify(Zarafa.plugins.smime.SmimeText.getPopupStatus(smimeInfo.success),
					_('What\'s going on with my email?'), popupText);
			break;
		}
	},

	/**
	 * Function which displays information in the previewpanel.
	 * In the case of a encrypted message, we either show a button to unlock the certificate
	 * or shows the message that the message has been decrypted.
	 * If the message is signed we display information depending on the state of the verification.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record record which is displayed
	 */
	onSmimeInfo : function(record)
	{
		// Set button.record for use in onSmimeButton
		this.record = record;
		var smimeInfoBox = this.getEl();

		// Set smimeBox to empty value by default, to override previous S/MIME message text
		smimeInfoBox.update("");
		smimeInfoBox.removeClass('smime-info-good');
		smimeInfoBox.removeClass('smime-info-fatal');
		smimeInfoBox.removeClass('smime-info-partial');
		smimeInfoBox.removeClass('smime-info-info');

		if (!record || record.get('pgp') || record.get('pgp_message_class') || record.get('pgp_signed') || record.get('pgp_encrypted')) {
			return;
		}

		// retrieve smime json object
		var smimeInfo = record.get('smime');
		if (!record.isOpened() || !smimeInfo)
			return;
		var sender = record.getSender();

		// FIXME: refactor success, to status since that's probably a better description of the variable
		smimeInfoBox.addClass(Zarafa.plugins.smime.SmimeText.getStatusMessageClass(smimeInfo.success));
		var message = Zarafa.plugins.smime.SmimeText.getMessageInfo(smimeInfo.info);
		var algoTag = Zarafa.plugins.smime.SmimeText.formatAlgorithmTag(smimeInfo.algorithms);
		var isDecryptedSuccessfully = (smimeInfo.info === Zarafa.plugins.smime.SMIME_DECRYPT_SUCCESS);
		switch (smimeInfo.type) {
		case 'encrypted':
			// Empty smimeInfoBox
			if (smimeInfo.success === Zarafa.plugins.smime.SMIME_STATUS_BAD) {
				smimeInfoBox.update('<div class="icon_smime_encr_content"></div> ' + message);
				break;
			}
			if (isDecryptedSuccessfully) {
				var efailNote = '';
				if (smimeInfo.efail_warning) {
					efailNote = ' <span class="smime-efail-note">(' + _('CBC mode') + ')</span>';
				}
				// Decrypted messages are implicitly verified — show both badges
				smimeInfoBox.update(String.format('{0} &lt{1}&gt <div class="icon_smime_sign_content"></div><div class="icon_smime_decr_content"></div> {2}{3}{4}', sender.get('display_name'), sender.get('smtp_address'), message, efailNote, algoTag));
			} else {
				smimeInfoBox.update(String.format('{0} &lt{1}&gt <div class="icon_smime_encr_content"></div> {2}{3}', sender.get('display_name'), sender.get('smtp_address'), message, algoTag));
			}
			// Force the Attachmentlinks component to update, to view the attachments
			this.ownerCt.findByType('zarafa.attachmentlinks')[0].update(record, true);
			break;
		case 'signed':
			smimeInfoBox.update(String.format('{0} &lt{1}&gt <div class="icon_smime_sign_content"></div> {2}{3}', sender.get('display_name'), sender.get('smtp_address'), message, algoTag));
			break;
		case 'encryptsigned':
			smimeInfoBox.update(String.format('{0} &lt{1}&gt <div class="icon_smime_sign_content"></div> <div class="icon_smime_decr_content"></div> {2}{3}', sender.get('display_name'), sender.get('smtp_address'), message, algoTag));
			if (smimeInfo.success !== Zarafa.plugins.smime.SMIME_STATUS_BAD &&
			smimeInfo.success !== Zarafa.plugins.smime.SMIME_STATUS_PARTIAL) {
				// Force the Attachmentlinks component to update, to view the attachments
				this.ownerCt.findByType('zarafa.attachmentlinks')[0].update(record, true);
			}
			break;
		}
	},

	/**
	 * Function which collects all the recipients smtp_addresses in a list and sets them as 'smime'
	 * property in the mailrecord. Because the hook in PHP doesn't have updated recipienttable yet.
	 * Always append the logged-in user, so the user is able to view the sent encrypted mail in
	 * 'Sent Items'.
	 *
	 * @param {Zarafa.mailcreatecontentpanel} dialog
	 * @param {Zarafa.core.data.IPMRecord} record The record which is going to be sent
	 * @return {Boolean} Returns false if a public key is not found and stops the record from being sent
	 *
	 */
	onBeforeSendRecord : function(dialog, record) {
		if (!/^IPM\.Note\.deferSMIME(?:\.|$)/i.test(record.get('message_class') || '')) { return true; }
		if (record.get('pgp_sign') || record.get('pgp_encrypt')) {
			return false;
		}
		// Always append the currently logged in user.
		var user = container.getUser();
		var myself = {
			email: user.getSMTPAddress(),
			internal: true,
			username: container.getUser().getEmailAddress()
		};
		var recipients = [myself];

		var recipientStore = record.getRecipientStore();
		recipientStore.each(function(recip) {
			const addressType = recip.get('address_type');
			recipients.push(
				{
					email: recip.get('smtp_address'),
					internal: addressType === "ZARAFA" || addressType === "EX",
					username: recip.get('email_address')
				}
			);
		}, this);
		dialog.record.set('smime', recipients);

		// Pass algorithm selections to the backend
		var cipher = record.get('smime_cipher') || container.getSettingsModel().get('zarafa/v1/plugins/smime/default_cipher', '');
		var digest = record.get('smime_digest') || container.getSettingsModel().get('zarafa/v1/plugins/smime/default_digest', '');
		if (cipher) {
			dialog.record.set('smime_cipher', cipher);
		}
		if (digest) {
			dialog.record.set('smime_digest', digest);
		}

		return true;
	},

	/**
	 * Handler for the encrypt button, when clicked it sets the message_class to encrypted.
	 * If we press the button again we reset the message_class. When a user already has signed an email
	 * we set a special message_class on it to sign+encrypt
	 *
	 * @param {Ext.button} button
	 */
	onEncryptButton : function(button)
	{
		var dialog = this.getRespectiveDialog(button);
		var record = dialog.record;
		if (!record)
			return;
		if (record.get('pgp_sign') || record.get('pgp_encrypt')) {
			return;
		}

		switch (record.get('message_class')) {
		// Unselecting encrypt functionality
		case 'IPM.Note.deferSMIME':
		case 'IPM.Note.deferSMIME.SignedEncrypt':
			if (record.get('message_class') === 'IPM.Note.deferSMIME.SignedEncrypt') {
				record.set('message_class', 'IPM.Note.deferSMIME.MultipartSigned');
			} else {
				record.set('message_class', 'IPM.Note');
			}

			button.setIconClass('icon_smime_encrypt');
			// Reset smime property
			record.set('smime','');
			// Reset send action, otherwise the saveRecord will trigger a send when the user deselects encryption
			record.actions = {};

			dialog.saveRecord();
			break;

		// We want to encrypt (possibly also sign + encrypt)
		case 'IPM.Note.deferSMIME.MultipartSigned':
		case 'IPM.Note':
			var plugin = this;
			var user = container.getUser();
			var newClass = record.get('message_class') === 'IPM.Note' ?
				'IPM.Note.deferSMIME' : 'IPM.Note.deferSMIME.SignedEncrypt';

			container.getRequest().singleRequest(
				'pluginsmimemodule',
				'certificate',
				{
					'user' : user.getSMTPAddress()
				},
				new Zarafa.plugins.smime.data.SmimeResponseHandler({
					successCallback: function(response) {
						plugin.onEncryptCertificateCallback(dialog, button, newClass, response);
					}
				})
			);
			break;
		}
	},

	/**
	* successCallback function for the request to verify if a certificate exists for encryption.
	* If the certificate exists we can set the message_class and icon, otherwise notify the user.
	*
	* @param {Zarafa.mailcreatecontentpanel} dialog
	* @param {Ext.button} button
	* @param {String} messageClass
	* @param {Object} response Json object containing the response from PHP
	*/
	onEncryptCertificateCallback : function(dialog, button, messageClass, response) {
		if (dialog.isDestroyed || !dialog.record || dialog.record.get('pgp_sign') || dialog.record.get('pgp_encrypt')) {
			return;
		}
		if (response.status) {
			var record = dialog.record;
			record.set('message_class', messageClass);
			button.setIconClass('icon_smime_encrypt_selected');
			this.attachCompose(dialog);
			dialog.saveRecord();
		} else {
			container.getNotifier().notify('info.saved', _('S/MIME Message'), response.message);
		}
	},

	/**
	 * Handler for the sign button, when clicked it checks if the private certificate exists.
	 * If we have signing already set and click it again, we unset it.
	 * If encryption is already set, we set a special message_class for both signing and encryption.
	 *
	 * @param {Ext.button} button
	 */
	onSignButton : function(button)
	{
		var dialog = this.getRespectiveDialog(button);
		var record = dialog.record;
		if (!record) {
			dialog.saveRecord();
			return;
		}
		if (record.get('pgp_sign') || record.get('pgp_encrypt')) {
			return;
		}
		var plugin = this;
		var user = container.getUser();
		var request = function() {
			container.getRequest().singleRequest(
				'pluginsmimemodule',
				'certificate',
				{
					'user' : user.getSMTPAddress()
				},
				new Zarafa.plugins.smime.data.SmimeResponseHandler({
					successCallback : plugin.onCertificateCallback.createDelegate(button)
				})
			);
		};
		switch (record.get('message_class')) {
		// We want to sign
		case 'IPM.Note':
			button.message_class = 'IPM.Note.deferSMIME.MultipartSigned';
			request();
			break;
		// Encrypt + Sign
		case 'IPM.Note.deferSMIME':
			button.message_class = 'IPM.Note.deferSMIME.SignedEncrypt';
			request();
			break;
		case 'IPM.Note.deferSMIME.MultipartSigned':
			button.setIconClass('icon_smime_sign');
			record.set('message_class', 'IPM.Note');
			break;
		case 'IPM.Note.deferSMIME.SignedEncrypt':
			button.setIconClass('icon_smime_sign');
			record.set('message_class', 'IPM.Note.deferSMIME');
			break;
		}
		dialog.saveRecord();
	},

	/**
	 * successCallback function for the request to verify if a private certificate exists in the mapi userstore.
	 * If the response status is true the certificate exists and we will query the user for his passphrase.
	 *
	 * @param {Object} response Json object containing the response from PHP
	 */
	onCertificateCallback : function(response) {
		// TODO: improve functionality with less callbacks
		var btn = this;
		var dialog = btn.securityDialog;
		if (dialog && (dialog.isDestroyed || dialog.record.get('pgp_sign') || dialog.record.get('pgp_encrypt'))) { return; }
		if(response.status) {
			Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['plugin.smime.dialog.passphrasewindow'], btn, {manager: Ext.WindowMgr});
		} else {
			container.getNotifier().notify('info.saved', _('S/MIME Message'), response.message);
		}
	},

	/*
	 * Bid for the type of shared component
	 * and the given record.
	 * This will bid on calendar.dialogs.importevents
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent : function(type) {
		var bid = -1;

		switch(type) {
		case Zarafa.core.data.SharedComponentType['plugin.smime.dialog.passphrasewindow']:
			bid = 1;
			break;
		case Zarafa.core.data.SharedComponentType['plugin.smime.dialog.changepassphrasecontentpanel']:
			bid = 1;
			break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent : function(type) {
		var component;

		switch(type) {
		case Zarafa.core.data.SharedComponentType['plugin.smime.dialog.passphrasewindow']:
			component = Zarafa.plugins.smime.dialogs.PassphraseContentPanel;
			break;
		case Zarafa.core.data.SharedComponentType['plugin.smime.dialog.changepassphrasecontentpanel']:
			component = Zarafa.plugins.smime.dialogs.ChangePassphraseContentPanel;
			break;
		}

		return component;
	},

	/**
	 * Shows the message class icon of signed or encrypted email in the defaultcolumn
	 */
	showDefaultColumn : function()
	{
		return  {
			header : '<p class="icon_smime_settings">&nbsp;<span class="title">' + _('S/MIME Message') + '</span></p>',
			headerCls: 'zarafa-icon-column',
			dataIndex : 'message_class',
			width : 24,
			sortable : false,
			renderer :  function(value, p, record) {
				if (record.get('pgp') || record.get('pgp_message_class') || record.get('pgp_signed') || record.get('pgp_encrypted')) {
					return '';
				}
				var messageClass = record.get('message_class');
				if (messageClass === 'IPM.Note.SMIME' ||
				    messageClass === 'IPM.Note.deferSMIME' ||
				    messageClass === 'IPM.Note.SMIME.SignedEncrypt' ||
				    messageClass === 'IPM.Note.deferSMIME.SignedEncrypt') {
					p.css = 'icon_smime_encrypt';
				} else if (messageClass === 'IPM.Note.SMIME.MultipartSigned' ||
				    messageClass === 'IPM.Note.deferSMIME.MultipartSigned') {
					p.css = 'icon_smime_sign';
				}
				return '';
			},
			fixed : true,
			tooltip : _('S/MIME Message')
		};
	},

	/**
	 * Shows the message class icon of signed or encrypted or signed + encrypted email in the non defaultcolumn
	 *
	 * @param {string} insertionPoint name of insertion point
	 * @param {Zarafa.core.data.IPMRecord} record The record of a row
	 * @return {string} column entry
	 *
	 */
	showMessageClass : function(insertionPoint, record) {
		if (record.get('pgp') || record.get('pgp_message_class') || record.get('pgp_signed') || record.get('pgp_encrypted')) {
			return '<td style="width: 24px"></td>';
		}
		var messageClass = record.get('message_class');
		var icon = "";
		if (messageClass === 'IPM.Note.SMIME' ||
		    messageClass === 'IPM.Note.deferSMIME' ||
		    messageClass === 'IPM.Note.SMIME.SignedEncrypt' ||
		    messageClass === 'IPM.Note.deferSMIME.SignedEncrypt') {
			icon = 'icon_smime_encrypt';
		} else if (messageClass === 'IPM.Note.SMIME.MultipartSigned' ||
		    messageClass === 'IPM.Note.deferSMIME.MultipartSigned') {
			icon = 'icon_smime_sign';
		}

		return String.format('<td style="width: 24px"><div class="grid_compact {0}" style="height: 24px; width: 24px;">{1}</div></td>', icon, "");
	},

	/**
	 * Handler for digest algorithm selection from the split button menu.
	 * Stores the selection and enables signing if not already active.
	 *
	 * @param {Ext.menu.CheckItem} item the selected menu item
	 */
	onDigestSelect : function(item)
	{
		var dialog = this.getRespectiveDialog(item);
		if (!dialog || !dialog.record) {
			return;
		}
		dialog.record.set('smime_digest', item.digest);

		// Enable signing if not already active
		var mc = dialog.record.get('message_class');
		if (mc !== 'IPM.Note.deferSMIME.MultipartSigned' && mc !== 'IPM.Note.deferSMIME.SignedEncrypt') {
			var splitBtn = item.parentMenu.ownerCt;
			this.onSignButton(splitBtn);
		}
	},

	/**
	 * Handler for cipher algorithm selection from the split button menu.
	 * Stores the selection and enables encryption if not already active.
	 *
	 * @param {Ext.menu.CheckItem} item the selected menu item
	 */
	onCipherSelect : function(item)
	{
		var dialog = this.getRespectiveDialog(item);
		if (!dialog || !dialog.record) {
			return;
		}
		dialog.record.set('smime_cipher', item.cipher);

		// Enable encryption if not already active
		var mc = dialog.record.get('message_class');
		if (mc !== 'IPM.Note.deferSMIME' && mc !== 'IPM.Note.deferSMIME.SignedEncrypt') {
			var splitBtn = item.parentMenu.ownerCt;
			this.onEncryptButton(splitBtn);
		}
	},

	/**
	 * Helper function to retrieve dialog.
	 *
	 * @param {Ext.button} button Which just gets rendered
	 * @return {Zarafa.mailcreatecontentpanel} dialog which contains the button passed as parameter
	 */
	getRespectiveDialog : function(button) {
		if (button.securityDialog) { return button.securityDialog; }
		var parentToolbar = false;

		if (button.ownerCt instanceof Zarafa.core.ui.Toolbar) {
			parentToolbar = button.ownerCt;
		} else if (button.parentMenu) {
			// This handles split button menu items and "more" menu items.
			// Walk up: menu item -> menu -> split button/menu button -> toolbar
			var menuOwner = button.parentMenu.ownerCt;
			if (menuOwner instanceof Zarafa.core.ui.Toolbar) {
				parentToolbar = menuOwner;
			} else if (menuOwner && menuOwner.ownerCt instanceof Zarafa.core.ui.Toolbar) {
				parentToolbar = menuOwner.ownerCt;
			} else if (menuOwner && menuOwner.ownerCt && menuOwner.ownerCt.ownerCt) {
				parentToolbar = menuOwner.ownerCt.ownerCt;
			}
		}
		return parentToolbar ? parentToolbar.dialog : false;
	}
});

// Add property to record to MailRecord, where extra information is stored about S/MIME messages
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', [
	{name: 'smime', defaultValue: ''},
	{name: 'smime_cipher', type: 'string', defaultValue: ''},
	{name: 'smime_digest', type: 'string', defaultValue: ''}
]);

Zarafa.onReady(function() {
	Zarafa.plugins.smime.SMIME_STATUS_GOOD = 0;
	Zarafa.plugins.smime.SMIME_STATUS_PARTIAL = 1;
	Zarafa.plugins.smime.SMIME_STATUS_BAD = 2;
	Zarafa.plugins.smime.SMIME_DECRYPT_SUCCESS = 6;
	Zarafa.plugins.smime.SMIME_STATUS_INFO = 3;
	Zarafa.plugins.smime.CHANGE_CERTIFICATE_SUCCESS = 1;
	Zarafa.plugins.smime.CHANGE_CERTIFICATE_ERROR = 2;
	Zarafa.plugins.smime.CHANGE_CERTIFICATE_WRONG = 3;

	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'smime',
		displayName : _('S/MIME Plugin'),
		pluginConstructor : Zarafa.plugins.smime.SmimePlugin
	}));
});
