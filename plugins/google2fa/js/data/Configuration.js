Ext.namespace("Zarafa.plugins.google2fa.data");
/**
 * @class Zarafa.plugins.google2fa.data.Configuration
 * @extends Object
 *
 * Manage the inital settings if settings is loading
 */
Zarafa.plugins.google2fa.data.Configuration = Ext.extend(Object,
    {
        activate: undefined,
        init: function () {
            let a = new Zarafa.plugins.google2fa.data.ResponseHandler({
                successCallback: this.gotIsActivated.createDelegate(this)
            });
            container.getRequest().singleRequest("google2famodule", "isactivated", {}, a);
        },
        gotIsActivated: function (a) {
            this.activate = a.isActivated;
        },
        isActivated: function (a) {
            return this.activate;
        }
    });
Zarafa.plugins.google2fa.data.Configuration = new Zarafa.plugins.google2fa.data.Configuration();
