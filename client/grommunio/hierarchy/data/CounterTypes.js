Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.CounterTypes
 * @extends Grommunio.core.Enum
 * 
 * An enum that contains all possible counter types which
 * can be used to show counter in {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
 * 
 * @singleton
 */
Grommunio.hierarchy.data.CounterTypes = Grommunio.core.Enum.create({
	/**
	 * Unread counter will be shown in {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
	 * @property
	 * @type String
	 */
	NONE		: 0,

	/**
	 * Total counter will be shown in {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
	 * @property
	 * @type String
	 */
	TOTAL		: 1,

	/**
	 * Unread counter will be shown in {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
	 * @property
	 * @type String
	 */
	UNREAD		: 2
});
