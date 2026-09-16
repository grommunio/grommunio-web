/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common');

/**
 * @class Grommunio.common.Avatar
 * @singleton
 *
 * Downloads a picture from an avatar service. Both services answer with
 * Access-Control-Allow-Origin, so the browser fetches the bytes itself and
 * nothing about the request passes through the server.
 */
Grommunio.common.Avatar = {
	/**
	 * The supported services, keyed by the name used in the menu.
	 * @property
	 * @type Object
	 */
	providers: {
		gravatar: {
			name: 'Gravatar',
			url: 'https://www.gravatar.com/avatar/'
		},
		libravatar: {
			name: 'Libravatar',
			url: 'https://seccdn.libravatar.org/avatar/'
		}
	},

	/**
	 * Edge length requested from the service.
	 * @property
	 * @type Number
	 */
	size: 512,

	/**
	 * Whether the browser can hash and fetch.
	 * @return {Boolean} True when a picture can be looked up
	 */
	isAvailable: function()
	{
		return !!(window.fetch && window.crypto && window.crypto.subtle);
	},

	/**
	 * Looks up the picture for an address. Both services take the SHA-256 of
	 * the lowercased address, which Web Crypto provides; their older MD5 form
	 * would need a digest the browser does not offer.
	 * @param {String} provider The key in {@link #providers}
	 * @param {String} email The address to look up
	 * @param {Function} callback Called with (blob, error), blob undefined on failure
	 * @param {Object} scope The scope for the callback
	 */
	get: function(provider, email, callback, scope)
	{
		var service = this.providers[provider];
		var done = function(blob, error) {
			callback.call(scope || this, blob, error);
		};

		if (!service || !this.isAvailable()) {
			done(undefined, _('This browser cannot download a picture from a service.'));
			return;
		}

		var address = String(email || '').trim().toLowerCase();
		var buffer = new TextEncoder().encode(address);
		var size = this.size;

		window.crypto.subtle.digest('SHA-256', buffer).then(function(digest) {
			var hash = Array.prototype.map.call(new Uint8Array(digest), function(byte) {
				return ('0' + byte.toString(16)).slice(-2);
			}).join('');

			// No Cache-Control here: it is not a safelisted request header and the
			// preflight it would trigger is not answered by every service.
			return window.fetch(service.url + hash + '?s=' + size + '&d=404', {
				mode: 'cors',
				credentials: 'omit',
				referrerPolicy: 'no-referrer'
			});
		}).then(function(response) {
			if (response.status === 404) {
				return done(undefined, String.format(_('{0} has no picture for your address.'), service.name));
			}
			if (!response.ok) {
				return done(undefined, String.format(
					_('{0} answered with an error.'), service.name));
			}

			return response.blob().then(function(blob) {
				done(blob);
			});
		}).catch(function() {
			done(undefined, String.format(_('{0} could not be reached.'), service.name));
		});
	}
};
