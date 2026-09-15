Ext.namespace('Grommunio.plugins.pgp.data');

/** Every OpenPGP operation uses the normal, authenticated Web request router. */
Grommunio.plugins.pgp.data.PgpResponseHandler = Ext.extend(Grommunio.core.data.AbstractResponseHandler, {
	doRequest: function(response)
	{
		if (this.callback) {
			this.callback(response || {success: false});
		}
	},
	doError: function()
	{
		this.responseFailure();
	},
	responseFailure: function()
	{
		this.doRequest({success: false, message: _('The OpenPGP request failed. Please try again.')});
	}
});
