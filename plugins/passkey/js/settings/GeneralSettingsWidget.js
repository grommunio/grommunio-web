Ext.namespace('Zarafa.plugins.passkey.settings');

/**
 * @class Zarafa.plugins.passkey.settings.GeneralSettingsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * 
 * General settings widget for the Passkey plugin
 */
Zarafa.plugins.passkey.settings.GeneralSettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor: function(config) {
        config = config || {};

        Ext.applyIf(config, {
            title: _('Configure passkey authentication'),
            layout: 'form',
            items: [{
                xtype: 'displayfield',
                fieldLabel: '',
                value: _('Passkeys provide a secure and convenient way to authenticate without passwords. You can register multiple passkeys and use them to log into your account.'),
                htmlEncode: false,
                cls: 'zarafa-settings-widget-info'
            }, {
                xtype: 'fieldset',
                title: _('WebAuthn Support'),
                ref: 'webauthnFieldset',
                items: [{
                    xtype: 'displayfield',
                    ref: '../webauthnStatus',
                    fieldLabel: _('Browser Support'),
                    value: this.getWebAuthnSupportText()
                }]
            }, {
                xtype: "displayfield",
                hideLabel: true,
                value: "<hr />" + _("Activate or deactivate passkey authentication.") + "<br />&nbsp;"
            }, {
                xtype: "displayfield",
                fieldLabel: _("Current status"),
                value: this.getStatus(),
                htmlEncode: true,
                ref: "status",
                width: 250
            }, {
                xtype: "displayfield",
                hideLabel: true,
                value: ""
            }, {
                xtype: "button",
                text: _("Activation/Deactivation"),
                handler: this.activate,
                scope: this,
                width: 250
            },{
                xtype: 'fieldset',
                title: _('Registered Passkeys'),
                ref: 'passkeysFieldset',
                items: [{
                    xtype: 'button',
                    text: _('Register new Passkey'),
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
                            tooltip: _('Delete Passkey'),
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
     * Initialize the widget
     */
    initEvents: function() {
        Zarafa.plugins.passkey.settings.GeneralSettingsWidget.superclass.initEvents.call(this);

        // Load passkeys when widget is initialized
        this.loadPasskeys();
    },

    /**
     * Get WebAuthn support status text
     * @return {String} Support status text
     */
    getWebAuthnSupportText: function() {
        let config = Zarafa.plugins.passkey.data.Configuration;
        if (config.checkWebAuthnSupport()) {
            return '<span style="color: green;">' + _('Supported') + '</span>';
        } else {
            return '<span style="color: red;">' + _('Not supported - Please use a modern browser') + '</span>';
        }
    },

    /**
     * Handle register passkey button click
     */
    onRegisterPasskey: function() {
        if (!Zarafa.plugins.passkey.data.Configuration.checkWebAuthnSupport()) {
            Ext.Msg.alert(_('WebAuthn not Supported'), _('Your browser does not support WebAuthn.'));
            return;
        }

        Ext.Msg.prompt(_('Register Passkey'), _('Enter a name for this passkey:'), function(btn, text) {
            if (btn === 'ok' && text) {
                this.registerNewPasskey(text);
            }
        }, this);
    },

    /**
     * Register a new passkey
     * @param {String} name Name for the passkey
     */
    registerNewPasskey: function(name) {
        let config = Zarafa.plugins.passkey.data.Configuration.getWebAuthnConfig();
        let userInfo = Zarafa.plugins.passkey.data.Configuration.getUserInfo();
        let challenge = Zarafa.plugins.passkey.data.Configuration.generateChallenge();

        let createOptions = {
            publicKey: {
                challenge: challenge,
                rp: {
                    id: config.rpId,
                    name: config.rpName
                },
                user: userInfo,
                pubKeyCredParams: [{
                    type: 'public-key',
                    alg: -7 // ES256
                }, {
                    type: 'public-key',
                    alg: -257 // RS256
                }],
                timeout: config.timeout,
                attestation: 'direct',
                authenticatorSelection: {
                    userVerification: config.userVerification
                }
            }
        };

        if (config.authenticatorAttachment) {
            createOptions.publicKey.authenticatorSelection.authenticatorAttachment = config.authenticatorAttachment;
        }

        navigator.credentials.create(createOptions).then(function(credential) {
            let credentialData = {
                id: credential.id,
                rawId: Zarafa.plugins.passkey.data.Configuration.arrayBufferToBase64Url(credential.rawId),
                type: credential.type,
                response: {
                    attestationObject: Zarafa.plugins.passkey.data.Configuration.arrayBufferToBase64Url(credential.response.attestationObject),
                    clientDataJSON: Zarafa.plugins.passkey.data.Configuration.arrayBufferToBase64Url(credential.response.clientDataJSON)
                }
            };

            this.registerPasskey(credentialData, name, function(success, message) {
                if (success) {
                    Ext.Msg.alert(_('Success'), message);
                    this.loadPasskeys();
                } else {
                    Ext.Msg.alert(_('Error'), message);
                }
            }, this);
        }.createDelegate(this)).catch(function(error) {
            Ext.Msg.alert(_('Error'), _('Failed to create passkey: ') + error.message);
        });
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

    getStatus: function () {
        return (Zarafa.plugins.passkey.data.Configuration.isActivated() ? _("Activated") : _("Deactivated"));
    },

    activate: function () {
        container.getRequest().singleRequest("passkeymodule", "activate", {}, new Zarafa.plugins.passkey.data.ResponseHandler({
            successCallback: this.setStatus.createDelegate(this)
        }));
    },

    setStatus: function (a) {
        Zarafa.plugins.passkey.data.Configuration.gotIsActivated(a);
        this.status.setValue(this.getStatus());
        container.getNotifier().notify("info.saved", _("Passkey authentication") + ": " + this.getStatus(),
            _("Current status") + ": " + this.getStatus());
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
     * Register a new passkey
     * @param {Object} credentialData WebAuthn credential data
     * @param {String} name Friendly name for the passkey
     * @param {Function} callback Callback function
     * @param {Object} scope Callback scope
     */
    registerPasskey: function(credentialData, name, callback, scope) {
        this.sendRequest('register', {
            credential_data: JSON.stringify(credentialData),
            name: name
        }, callback, scope);
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
	 * Renderer for the time column. Adds a recurrence icon and a private icon if applicable
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @private
	 */
	timeRenderer: function (value)
	{
        let dateValue = new Date(value * 1000);
		return dateValue.toLocaleString();
	}
});

Ext.reg('Zarafa.plugins.passkey.generalsettingswidget', Zarafa.plugins.passkey.settings.GeneralSettingsWidget);
