Ext.namespace('Zarafa.note');

/**
 * @class Zarafa.note.NoteContextModel
 * @extends Zarafa.core.ContextModel
 * class will instantiate {@link Zarafa.note.NoteStore NoteStore} object
 */
Zarafa.note.NoteContextModel = Ext.extend(Zarafa.core.ContextModel, {
	/**
	 * When searching, this property marks the {@link Zarafa.core.ContextModel#getCurrentDataMode datamode}
	 * which was used before {@link #onSearchStart searching started} the datamode was switched to
	 * {@link Zarafa.note.data.DataModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldDataMode : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Zarafa.note.NoteStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection: true,
			current_data_mode : Zarafa.note.data.DataModes.ALL
		});

		Zarafa.note.NoteContextModel.superclass.constructor.call(this, config);

		this.on({
			'searchstart' : this.onSearchStart,
			'searchstop' : this.onSearchStop,
			scope : this
		});
	},
	
	/**
	 * Create a new {@link Zarafa.core.data.IPMRecord record}
	 * @param {Zarafa.core.IPMFolder} folder (optional) The target folder in which the new record must be
	 * created. If this is not provided the default folder will be used.
	 * @return {Zarafa.core.data.IPMRecord} The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	createRecord : function(folder)
	{
		folder = folder || this.getDefaultFolder();

		return Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.StickyNote', {
			store_entryid : folder.get('store_entryid'),
			parent_entryid : folder.get('entryid')
		});
	},

	/**
	 * Event handler which is executed right before the {@link #datamodechange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 * This will apply filtering to the {@link #store} if needed.
	 *
	 * @param {Zarafa.note.NoteContextModel} model The model which fired the event.
	 * @param {Zarafa.note.data.DataModes} newMode The new selected DataMode.
	 * @param {Zarafa.note.data.DataModes} oldMode The previously selected DataMode.
	 * @private
	 */
	onDataModeChange : function(model, newMode, oldMode) 
	{
		Zarafa.note.NoteContextModel.superclass.onDataModeChange.call(this, model, newMode, oldMode);

		if (newMode !== oldMode && oldMode === Zarafa.note.data.DataModes.SEARCH) {
			this.stopSearch();
		}

		switch(newMode) {
			case Zarafa.note.data.DataModes.SEARCH:
				this.store.clearFilter();
				break;
			case Zarafa.note.data.DataModes.ALL:
				this.store.clearFilter();
				this.load();
				break;
			case Zarafa.note.data.DataModes.LAST_7_DAYS:
				var now = new Date();
				// Set time to 12:00 to prevent problems when
				// calling Date.add(Date.DAY, ...) when the DST
				// switch is at 00:00 like in Brasil.
				now.setHours(12);
				var lastSevenDay = (now.add(Date.DAY, -7).clearTime()).getTime() / 1000;

				this.load({
					params : {
						restriction : {
							note : Zarafa.core.data.RestrictionFactory.dataResProperty(
								'last_modification_time',
								Zarafa.core.mapi.Restrictions.RELOP_GT,
								lastSevenDay
							)
						}
					}
				});
				break;
		}
	},

	/**
	 * Event handler for the {@link #searchstart searchstart} event.
	 * This will {@link #setDataMode change the datamode} to {@link Zarafa.note.data.DataModes#SEARCH search mode}.
	 * The previously active {@link #getCurrentDataMode view} will be stored in the {@link #oldDataMode} and will
	 * be recovered when the {@link #onSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStart : function(model)
	{
		if(this.getCurrentDataMode() != Zarafa.note.data.DataModes.SEARCH){
			this.oldDataMode = this.getCurrentDataMode();
			this.setDataMode(Zarafa.note.data.DataModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #searchstop searchstop} event.
	 * This will {@link #setDataMode change the datamode} to the {@link #oldDataMode previous datamode}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop : function(model)
	{
		if (this.getCurrentDataMode() === Zarafa.note.data.DataModes.SEARCH) {
			this.setDataMode(this.oldDataMode);
		}
		delete this.oldDataMode;
	}
});
