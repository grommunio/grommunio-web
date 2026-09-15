/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.ContactContextModel
 * @extends Grommunio.core.ContextModel
 */
Grommunio.contact.ContactContextModel = Ext.extend(Grommunio.core.ContextModel, {
	/**
	 * The currently selected character, this is updated through
	 * {@link #setRestrictionCharacter} and when this field changes,
	 * the {@link #characterchange} event will be fired.
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type Mixed
	 */
	current_character: 'a',

	/**
	 * When searching, this property marks the {@link Grommunio.core.ContextModel#getCurrentDataMode datamode}
	 * which was used before {@link #onSearchStart searching started} the datamode was switched to
	 * {@link Grommunio.contact.data.DataModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldDataMode: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Grommunio.contact.ContactStore();
		}

		Ext.applyIf(config, {
			current_data_mode: Grommunio.contact.data.DataModes.ALL
		});

		this.addEvents(
			/**
			 * @event characterchange
			 * Fires when the restriction character changed.
			 * @param {Grommunio.core.ContextModel} model this model.
			 * @param {String} character new character restriction.
			 * @param {String} oldCharacter previous character restriction.
			 */
			'characterchange'
		);

		Grommunio.contact.ContactContextModel.superclass.constructor.call(this, config);

		this.on({
			'searchstart': this.onSearchStart,
			'searchstop': this.onSearchStop,
			scope: this
		});
	},

	/**
	 * Called during the {@link Grommunio.core.Context#enable enabling} of the {@link Grommunio.core.Context context}.
	 * Secondly it will {@link #setFolders set the} {@link #folders folder} to this object to {@link #load} the {@link #store}.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link #suspendLoading suspended}
	 */
	enable: function(folder, suspended)
	{
		// Enable the superclass with suspended enabled, so we can safely change the
		// restriction character
		Grommunio.contact.ContactContextModel.superclass.enable.call(this, folder, true);
		this.setRestrictionCharacter(this.getRestrictionCharacter(), true);

		// We enabled the superclass as suspended,
		// so time to resume it now.
		if (suspended !== true) {
			this.resumeLoading();
		}
	},

	/**
	 * Create a new {@link Grommunio.core.data.IPMRecord IPMRecord} which must be used within
	 * {@link Grommunio.contact.dialogs.ContactDialog ContactDialog}.
	 * @param {Grommunio.core.IPMFolder} folder (optional) The target folder in which the new record must be
	 * created. If this is not provided the default folder will be used.
	 * @param {Boolean} isDistlist True to create a distributionlist rather then a Contact
	 * @return {Grommunio.core.data.IPMRecord} The new {@link Grommunio.core.data.IPMRecord IPMRecord}.
	 */
	createRecord: function(folder, isDistlist)
	{
		folder = folder || this.getDefaultFolder();

		var record = Grommunio.core.data.RecordFactory.createRecordObjectByMessageClass(isDistlist ? 'IPM.Distlist' : 'IPM.Contact', {
			store_entryid: folder.get('store_entryid'),
			parent_entryid: folder.get('entryid'),
			icon_index: isDistlist ? Grommunio.core.mapi.IconIndex['contact_distlist'] : Grommunio.core.mapi.IconIndex['contact_user']
		});

		return record;
	},

	/**
	 * Event handler which is executed right before the {@link #datamodechange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 * This will apply a restriction to the {@link #store} if needed.
	 *
	 * @param {Grommunio.contact.ContactContextModel} model The model which fired the event.
	 * @param {Grommunio.contact.data.DataModes} newMode The new selected DataMode.
	 * @param {Grommunio.contact.data.DataModes} oldMode The previously selected DataMode.
	 * @private
	 */
	onDataModeChange: function(model, newMode, oldMode)
	{
		Grommunio.contact.ContactContextModel.superclass.onDataModeChange.call(this, model, newMode, oldMode);

		if (newMode !== oldMode && oldMode === Grommunio.contact.data.DataModes.SEARCH) {
			this.stopSearch();
		}

		// also reload the store
		switch(newMode) {
			case Grommunio.contact.data.DataModes.CHARACTER_RESTRICT:
				this.load({
					params: {
						restriction: { 'search': this.createCharacterRestriction() }
					}
				});
				break;
			case Grommunio.contact.data.DataModes.ALL:
				this.load({
					params: {
						restriction: {}
					}
				});
				break;
			case Grommunio.contact.data.DataModes.SEARCH:
				break;
		}
	},

	/**
	 * Sets the current character for the {@link Grommunio.contact.data.DataModes#CHARACTER_RESTRICT} datamode.
	 * Fires the {@link #characterchange} event.
	 * @param {String} character The character by which the contacts should be restricted.
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the character.
	 */
	setRestrictionCharacter: function(character, init)
	{
		if (init === true || this.current_character !== character) {
			var oldCharacter = this.current_character;
			this.current_character = character;

			this.onCharacterChange(this, this.current_character, oldCharacter);

			// fire mode change event
			this.fireEvent('characterchange', this, this.current_character, oldCharacter);
		}
	},

	/**
	 * @return {String} The currently selected {@link #current_character character}.
	 */
	getRestrictionCharacter: function()
	{
		return this.current_character;
	},

	/**
	 * Event handler which is executed right before the {@link #characterchange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 *
	 * @param {Grommunio.core.ContextModel} model The model which fired the event.
	 * @param {Mixed} newCharacter The new selected character
	 * @param {Mixed} oldCharacter The previously selected character
	 * @private
	 */
	onCharacterChange: function(mode, newCharacter, oldCharacter)
	{
		if (this.current_data_mode === Grommunio.contact.data.DataModes.CHARACTER_RESTRICT) {
			var params = {
				start: 0
			};

			if (newCharacter) {
				params.restriction = {
					'search': this.createCharacterRestriction(newCharacter)
				};
			}

			this.load({
				params: params
			});
		}
	},

	/**
	 * Function will create restriction that will be applied to {@link Grommunio.contact.ContactStore ContactStore},
	 * and used when fetching data for {@link Grommunio.contact.ui.ContactCardView ContactCardView}.
	 * @param {String} character character that is currently selected.
	 * @return {Object} restriction that will be applied to store.
	 * @private
	 */
	createCharacterRestriction: function(character)
	{
		var Factory = Grommunio.core.data.RestrictionFactory;
		var Restrictions = Grommunio.core.mapi.Restrictions;
		var restriction;
		var fileAs = 'PT_STRING8:PSETID_Address:0x8005';

		if (Ext.isEmpty(character)) {
			character = this.current_character || '...';
		}

		switch(character) {
			case '...':
				// don't apply any restriction
				restriction = {};
				break;
			case '123':
				// find contacts starting with numeric characters '0' to '9'
				restriction = Factory.createResAnd([
					Factory.dataResProperty(fileAs, Restrictions.RELOP_GE, '0'),
					Factory.dataResProperty(fileAs, Restrictions.RELOP_LE, '9')
				]);
				break;
			case 'z':
				// find contacts ending after character 'z'
				restriction = Factory.dataResProperty(fileAs, Restrictions.RELOP_GE, 'z');
				break;
			default:
				var nextCharacter = String.fromCharCode(character.charCodeAt(0) + 1);
				restriction = Factory.createResAnd([
					Factory.dataResProperty(fileAs, Restrictions.RELOP_GE, character),
					Factory.dataResProperty(fileAs, Restrictions.RELOP_LE, nextCharacter)
				]);
		}

		return restriction;
	},

	/**
	 * Handler for 'charachterchange' event, which calls {@link #saveState} only
	 * when the current character is not the same as oldCharacter.
	 *
	 * @param {Grommunio.core.ContextModel} contextModel the contextModel which states needs to be saved.
	 * @param {String} character new character restriction.
	 * @param {String} oldCharacter new character restriction.
	 */
	saveCharacterChangeState: function(contextModel, character, oldCharacter)
	{
		if (character != oldCharacter) {
			this.saveState();
		}
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveState} callback function.
	 * @private
	 */
	initStateEvents: function()
	{
		Grommunio.contact.ContactContextModel.superclass.initStateEvents.call(this);
		this.on('characterchange', this.saveCharacterChangeState, this, {delay: 100});
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState: function()
	{
		var state = Grommunio.contact.ContactContextModel.superclass.getState.call(this) || {};
		return Ext.apply(state, { current_character: this.current_character });
	},

	/**
	 * Event handler for the {@link #searchstart searchstart} event.
	 * This will {@link #setDataMode change the datamode} to {@link Grommunio.contact.data.DataModes#SEARCH search mode}.
	 * The previously active {@link #getCurrentDataMode view} will be stored in the {@link #oldDataMode} and will
	 * be recovered when the {@link #onSearchStop search is stopped}.
	 * @param {Grommunio.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStart: function(model)
	{
		if(this.getCurrentDataMode() != Grommunio.contact.data.DataModes.SEARCH){
			this.oldDataMode = this.getCurrentDataMode();
			this.setDataMode(Grommunio.contact.data.DataModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #searchstop searchstop} event.
	 * This will {@link #setDataMode change the datamode} to the {@link #oldDataMode previous datamode}.
	 * @param {Grommunio.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop: function(model)
	{
		if (this.getCurrentDataMode() === Grommunio.contact.data.DataModes.SEARCH) {
			this.setDataMode(this.oldDataMode);
		}
		delete this.oldDataMode;
	},

	/**
	 * Sets the selected folder list directly.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord[]} folders selected folders as an array of
	 * {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolder} objects.
	 */
	setFolders: function(folders)
	{
		// Suspend loading, so we can safely change the restriction character
		this.suspendLoading(true);
		Grommunio.contact.ContactContextModel.superclass.setFolders.call(this,folders);
		this.setRestrictionCharacter(this.getRestrictionCharacter(), true);

		// Resume loading after applying restriction
		this.resumeLoading();
	}
});
