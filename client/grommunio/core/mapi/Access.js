/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.Access
 * @extends Grommunio.core.Enum
 * 
 * Enumerates the different access flags
 * 
 * @singleton
 */
Grommunio.core.mapi.Access = Grommunio.core.Enum.create({
	/**
	 * Denotes that write access is given
	 * @property
	 * @type Number
	 */
	ACCESS_MODIFY					: 0x00000001,

	/**
	 * Denotes that read access is given
	 * @property
	 * @type Number
	 */
	ACCESS_READ 					: 0x00000002,

	/**
	 * Denotes that delete access is given
	 * @property
	 * @type Number
	 */
	ACCESS_DELETE					: 0x00000004,

	/**
	 * Denotes that access is given to create subfolders in the folder hierarchy
	 * @property
	 * @type Number
	 */
	ACCESS_CREATE_HIERARCHY			: 0x00000008,

	/**
	 * Denotes that access is given to create content messages
	 * @property
	 * @type Number
	 */
	ACCESS_CREATE_CONTENTS			: 0x00000010,

	/**
	 * Denotes that access is given to create associated content messages
	 * @property
	 * @type Number
	 */
	ACCESS_CREATE_ASSOCIATED		: 0x00000020
});
