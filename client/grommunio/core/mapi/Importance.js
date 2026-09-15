/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.Priority
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.Importance = Grommunio.core.Enum.create({
	/**
	 * Denotes that the message has low importance.
	 * @property
	 * @type Number
	 */
	'NONURGENT': 0x00000000,

	/**
	 * Denotes that the message has normal importance.
	 * @property
	 * @type Number
	 */
	'NORMAL': 0x00000001,

	/**
	 * Denotes that the message has high importance.
	 * @property
	 * @type Number
	 */
	'URGENT': 0x00000002,

	/**
	 * Return the display name for the given importance
	 * @param {Grommunio.core.mapi.Importance} importance The given importance
	 * @return {String} The display name for the importance
	 */
	getDisplayName: function(importance)
	{
		switch (importance) {
			case Grommunio.core.mapi.Importance.NONURGENT:
				return _('Low');
			case Grommunio.core.mapi.Importance.NORMAL:
				return _('Normal');
			case Grommunio.core.mapi.Importance.URGENT:
				return _('High');
		}
		return '';
	},

	/**
	 * Gets icon class based on importance level
	 * @param {Number} level importance level
	 * @param {String} prefix prefix to add before class name
	 * @return {String} icon class
	 */
	getClassName: function(level, prefix)
	{
		if(Ext.isEmpty(prefix)) {
			prefix = 'icon_importance';
		}

		// only allow numbers
		if(!Ext.isNumber(level)) {
			level = parseInt(level, 10);
		}

		// invalid values should be handled as normal priority
		if(!Ext.isNumber(level)) {
			return prefix + '_normal';
		}

		var className = this.getName(level).toLowerCase();

		if(!Ext.isEmpty(className)) {
			return prefix + '_' + className;
		}

		return prefix + '_normal';
	}
});
