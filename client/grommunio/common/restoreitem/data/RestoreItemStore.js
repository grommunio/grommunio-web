Ext.namespace('Grommunio.common.restoreitem.data');

/**
 * @class Grommunio.common.restoreitem.data.RestoreItemStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype grommunio.restoreitemstore
 *
 * The RestoreItemStore used to load data related to soft deleted messages/folders, which can be used to restore or permanent delete it
 */
Grommunio.common.restoreitem.data.RestoreItemStore = Ext.extend(Grommunio.core.data.ListModuleStore, {

	/**
	 * @cfg {HexString} entryId The entryid of the {@link Grommunio.hierarchy.data.MAPIFolderRecord folder} for which soft deleted items will be obtained.
	 */
	entryId: undefined,

	/**
	 * @cfg {HexString} storeEntryId entry id of the store.
	 */
	storeEntryId: undefined,

	/**
	 * The current type of soft deleted items list.
	 * Default value is 'message' as By default Grid is loaded with soft deleted message list.
	 * This String is changed by {@link Grommunio.common.restoreitem.dialogs.RestoreItemPanel#onRadioChecked}.
	 *
	 * @property
	 * @type String
	 * @private
	 */
	itemType: 'message',

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByObjectType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RESTOREITEM);

		Ext.applyIf(config, {
			remoteSort: true,
			sortInfo: {
				field: 'deleted_on',
				direction: 'DESC'
			},
			actionType: Grommunio.core.Actions['list'],
			writer: new Grommunio.core.data.JsonWriter(),
			reader: new Grommunio.core.data.JsonReader({
				dynamicRecord: false
			}, recordType),
			proxy: new Grommunio.core.data.IPMProxy({
				listModuleName: Grommunio.core.ModuleNames.getListName('RESTOREITEMS'),
				itemModuleName: Grommunio.core.ModuleNames.getItemName('RESTOREITEMS')
			})
		});

		Grommunio.common.restoreitem.data.RestoreItemStore.superclass.constructor.call(this, config);
	},

	/**
	 * Setter function used to set the value of {@link #itemType}
	 *
	 * @param itemType The current type of soft deleted items list.
	 */
	setItemType: function (itemType)
	{
		this.itemType = itemType;
	},

	/**
	 * Loads the Record cache from the configured {@link #proxy} using the configured {@link #reader}.
	 * @param {Object} options An object containing properties which control loading.
	 * @return {Boolean} true if super class load method will call successfully, false otherwise.
	 */
	load: function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		Ext.apply(options.params, {
			itemType: this.itemType
		});

		// Always use folder which is bind with restore item dialog.
		options.folder = [this.folder];

		return Grommunio.common.restoreitem.data.RestoreItemStore.superclass.load.call(this, options);
	},

	/**
	 * Function which used to reload the store.
	 */
	reload: Ext.emptyFn
});

Ext.reg('grommunio.restoreitemstore', Grommunio.common.restoreitem.data.RestoreItemStore);
