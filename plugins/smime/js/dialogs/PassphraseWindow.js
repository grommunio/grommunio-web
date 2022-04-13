Ext.namespace('Zarafa.plugins.smime.dialogs');

/**
 * @class Zarafa.plugins.smime.dialogs.PassphraseWindow
 * @extends Zarafa.core.ui.ContentPanel
 *
 * The content panel which asks the user for his passphrase and verifies if it's correct.
 * @xtype smime.passphrasewindow
 */
Zarafa.plugins.smime.dialogs.PassphraseWindow = Ext.extend(Ext.Panel, {

	/**
	 * cfg {Ext.Button} btn the smime security dropdown button
	 */
	btn : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config) {
		config = config || {};

		this.btn = config.record;

		Ext.applyIf(config, {
			xtype: 'smime.passphrasewindow',
			layout: 'fit',
			border: false,
			items: this.getInnerItems(),
			buttons : [{
				type: 'submit',
				text: _('Submit', 'plugin_smime'),
				cls: 'zarafa-action passphrase_submit',
				handler: this.checkPassphrase,
				scope: this
			},{
				text: _('Cancel', 'plugin_smime'),
				cls: 'passphrase_cancel',
				handler: this.onCancel,
				scope: this
			}],
			listeners: {
				scope: this,
				beforedestroy: this.onBeforeDestroy
			}
		});

		Zarafa.plugins.smime.dialogs.PassphraseWindow.superclass.constructor.call(this, config);
	},

	/**
	 * Helper function which provide necessary inner items based on the detected browser.
	 * There are different expectations from browser to prompt for password.
	 * @return {Array} returns array of the inner items which will be rendered
	 */
	getInnerItems : function()
	{
		var innerItems = [];
		var passwordSaveEnabled = container.getSettingsModel().get('zarafa/v1/plugins/smime/passphrase_cache');

		if ( Ext.isGecko && passwordSaveEnabled ) {
			var url = container.getBaseURL();
			url = Ext.urlAppend(url, 'load=custom&name=smime_passphrase');

			innerItems.push({
				xtype : "box",
				autoEl : {
					tag : "iframe",
					style : "border-width: 0px; height:100%; width:100%",
					src: url
				},
				listeners : {
					render : this.onIframeRendered,
					scope : this
				}
			});
		} else {
			innerItems.push(this.createForm());
		}

		return innerItems;
	},

	/**
	 * Event handler for the 'destroy' event of the {@link Zarafa.plugins.smime.dialogs.PassphraseWindow}
	 * Will {@link Zarafa.core.BrowserWindowMgr.unRegister} the iframe from the
	 * {@link Zarafa.core.BrowserWindowMgr}
	 * @private
	 */
	onBeforeDestroy : function()
	{
		// If we created an iframe, we must unregister it from the BrowserWindowMgr
		if ( Ext.isDefined(this.windowName) ){
			var parentWindow = this.getEl().dom.ownerDocument.defaultView;
			Zarafa.core.BrowserWindowMgr.unRegister(this.windowName);
			Zarafa.core.BrowserWindowMgr.setActive(parentWindow.name);
		}
	},

	/**
	 * Event handler which is triggered when the user presses the Cancel button
	 * {@link Ext.Button}. This will close the {@link Zarafa.plugins.smime.dialogs.PassphraseWindow dialog}
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	},

	/**
	 * Handler function which executes after the {@link Ext.Component} gets rendered.
	 * This will generate and add a form element along with necessary form-items into
	 * the underlying iframe element.
	 * @param {Ext.Component|HTMLElement} component which gets rendered into this window
	 */
	onIframeRendered : function(component) {
		var iframeElement = Ext.isDefined(component.getEl) ? component.el : component;

		Ext.EventManager.on(iframeElement, 'load', function(){

			// Create a unique name for the iframe window that can be used by the Zarafa.core.BrowserWindowMgr
			this.windowName = 'smime-passphrasewindow-'+Zarafa.plugins.smime.dialogs.PassphraseWindow.iframeCounter++;
			iframeElement.dom.contentWindow.name = this.windowName;
			Zarafa.core.BrowserWindowMgr.browserWindows.add(this.windowName, iframeElement.dom.contentWindow);
			Zarafa.core.BrowserWindowMgr.setActive(this.windowName);
			Zarafa.core.BrowserWindowMgr.initExtCss(iframeElement.dom.contentWindow);

			// Disable contextmenu globaly in the iframe.
			Ext.getBody().on('contextmenu', Zarafa.core.BrowserWindowMgr.onBodyContextMenu, this);

			// Create a viewport for the iframe window that will take care of the resizing
			new Zarafa.plugins.smime.ui.Viewport({
				layout: 'fit',
				cls: 'k-smime-viewport',
				body: iframeElement.dom.contentDocument.body,
				items: [
					this.createForm()
				]
			});
		}, this);

	},

	/**
	 * Returns the config object for the {@link Ext.form.FormPanel} for
	 * the passphrase window.
	 */
	createForm : function()
	{
		var passwordSaveEnabled = container.getSettingsModel().get('zarafa/v1/plugins/smime/passphrase_cache');

		return {
			// We need a real form to trigger autofill on browsers, if the user does not want to
			// use autofill we will not use a form to avoid saving the password.
			xtype : passwordSaveEnabled ? 'smime.form' : 'panel',
			url : Ext.urlAppend(container.getBaseURL(), 'load=custom&name=smime_passphrasecheck'),
			method : 'POST',
			border: false,
			layout: 'form',
			items : [{
				xtype: 'textfield',
				inputType : 'text',
				cls: 'username',
				name : 'username',
				hidden : true,
				value : container.getUser().getSMTPAddress()
			},{
				xtype: 'textfield',
				inputType: 'password',
				cls: 'certificate_passphrase',
				defaultAutoCreate : {
					tag: 'input',
					type: 'password',
					size: '20',
					autocomplete: passwordSaveEnabled ? 'on' : 'nope',
					placeholder: _('Certificate passphrase', 'plugin_smime')
				},
				name : 'spassword',
				hideLabel : true,
				anchor : '100%',
				listeners : {
					scope: this,
					afterrender: this.onAfterRenderPasswordField,
					specialkey: this.onSpecialKey
				}
			},{
				// Firefox needs a submit button in the form to start autocomplete on submit,
				// so we add a hidden one.
				xtype: 'button',
				type: 'submit',
				hidden: true,
				ref: 'submitBtn'
			}],
			listeners : {
				scope: this,
				afterrender: function(panel){
					this.formPanel = panel;
				}
			}
		};
	},

	/**
	 * Event handler for the afterrender event of the password field. Will add
	 * the password, placeholder and autocomplete attributes to the password field
	 * @param {Ext.form.TextField} field The password field
	 */
	onAfterRenderPasswordField : function(field)
	{
		// Make sure the passphrase ref will point to the password field, even
		// if we use an iframe
		this.passphrase = field;

		// Focus the password field, so the user can hit the keys right away
		setTimeout(function() {
			field.focus();
		}, 500);

		// Activate the main browser window again, so the user can move the passphrase window
		var parentWindow = this.getEl().dom.ownerDocument.defaultView;
		Zarafa.core.BrowserWindowMgr.setActive(parentWindow.name);

		// Make sure we unregister the iframe window when the parent window is unloaded
		// (e.g when the popout window is closed)
		parentWindow.addEventListener('unload', function(){
			this.onBeforeDestroy();
		}.bind(this));
	},

	/**
	 * Function which checks if the user inputs an enter in the password textfield
	 * And then checks if a valid passphrase has been entered.
	 * @param {Ext.form.TextField} field
	 * @param {Ext.EventObject} eventobj
	 */
	onSpecialKey : function(field, eventobj)
	{
		if(eventobj.getKey() === eventobj.ENTER) {
			this.checkPassphrase(field);
		}
	},

	/**
	 * Function which calls a request to PHP which verifies if the supplied passphrase is correct.
	 * Calls onPassphraseCallback if there is a succesCallback.
	 */
	checkPassphrase : function() {
		var user = container.getUser();
		container.getRequest().singleRequest(
			'pluginsmimemodule',
			'passphrase',
			{
				'user' : user.getSMTPAddress(),
				'passphrase' : this.passphrase.getValue()
			},
			new Zarafa.plugins.smime.data.SmimeResponseHandler({
				successCallback : this.onPassphraseCallback.createDelegate(this)
			})
		);
	},

	/**
	 * successCallback function for the request to verify if a private certificate passphrase is correct
	 * If the response status is true, the contentpanel will be closed and the record message_class will be set
	 * and the record is saved.
	 * Otherwise the inputfield will be reset.
	 * @param {Object} response Json object containing the response from PHP
	 */
	onPassphraseCallback : function(response) {
		if(response.status) {
			if(this.btn instanceof Zarafa.core.data.IPMRecord) {
				this.btn.open({forceLoad: true});
			} else {
				var owner = this.btn.ownerCt;
				var record = owner.record;
				if (!record) {
					// This is the case where button belongs to the "more" menu.
					// Get the dialog from menu.
					var moreMenu = this.btn.parentMenu;
					var parentToolbar = moreMenu.ownerCt.ownerCt;
					record = parentToolbar.dialog.record;
				}
				record.set('message_class', this.btn.message_class);
				record.save();
				this.btn.setIconClass('icon_smime_sign_selected');
			}

			if ( this.formPanel.getXType() === 'smime.form' ){
				// Submit the form so the passphrase can be saved by FireFox. Submit by clicking
				// the hidden submit button in the form.
				this.formPanel.submitBtn.getEl().down('div').down('em').down('button').dom.click();
			}

			this.dialog.close();
		} else {
			if(this.passphrase) {
				this.passphrase.reset();
			}
			container.getNotifier().notify('error.connection', _('S/MIME Message', 'plugin_smime'), _('The passphrase you typed is incorrect. Please try again.', 'plugin_smime'));
		}
	}
});

Ext.reg('smime.passphrasewindow', Zarafa.plugins.smime.dialogs.PassphraseWindow);

// Counter that we use to give the iframe window a unique name
Zarafa.plugins.smime.dialogs.PassphraseWindow.iframeCounter = 0;
