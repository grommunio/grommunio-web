/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.ui.notifier');

/**
 * @class Grommunio.core.ui.notifier.NotifyPlugin
 * @extends Object
 *
 * Base class for any plugins which can be registered to the
 * {@link Grommunio.core.ui.notifier.Notifier Notifier}.
 */
Grommunio.core.ui.notifier.NotifyPlugin = Ext.extend(Object, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Notify the user with a message.
	 *
	 * The category can be either "error", "warning", "info" or "debug", or a subtype thereof (e.g. "info.newmail").
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - container: Which is the container to which the notifier should be restricted
	 * - destroy: Don't create new message, but destroy previous one
	 * - reference: The original message which must be updated by this action
	 * @return {Mixed} A reference to the message which was created, this can be used
	 * as value for 'reference' in the config argument.
	 */
	notify: Ext.emptyFn
});
