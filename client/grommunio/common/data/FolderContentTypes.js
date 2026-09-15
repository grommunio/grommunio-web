/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.FolderContentTypes
 * @extends Grommunio.core.Enum
 *
 * Enumerates all possibles content names that are content by any folder.
 *
 * @singleton
 */
Grommunio.common.data.FolderContentTypes = Grommunio.core.Enum.create({
	/**
	 * For calendar items
	 *
	 * @property
	 * @type String
	 */
	mail: 'IPF.NOTE',
	/**
	 * For calendar items
	 *
	 * @property
	 * @type String
	 */
	appointment: 'IPF.APPOINTMENT',
	/**
	 * For contact items
	 *
	 * @property
	 * @type String
	 */
	contact: 'IPF.CONTACT',
	/**
	 * For journal items
	 *
	 * @property
	 * @type String
	 */
	journal: 'IPF.JOURNAL',
	/**
	 * For notes
	 *
	 * @property
	 * @type String
	 */
	note: 'IPF.STICKYNOTE',
	/**
	 * For task items
	 *
	 * @property
	 * @type String
	 */
	task: 'IPF.TASK',

	/**
	 * For IPM subtree
	 *
	 * @property
	 * @type String
	 */
	ipmsubtree: 'IPM.SUBTREE',

	/**
	 * Return the display name for the given content type
	 * @param String container_class container class of the folder
	 * @return {String} The display name of content type
	 */
	getContentName: function(container_class)
	{
		switch (container_class.toUpperCase()) {
			case Grommunio.common.data.FolderContentTypes.mail:
				return _('Mail and Post');
			case Grommunio.common.data.FolderContentTypes.appointment:
				return _('Calendar');
			case Grommunio.common.data.FolderContentTypes.contact:
				return _('Contact');
			case Grommunio.common.data.FolderContentTypes.journal:
				return _('Journal');
			case Grommunio.common.data.FolderContentTypes.note:
				return _('Note');
			case Grommunio.common.data.FolderContentTypes.task:
				return _('Task');
			default:
				return container_class;
		}
	},

	/**
	 * Return the Folder name for the given content type
	 * @param String container_class container class of the folder
	 * @return {String} The display name of Folder
	 */
	getFolderName: function(container_class)
	{
		switch (container_class.toUpperCase()) {
			case Grommunio.common.data.FolderContentTypes.mail:
				return _('Inbox');
			case Grommunio.common.data.FolderContentTypes.appointment:
				return _('Calendar');
			case Grommunio.common.data.FolderContentTypes.contact:
				return _('Contact');
			case Grommunio.common.data.FolderContentTypes.note:
				return _('Notes');
			case Grommunio.common.data.FolderContentTypes.task:
				return _('Task');
			case Grommunio.common.data.FolderContentTypes.ipmsubtree:
				return _('Entire Inbox');
			default:
				return container_class;
		}
	}
});
