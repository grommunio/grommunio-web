/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.DummyResponseHandler
 * @extends Grommunio.core.data.ProxyResponseHandler
 *
 * A special response handler to handle responses of requests that are already cancelled.
 * as a special requirement for cancelling requests we need to ignore the response coming for that
 * request and process notifications properly for that request (like new mail notifications).
 */
Grommunio.core.data.DummyResponseHandler = Ext.extend(Grommunio.core.data.ProxyResponseHandler, {
	/**
	 * The main handler to begin a Response processing transaction. Checks the whether the {@link #proxy}
	 * is defined and if not returns false to cancel all processing by this handler.
	 * @param {String} moduleName The name of the PHP module from which this response originated.
	 * @param {String} moduleId The unique identifier for the PHP response.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the response was received
	 * @return {Boolean} False when the given data object cannot be handled by this response handler,
	 * and the transaction must be canceled.
	 * @override
	 */
	start: function(moduleName, moduleId, data, timestamp)
	{
		// Inform the proxy the response for a given request has been returned.
		if (this.proxy && Ext.isFunction(this.proxy.deleteRequestId)) {
			this.proxy.deleteRequestId(moduleId);
		}

		return false;
	}
});
