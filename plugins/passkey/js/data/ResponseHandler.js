Ext.namespace('Zarafa.plugins.passkey.data');

/**
 * @class Zarafa.plugins.passkey.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 * 
 * Response handler for Passkey plugin server communication
 */
Zarafa.plugins.passkey.data.ResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

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

    doActivate: function (a) {
        this.successCallback(a);
    },

    doIsactivated: function (a) {
        this.successCallback(a);
    }
});
