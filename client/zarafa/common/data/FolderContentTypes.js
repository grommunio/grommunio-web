Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.FolderContentTypes
 * @extends Zarafa.core.Enum
 *
 * Enumerates all possibles content names that are content by any folder.
 *
 * @singleton
 */
Zarafa.common.data.FolderContentTypes = Zarafa.core.Enum.create({
	/**
	 * For calendar items
	 *
	 * @property
	 * @type String
	 */
	mail : 'IPF.NOTE',
	/**
	 * For calendar items
	 *
	 * @property
	 * @type String
	 */
	appointment : 'IPF.APPOINTMENT',
	/**
	 * For contact items
	 *
	 * @property
	 * @type String
	 */
	contact : 'IPF.CONTACT',
	/**
	 * For journal items
	 *
	 * @property
	 * @type String
	 */
	journal : 'IPF.JOURNAL',
	/**
	 * For notes
	 *
	 * @property
	 * @type String
	 */
	note : 'IPF.STICKYNOTE',
	/**
	 * For task items
	 *
	 * @property
	 * @type String
	 */
	task : 'IPF.TASK',

	/**
	 * For IPM subtree
	 *
	 * @property
	 * @type String
	 */
	ipmsubtree : 'IPM.SUBTREE',

	/**
	 * Return the display name for the given content type
	 * @param String container_class container class of the folder
	 * @return {String} The display name of content type
	 */
	getContentName : function(container_class)
	{
		switch (container_class.toUpperCase()) {
			case Zarafa.common.data.FolderContentTypes.mail:
				return _('Mail and Post');
			case Zarafa.common.data.FolderContentTypes.appointment:
				return _('Calendar');
			case Zarafa.common.data.FolderContentTypes.contact:
				return _('Contact');
			case Zarafa.common.data.FolderContentTypes.journal:
				return _('Journal');
			case Zarafa.common.data.FolderContentTypes.note:
				return _('Note');
			case Zarafa.common.data.FolderContentTypes.task:
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
	getFolderName : function(container_class)
	{
		switch (container_class.toUpperCase()) {
			case Zarafa.common.data.FolderContentTypes.mail:
				return _('Inbox');
			case Zarafa.common.data.FolderContentTypes.appointment:
				return _('Calendar');
			case Zarafa.common.data.FolderContentTypes.contact:
				return _('Contact');
			case Zarafa.common.data.FolderContentTypes.note:
				return _('Notes');
			case Zarafa.common.data.FolderContentTypes.task:
				return _('Task');
			case Zarafa.common.data.FolderContentTypes.ipmsubtree:
				return _('Entire Inbox');
			default:
				return container_class;
		}
	}
});
