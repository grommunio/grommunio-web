Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.CounterTypes
 * @extends Zarafa.core.Enum
 * 
 * An enum that contains all possible counter types which
 * can be used to show counter in {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
 * 
 * @singleton
 */
Zarafa.hierarchy.data.CounterTypes = Zarafa.core.Enum.create({
	/**
	 * Unread counter will be shown in {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * @property
	 * @type String
	 */
	NONE		: 0,

	/**
	 * Total counter will be shown in {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * @property
	 * @type String
	 */
	TOTAL		: 1,

	/**
	 * Unread counter will be shown in {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * @property
	 * @type String
	 */
	UNREAD		: 2
});
