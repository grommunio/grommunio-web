Ext.namespace('Zarafa.plugins.passkey.settings');

/**
 * @class Zarafa.plugins.passkey.settings.GeneralSettingsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.plugins.passkey.generalsettingswidget
 *
 * General settings widget for the Passkey plugin
 */
Zarafa.plugins.passkey.settings.GeneralSettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @cfg {Zarafa.settings.SettingsContext} settingsContext The settings
	 * context which is used to hook into the save/discard lifecycle.
	 */
	settingsContext: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Configure passkey authentication'),
			layout: 'form',
			items: [{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('Passkeys provide a secure and convenient way to authenticate without passwords. You can register multiple passkeys and use them to log into your account.'),
				htmlEncode: false,
				cls: 'zarafa-settings-widget-info'
			}, {
				xtype: 'fieldset',
				title: _('Browser support'),
				ref: 'webauthnFieldset',
				items: [{
					xtype: 'displayfield',
					ref: '../webauthnStatus',
					fieldLabel: _('WebAuthn'),
					value: this.getWebAuthnSupportText()
				}]
			}, {
				xtype: 'fieldset',
				title: _('Passkey authentication'),
				ref: 'activateFieldset',
				items: [{
					xtype: 'displayfield',
					fieldLabel: _('Current status'),
					value: this.getStatus(),
					htmlEncode: true,
					ref: '../status',
					width: 250
				}, {
					xtype: 'button',
					text: this.getActivateButtonText(),
					ref: '../activateButton',
					handler: this.onToggleActivation,
					scope: this,
					width: 250
				}]
			}, {
				xtype: 'fieldset',
				title: _('Registered passkeys'),
				ref: 'passkeysFieldset',
				items: [{
					xtype: 'button',
					text: _('Register new passkey'),
					ref: '../registerButton',
					handler: this.onRegisterPasskey,
					scope: this
				}, {
					xtype: 'grid',
					ref: '../passkeysGrid',
					height: 200,
					store: new Ext.data.ArrayStore({
						fields: ['id', 'name', 'created']
					}),
					columns: [{
						header: _('Name'),
						dataIndex: 'name',
						width: 150
					}, {
						header: _('Created'),
						dataIndex: 'created',
						width: 300,
						renderer: this.timeRenderer
					}, {
						xtype: 'actioncolumn',
						width: 50,
						items: [{
							xtype: 'button',
							iconCls: 'icon_delete',
							tooltip: _('Delete passkey'),
							handler: this.onDeletePasskey,
							scope: this
						}]
					}],
					viewConfig: {
						emptyText: _('No passkeys registered')
					}
				}]
			}]
		});

		Zarafa.plugins.passkey.settings.GeneralSettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the widget events. Loads the registered passkeys once the grid
	 * has rendered rather than eagerly in {@link #initEvents}.
	 */
	initEvents: function()
	{
		Zarafa.plugins.passkey.settings.GeneralSettingsWidget.superclass.initEvents.call(this);

		// Load passkeys once the grid is rendered, so we don't fetch data for
		// a category the user may never open.
		this.mon(this.passkeysGrid, 'render', this.loadPasskeys, this);

		// Refresh the activation status/button from the server when the widget
		// renders, so the labels reflect server truth regardless of whether the
		// one-shot Configuration.init() call has completed yet.
		this.mon(this, 'render', this.loadActivationStatus, this);
	},

	/**
	 * Fetch the current activation status from the server and sync the status
	 * field and toggle button.
	 */
	loadActivationStatus: function()
	{
		container.getRequest().singleRequest("passkeymodule", "isactivated", {}, new Zarafa.plugins.passkey.data.ResponseHandler({
			successCallback: (function (response) {
				Zarafa.plugins.passkey.data.Configuration.gotIsActivated(response);
				this.status.setValue(this.getStatus());
				this.activateButton.setText(this.getActivateButtonText());
			}).createDelegate(this)
		}));
	},

	/**
	 * Get WebAuthn support status text
	 * @return {String} Support status text
	 */
	getWebAuthnSupportText: function()
	{
		var config = Zarafa.plugins.passkey.data.Configuration;
		if (config.checkWebAuthnSupport()) {
			return '<span class="passkey-status-supported">' + _('Supported') + '</span>';
		}

		return '<span class="passkey-status-not-supported">' + _('Not supported - please use a modern browser') + '</span>';
	},

	/**
	 * Handle register passkey button click
	 */
	onRegisterPasskey: function()
	{
		if (!Zarafa.plugins.passkey.data.Configuration.checkWebAuthnSupport()) {
			Ext.Msg.alert(_('WebAuthn not supported'), _('Your browser does not support WebAuthn.'));

			return;
		}

		Ext.Msg.prompt(_('Register passkey'), _('Enter a name for this passkey:'), function(btn, text) {
			if (btn === 'ok' && text) {
				this.registerNewPasskey(text);
			}
		}, this);
	},

    /**
     * Register a new passkey as a second factor. Uses a server-issued, single-use
     * challenge from the PHP module, verifies attestation server-side, and stores
     * the credential in the user's settings. No password / PRF / passwordless login.
     * @param {String} name Name for the passkey
     */
    registerNewPasskey: function (name) {
        var self = this;
        var Config = Zarafa.plugins.passkey.data.Configuration;
        var config = Config.getWebAuthnConfig();
        var userInfo = Config.getUserInfo();

        // 1. Ask the PHP module for a server-minted challenge.
        this.sendRequest('challenge', {}, function (success, challengeB64) {
            if (!success || !challengeB64) {
                Ext.Msg.alert(_('Error'), _('Failed to create passkey: ') + _('could not obtain a challenge'));
                return;
            }
            var createOptions = {
                publicKey: {
                    challenge: new Uint8Array(Config.base64UrlToArrayBuffer(challengeB64)),
                    rp: { id: config.rpId, name: config.rpName },
                    user: userInfo,
                    pubKeyCredParams: [
                        { type: 'public-key', alg: -7 },
                        { type: 'public-key', alg: -257 }
                    ],
                    timeout: config.timeout,
                    attestation: 'none',
                    authenticatorSelection: {
                        userVerification: config.userVerification,
                        residentKey: 'required',
                        requireResidentKey: true
                    }
                }
            };
            if (config.authenticatorAttachment) {
                createOptions.publicKey.authenticatorSelection.authenticatorAttachment = config.authenticatorAttachment;
            }
            navigator.credentials.create(createOptions).then(function (credential) {
                var credentialData = {
                    id: credential.id,
                    rawId: Config.arrayBufferToBase64Url(credential.rawId),
                    type: credential.type,
                    response: {
                        attestationObject: Config.arrayBufferToBase64Url(credential.response.attestationObject),
                        clientDataJSON: Config.arrayBufferToBase64Url(credential.response.clientDataJSON)
                    }
                };
                self.sendRequest('register', {
                    credential_data: JSON.stringify(credentialData),
                    name: name
                }, function (ok, message) {
                    if (ok) {
                        Ext.Msg.alert(_('Success'), _('Passkey registered.'));
                        this.loadPasskeys();
                    } else {
                        Ext.Msg.alert(_('Error'), message || _('Failed to register passkey.'));
                    }
                }, self);
            }).then(undefined, function (error) {
                Ext.Msg.alert(_('Error'), _('Failed to create passkey: ') + (error && error.message ? error.message : error));
            });
        }, this);
    },

    /**
     * Handle delete passkey
     * @param {Ext.grid.GridPanel} grid The grid
     * @param {Number} rowIndex Row index
     * @param {Number} colIndex Column index
     */
    onDeletePasskey: function(grid, rowIndex, colIndex) {
        let record = grid.getStore().getAt(rowIndex);
        let credentialId = record.get('id');
        let name = record.get('name');

        Ext.Msg.confirm(_('Delete Passkey'), String.format(_('Are you sure you want to delete the passkey "{0}"?'), name), function(btn) {
            if (btn === 'yes') {
                this.deletePasskey(credentialId, function(success, message) {
                    if (success) {
                        Ext.Msg.alert(_('Success'), message);
                        this.loadPasskeys();
                    } else {
                        Ext.Msg.alert(_('Error'), message);
                    }
                }, this);
            }
        }, this);
    },

    /**
     * Load passkeys from server
     */
    loadPasskeys: function() {
        this.listPasskeys(function(success, data) {
            if (success) {
                let store = this.passkeysGrid.getStore();
                store.removeAll();

                if (Ext.isArray(data)) {
                    Ext.each(data, function(passkey) {
                        store.add(new store.recordType(passkey));
                    });
                }
            }
        }, this);
    },

    /**
     * @return {String} The localized current activation status.
     */
    getStatus: function () {
        return (Zarafa.plugins.passkey.data.Configuration.isActivated() ? _("Activated") : _("Deactivated"));
    },

    /**
     * @return {String} The stateful label for the activation button, reflecting
     * the action the user will perform (activate when off, deactivate when on).
     */
    getActivateButtonText: function () {
        return (Zarafa.plugins.passkey.data.Configuration.isActivated() ? _("Deactivate") : _("Activate"));
    },

    /**
     * Toggle passkey activation. This is an imperative server operation rather
     * than a stored setting, so - like the passwd plugin's save - it reuses the
     * {@link Zarafa.settings.ui.SettingsCategory saving mask} of the owning
     * category to give the standard "Saving..."/"Saved" feedback.
     */
    onToggleActivation: function () {
        this.ownerCt.displaySavingMask();

        container.getRequest().singleRequest("passkeymodule", "activate", {}, new Zarafa.plugins.passkey.data.ResponseHandler({
            successCallback: this.onActivationDone.createDelegate(this)
        }));
    },

    /**
     * Callback for {@link #onToggleActivation}. Updates the status/button and
     * hides the saving mask (which shows the standard "Saved" notification).
     * @param {Object} response Server response carrying the new isActivated flag.
     */
    onActivationDone: function (response) {
        Zarafa.plugins.passkey.data.Configuration.gotIsActivated(response);
        this.status.setValue(this.getStatus());
        this.activateButton.setText(this.getActivateButtonText());
        this.ownerCt.hideSavingMask(true);
    },

    /**
     * Handle passkey registration response
     * @param {Object} response Server response
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    handleRegistrationResponse: function(response, callback, scope) {
        if (response && response.success) {
            if (callback) {
                callback.call(scope || this, true, response.message || _('Passkey registered successfully'));
            }
        } else {
            let errorMsg = response && response.message ? response.message : _('Failed to register passkey');
            if (callback) {
                callback.call(scope || this, false, errorMsg);
            }
        }
    },

    /**
     * Handle passkey authentication response
     * @param {Object} response Server response
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    handleAuthenticationResponse: function(response, callback, scope) {
        if (response && response.success) {
            if (callback) {
                callback.call(scope || this, true, response.message || _('Authentication successful'));
            }
        } else {
            let errorMsg = response && response.message ? response.message : _('Authentication failed');
            if (callback) {
                callback.call(scope || this, false, errorMsg);
            }
        }
    },

    /**
     * Handle passkey deletion response
     * @param {Object} response Server response
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    handleDeletionResponse: function(response, callback, scope) {
        if (response && response.success) {
            if (callback) {
                callback.call(scope || this, true, response.message || _('Passkey deleted successfully'));
            }
        } else {
            let errorMsg = response && response.message ? response.message : _('Failed to delete passkey');
            if (callback) {
                callback.call(scope || this, false, errorMsg);
            }
        }
    },

    /**
     * Handle passkey list response
     * @param {Object} response Server response
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    handleListResponse: function(response, callback, scope) {
        if (response && response.success) {
            let passkeys = response.passkeys || [];
            if (callback) {
                callback.call(scope || this, true, passkeys);
            }
        } else {
            let errorMsg = response && response.message ? response.message : _('Failed to load passkeys');
            if (callback) {
                callback.call(scope || this, false, errorMsg);
            }
        }
    },

    /**
     * Send request to server
     * @param {String} action Action to perform
     * @param {Object} data Request data
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    sendRequest: function(action, data, callback, scope) {
        let requestData = Ext.apply({
            zarafa_action: 'passkey',
            passkey_action: action
        }, data || {});

        container.getRequest().singleRequest(
            'passkeymodule',
            'passkey',
            requestData,
            new Zarafa.core.data.AbstractResponseHandler({
                doPasskey: function(response) {
                    switch (action) {
                        case 'register':
                            this.handleRegistrationResponse(response, callback, scope);
                            break;
                        case 'authenticate':
                            this.handleAuthenticationResponse(response, callback, scope);
                            break;
                        case 'delete':
                            this.handleDeletionResponse(response, callback, scope);
                            break;
                        case 'list':
                            this.handleListResponse(response, callback, scope);
                            break;
                        case 'challenge':
                            if (callback) {
                                callback.call(scope || this, !!(response && response.success), response ? response.challenge : null);
                            }
                            break;
                        default:
                            if (callback) {
                                callback.call(scope || this, false, _('Unknown action'));
                            }
                    }
                }.createDelegate(this)
            })
        );
    },

    /**
     * Delete a passkey
     * @param {String} credentialId Credential ID to delete
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    deletePasskey: function(credentialId, callback, scope) {
        this.sendRequest('delete', {
            credential_id: credentialId
        }, callback, scope);
    },

    /**
     * Get list of user's passkeys
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    listPasskeys: function(callback, scope) {
        this.sendRequest('list', {}, callback, scope);
    },

    /**
     * Renderer for the "Created" column. Formats the stored timestamp as a
     * localized date/time string.
     *
     * @param {Mixed} value The creation timestamp of the passkey
     * @return {String} The formatted date, or an empty string when unset
     * @private
     */
    timeRenderer: function (value)
    {
        return value ? new Date(value).toLocaleString() : '';
    }
});

Ext.reg('zarafa.plugins.passkey.generalsettingswidget', Zarafa.plugins.passkey.settings.GeneralSettingsWidget);
