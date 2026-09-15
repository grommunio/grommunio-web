/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.DisplayTypeEx
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.DisplayTypeEx = Grommunio.core.Enum.create({
	/**
	 * Denotes a flag for remote user/group.
	 * @property
	 * @type Number
	 */
	DTE_FLAG_REMOTE_VALID: 0x80000000,

	/**
	 * Denotes a flag for permission user/group.
	 * @property
	 * @type Number
	 */
	DTE_FLAG_ACL_CAPABLE: 0x40000000,

	/**
	 * ???
	 * @property
	 * @type Number
	 */
	DTE_MASK_REMOTE: 0x0000FF00,

	/**
	 * ???
	 * @property
	 * @type Number
	 */
	DTE_MASK_LOCAL: 0x000000FF,

	/**
	 * Denotes a room as a resource
	 * @property
	 * @type Number
	 */
	DT_ROOM	: 0x00000007,

	/**
	 * Denotes an equipment as a resource
	 * @property
	 * @type Number
	 */
	DT_EQUIPMENT: 0x00000008,

	/**
	 * Denotes a permission group
	 * @property
	 * @type Number
	 */
	DT_SEC_DISTLIST: 0x00000009,

	/**
	 * Function to check if any DisplayTypeEx value denotes a remote user.
	 * @param {Number} value value of DisplayTypeEx to check.
	 * @return {Boolean} Returns true if value denotes a remote user else false.
	 */
	DTE_IS_REMOTE_VALID: function(value)
	{
		if(!Ext.isNumber(value)) {
			return false;
		}

		return !!(value & Grommunio.core.mapi.DisplayTypeEx.DTE_FLAG_REMOTE_VALID);
	},

	/**
	 * Function to check if any DisplayTypeEx value denotes a user/groups that can have permissions.
	 * @param {Number} value value of DisplayTypeEx to check.
	 * @return {Boolean} Returns true if value denotes a user/groups that can have permissions else false.
	 */
	DTE_IS_ACL_CAPABLE: function(value)
	{
		if(!Ext.isNumber(value)) {
			return false;
		}

		return !!(value & Grommunio.core.mapi.DisplayTypeEx.DTE_FLAG_ACL_CAPABLE);
	},

	/**
	 * Function to strip {@link Grommunio.core.mapi.DisplayTypeEx#DTE_MASK_REMOTE} flag from DisplayTypeEx property value.
	 * @param {Number} value value of DisplayTypeEx.
	 * @return {Number} Returns value of DisplayTypeEx property value after removing
	 * {@link Grommunio.core.mapi.DisplayTypeEx#DTE_MASK_REMOTE} flag.
	 */
	DTE_REMOTE: function(value)
	{
		if(!Ext.isNumber(value)) {
			return value;
		}

		return ((value & Grommunio.core.mapi.DisplayTypeEx.DTE_MASK_REMOTE) >> 8);
	},

	/**
	 * Function to strip {@link Grommunio.core.mapi.DisplayTypeEx#DTE_MASK_LOCAL} flag from DisplayTypeEx property value.
	 * @param {Number} value value of DisplayTypeEx.
	 * @return {Number} Returns value of DisplayTypeEx property value after removing
	 * {@link Grommunio.core.mapi.DisplayTypeEx#DTE_MASK_LOCAL} flag.
	 */
	DTE_LOCAL: function(value)
	{
		if(!Ext.isNumber(value)) {
			return value;
		}

		return (value & Grommunio.core.mapi.DisplayTypeEx.DTE_MASK_LOCAL);
	}
});
