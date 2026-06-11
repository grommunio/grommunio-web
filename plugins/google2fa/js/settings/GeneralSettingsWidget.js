Ext.namespace("Zarafa.plugins.google2fa.settings");

/**
 * @class Zarafa.plugins.google2fa.settings.SettingsGoogle2FAWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * Widget view in settings for two-factor authentication
 */
Zarafa.plugins.google2fa.settings.GeneralSettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor: function (config) {
        config = config || {};
        Ext.applyIf(config, {
            title: _('Configure two-factor authentication'),
            layout: "form",
            items: [{
                xtype: "displayfield",
                hideLabel: true,
                value: _('The two-factor authentication provides an additional protection for the WebApp.') + "<br />" +
                    _('After activation you need next to your password an one-time code to log in.') + "<br />" + "<br />" +
                    _('To generate an one-time code, you have to configure a second device, usually a smartphone.') + "<br />&nbsp;"
            }, {
                xtype: "button",
                text: _('Configuration'),
                handler: this.openConfigurationDialog,
                scope: this,
                width: 250
            }, {
                xtype: "displayfield",
                hideLabel: true,
                value: "<hr />" + _('Activate or deactivate the two-factor authentication.') + "<br />&nbsp;"
            }, {
                xtype: "displayfield",
                fieldLabel: _('Current status'),
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
                text: _('Activate / Deactivate'),
                handler: this.activate,
                scope: this,
                width: 250
            }, {
                xtype: "displayfield",
                hideLabel: true,
                value: "<hr />" + _('You can completely reset the configuration.') + "<br />" +
                    _('This deletes the secret key and deactivates the two-factor authentication.') + "<br />" +
                    _('If fundamental changes in the configuration were made, for example the encryption type, this step might be useful.') + "<br />&nbsp;"
            }, {
                xtype: "button",
                text: _('Reset'),
                handler: this.openResetConfigurationDialog,
                scope: this,
                width: 250
            }]
        });
        Zarafa.plugins.google2fa.settings.GeneralSettingsWidget.superclass.constructor.call(this, config);
    },
    getStatus: function () {
        return (Zarafa.plugins.google2fa.data.Configuration.isActivated() ? _('Activated') : _('Deactivated'));
    },
    openResetConfigurationDialog: function () {
        Zarafa.common.dialogs.MessageBox.show({
            title: _('Reset'),
            msg: _('Do you really want to reset the configuration?'),
            icon: Zarafa.common.dialogs.MessageBox.QUESTION,
            buttons: Zarafa.common.dialogs.MessageBox.YESNO,
            fn: this.resetConfiguration,
            scope: this
        });
    },
    resetConfiguration: function (a) {
        if (a === "yes") {
            container.getRequest().singleRequest("google2famodule", "resetconfiguration", {}, new Zarafa.plugins.google2fa.data.ResponseHandler({
                successCallback: this.openResetConfigurationFinishDialog.createDelegate(this)
            }));
        }
    },
    openResetConfigurationFinishDialog: function (a) {
        Zarafa.plugins.google2fa.data.Configuration.gotIsActivated(a);
        this.status.setValue(this.getStatus());
        Zarafa.common.dialogs.MessageBox.show({
            title: _('Reset'),
            msg: _('The configuration has been reset.'),
            icon: Zarafa.common.dialogs.MessageBox.INFO,
            buttons: Zarafa.common.dialogs.MessageBox.OK,
            scope: this
        });
    },
    openConfigurationDialog: function () {
        container.getRequest().singleRequest("google2famodule", "getsecret", {}, new Zarafa.plugins.google2fa.data.ResponseHandler({
            successCallback: this.openConfigurationDialogX.createDelegate(this)
        }));
    },
    openConfigurationDialogX: function (a) {
        let secret = atob(a.secret);
        let qRCodeGoogleUrl = atob(a.qRCodeGoogleUrl);
        Zarafa.common.dialogs.MessageBox.addCustomButtons({
            title: _('Configuration'),
            msg: _('Please install an authentication App on second device:') + "<br />" +
                _('Google Authenticator (Android, iOS, BlackBerry), Authenticator (Windows Phone)') + "<hr />" +
                _('Open and configure the authentication app by scanning the QR code below.') + "<br /><br />" +
                "<img src='" + qRCodeGoogleUrl + "' /><br /><br />" +
                _('Alternatively, you can manually create an account with the following information.') + "<br /><br />" +
                _('Application') + ": " + a.application + "<br />" +
                _('Account') + ": " + a.username + "<br />" + _('Key') + ": " + secret + "<hr />" +
                _('Afterwards test the function with a generated code to ensure that the configurations are correct.'),
            fn: this.openVerifyCodeDialog,
            customButton: [{
                text: _('Test generated code'),
                name: "verify"
            }],
            scope: this,
            width: 500
        });
    },
    openVerifyCodeDialog: function (a) {
        if (a === "verify")
            Zarafa.common.dialogs.MessageBox.prompt(_('Test generated code'), _('Please enter code'), this.verifyCode, this);
    },
    verifyCode: function (a, b) {
        if (a === "ok") {
            container.getRequest().singleRequest("google2famodule", "verifycode", {code: b}, new Zarafa.plugins.google2fa.data.ResponseHandler({
                successCallback: this.openResponseDialog.createDelegate(this)
            }));
        }
    },
    openResponseDialog: function (a) {
        if (a.isCodeOK) {
            Zarafa.common.dialogs.MessageBox.show({
                title: _('Test generated code'),
                msg: _('Valid code, you can use the two-factor authentication.'),
                icon: Zarafa.common.dialogs.MessageBox.INFO,
                buttons: Zarafa.common.dialogs.MessageBox.OK,
                scope: this,
                width: 350
            });
        } else {
            Zarafa.common.dialogs.MessageBox.show({
                title: _('Test generated code'),
                msg: _('Invalid code, please check code.') + "<br />" +
                    _('You can use a code only one-time.') + "<br />" +
                    _('Please make sure that time from of server and second device are correct.'),
                icon: Zarafa.common.dialogs.MessageBox.ERROR,
                buttons: Zarafa.common.dialogs.MessageBox.OK,
                scope: this,
                width: 350
            });
        }
    },
    activate: function () {
        container.getRequest().singleRequest("google2famodule", "activate", {}, new Zarafa.plugins.google2fa.data.ResponseHandler({
            successCallback: this.setStatus.createDelegate(this)
        }));
    },
    setStatus: function (a) {
        Zarafa.plugins.google2fa.data.Configuration.gotIsActivated(a);
        this.status.setValue(this.getStatus());
        container.getNotifier().notify("info.saved", _('Two-factor authentication') + ": " + this.getStatus(),
            _('Current status') + ": " + this.getStatus());
    }
});
Ext.reg("Zarafa.plugins.google2fa.generalsettingswidget", Zarafa.plugins.google2fa.settings.GeneralSettingsWidget);
