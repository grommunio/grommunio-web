/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Seafile.data');

/**
 * Thin wrapper around the generic response handler to reuse Seafile specific callbacks.
 */
Grommunio.plugins.files.backend.Seafile.data.ResponseHandler = Ext.extend(
	Grommunio.core.data.AbstractResponseHandler,
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
	Grommunio.plugins.files.backend.Seafile.data.ResponseHandler,
);
