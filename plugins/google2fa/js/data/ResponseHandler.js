Ext.namespace("Zarafa.plugins.google2fa.data");

/**
 * @class Zarafa.plugins.google2fa.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Response handler for communication with server
 */
Zarafa.plugins.google2fa.data.ResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler,
    {
        /**
         * @cfg {Function} successCallback The function which
         * will be called after success request.
         */
        successCallback: Ext.emptyFn,

        /**
         * @cfg {Function} failureCallback The function which
         * will be called after a failed request.
         * This callback is optional and currently unused.
         */
        failureCallback: Ext.emptyFn,

        doResetconfiguration: function (a) {
            this.successCallback(a);
        },
        doGetsecret: function (a) {
            this.successCallback(a);
        },
        doActivate: function (a) {
            this.successCallback(a);
        },
        doIsactivated: function (a) {
            this.successCallback(a);
        },
        doVerifycode: function (a) {
            this.successCallback(a);
        },
        doError: function (a) {
            if (a.error)
                Zarafa.common.dialogs.MessageBox.show({
                    title: "Error",
                    msg: a.error.info.original_message,
                    icon: Zarafa.common.dialogs.MessageBox.ERROR,
                    buttons: Zarafa.common.dialogs.MessageBox.OK
                });
            else
                Zarafa.common.dialogs.MessageBox.show({
                    title: "Error",
                    msg: a.info.original_message,
                    icon: Zarafa.common.dialogs.MessageBox.ERROR,
                    buttons: Zarafa.common.dialogs.MessageBox.OK
                });
        }
    });
Ext.reg("google2fa.responsehandler", Zarafa.plugins.google2fa.data.ResponseHandler);
