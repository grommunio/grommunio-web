/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/data/FolderContentTypes.js
 */
Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.hierarchy.data.SharedFolderTypes
 * @singleton
 * This class can be used to set folder types.
 */
Grommunio.hierarchy.data.SharedFolderTypes = {
	/**
	 * Used for opening the Default Calendar folder
	 * @property
	 * @type String
	 */
	'APPOINTMENT': 'calendar',

	/**
	 * Used for opening the Default Contact folder
	 * @property
	 * @type String
	 */
	'CONTACT': 'contact',

	/**
	 * Used for opening the Entire Store
	 * @property
	 * @type String
	 */
	'ALL': 'all',

	/**
	 * Used for opening the Inbox folder
	 * @property
	 * @type String
	 */
	'MAIL': 'inbox',

	/**
	 * Used for opening the StickyNote folder
	 * @property
	 * @type String
	 */
	'NOTE': 'note',

	/**
	 * Used for opening the Task folder
	 * @property
	 * @type String
	 */
	'TASK': 'task',

	/**
	 * Array containing the {@link Grommunio.hierarchy.data.SharedFolderTypes Shared Folder Types} combined
	 * with the DisplayName. This array can be directly used as data in {@link Ext.ComboBox#store}.
	 * @property
	 * @type Array
	 */
	folders: [{
		value: 'calendar',
		name: Grommunio.common.data.FolderContentTypes.getFolderName(Grommunio.common.data.FolderContentTypes['appointment'])
	},{
		value: 'contact',
		name: Grommunio.common.data.FolderContentTypes.getFolderName(Grommunio.common.data.FolderContentTypes['contact'])
	},{
		value: 'all',
		name: Grommunio.common.data.FolderContentTypes.getFolderName(Grommunio.common.data.FolderContentTypes['ipmsubtree'])
	},{
		value: 'inbox',
		name: Grommunio.common.data.FolderContentTypes.getFolderName(Grommunio.common.data.FolderContentTypes['mail'])
	},{
		value: 'note',
		name: Grommunio.common.data.FolderContentTypes.getFolderName(Grommunio.common.data.FolderContentTypes['note'])
	},{
		value: 'task',
		name: Grommunio.common.data.FolderContentTypes.getFolderName(Grommunio.common.data.FolderContentTypes['task'])
	}]
};
