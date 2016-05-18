/*
 * #dependsFile client/zarafa/common/data/FolderContentTypes.js
 */
Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.hierarchy.data.SharedFolderTypes
 * @singleton
 * This class can be used to set folder types.
 */
Zarafa.hierarchy.data.SharedFolderTypes = {
	/**
	 * Used for opening the Default Calendar folder
	 * @property
	 * @type String
	 */
	'APPOINTMENT' : 'calendar',

	/**
	 * Used for opening the Default Contact folder
	 * @property
	 * @type String
	 */
	'CONTACT' : 'contact',

	/**
	 * Used for opening the Entire Store
	 * @property
	 * @type String
	 */
	'ALL' : 'all',

	/**
	 * Used for opening the Inbox folder
	 * @property
	 * @type String
	 */
	'MAIL' : 'inbox',

	/**
	 * Used for opening the StickyNote folder
	 * @property
	 * @type String
	 */
	'NOTE' : 'note',

	/**
	 * Used for opening the Task folder
	 * @property
	 * @type String
	 */
	'TASK' : 'task',

	/**
	 * Array containing the {@link Zarafa.hierarchy.data.SharedFolderTypes Shared Folder Types} combined
	 * with the DisplayName. This array can be directly used as data in {@link Ext.ComboBox#store}.
	 * @property
	 * @type Array
	 */
	folders : [{
		value: 'calendar',
		name: Zarafa.common.data.FolderContentTypes.getFolderName(Zarafa.common.data.FolderContentTypes['appointment'])
	},{
		value: 'contact',
		name: Zarafa.common.data.FolderContentTypes.getFolderName(Zarafa.common.data.FolderContentTypes['contact'])
	},{
		value: 'all',
		name: Zarafa.common.data.FolderContentTypes.getFolderName(Zarafa.common.data.FolderContentTypes['ipmsubtree'])
	},{
		value: 'inbox',
		name: Zarafa.common.data.FolderContentTypes.getFolderName(Zarafa.common.data.FolderContentTypes['mail'])
	},{
		value: 'note',
		name: Zarafa.common.data.FolderContentTypes.getFolderName(Zarafa.common.data.FolderContentTypes['note'])
	},{
		value: 'task',
		name: Zarafa.common.data.FolderContentTypes.getFolderName(Zarafa.common.data.FolderContentTypes['task'])
	}]
};
