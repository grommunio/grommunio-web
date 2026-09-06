Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Thin wrapper around the generic response handler to reuse Seafile specific callbacks.
 */
Zarafa.plugins.files.backend.Seafile.data.ResponseHandler = Ext.extend(
	Zarafa.core.data.AbstractResponseHandler,
	{
		successCallback: null,
		failureCallback: null,
		doLoadsharingdetails: function (e) {
			this.successCallback(e);
		},
		doCreatenewshare: function (e) {
			this.successCallback(e);
		},
		doDeleteexistingshare: function (e) {
			this.successCallback(e);
		},
		doUpdateexistingshare: function (e) {
			this.successCallback(e);
		},
		doError: function (e) {
			container.getNotifier().notify('error.files', Ext.util.Format.htmlEncode(e.header), Ext.util.Format.htmlEncode(e.message));
			this.failureCallback(e);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.responsehandler',
	Zarafa.plugins.files.backend.Seafile.data.ResponseHandler,
);
