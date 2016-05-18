Ext.namespace('Zarafa.settings');

/**
 * @class Zarafa.settings.SettingsContextModel
 * @extends Zarafa.core.ContextModel
 */
Zarafa.settings.SettingsContextModel = Ext.extend(Zarafa.core.ContextModel, {

	/**
	 * The settings model of the active settings, this is a reference
	 * to {@link Zarafa.core.Container#getSettingsModel}. This model is
	 * used to save the changes to the server. However
	 * {@link Zarafa.settings.ui.SettingsCategory categories} should not
	 * edit to this settings model directly, instead they should use
	 * {@link #editModel}.
	 * @property
	 * @type Zarafa.settings.SettingsModel
	 * @private
	 */
	realModel : undefined,

	/**
	 * Copy of {@link #realModel}. This model can be obtained by
	 * {@link Zarafa.settings.ui.SettingsCategory categories} using
	 * {@link #getEditableSettingsModel}. This model can be used
	 * for editing the settings which should later be saved to
	 * the server.
	 * @property
	 * @type Zarafa.settings.SettingsModel
	 * @private
	 */
	editModel : undefined,

	/**
	 * The list of all settings which were changes in the {@link #editModel}.
	 * When {@link #applyChanges} this list will be applied to {@link #realModel}
	 * and saved to the server. To discard these changes {@link #discardChanges}
	 * is used.
	 * @property
	 * @type Array
	 * @private
	 */
	setlist : undefined,

	/**
	 * The list of all settings which were deleted in the {@link #editModel}.
	 * When {@link #applyChanges} this list will be applied to {@link #realModel}
	 * and saved to the server. To discard these changes {@link #discardChanges}
	 * is used.
	 * @property
	 * @type Array
	 * @private
	 */
	dellist : undefined,

	/**
	 * Indicates if any changes are pending. This is updated as soon as
	 * {@link #setlist} or {@link #dellist} are updated. This might be
	 * updated manually by calling {@link #setDirty}.
	 * This value might be obtained by calling {@link #hasChanges}.
	 * @property
	 * @type Boolean
	 * @private
	 */
	dirty : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// Obtain reference to active settings model
		this.realModel = container.getSettingsModel();

		// Create an editing model, this is initialized in #enable.
		this.editModel = new Zarafa.settings.SettingsModel({
			autoSave : false
		});

		Ext.applyIf(config, {
			stateful : false
		});

		this.addEvents(
			/**
			 * @event beforesavesettings
			 *
			 * Event which is fired just before the settings are being
			 * {@link Zarafa.settings.ContextModel#save saved}. At this
			 * time the settings might still be changed.
			 * @param {Zarafa.settings.SettingsContextModel} model This model
			 * @param {Zarafa.settings.SettingsModel} settingsModel The
			 * settingsModel which is about to be saved
			 * @return {Boolean} false to cancel the 'save' event
			 */
			'beforesavesettings',
			/**
			 * @event savesettings
			 *
			 * Event which is fired when the settings are being
			 * {@link Zarafa.settings.ContextModel#save saved}.
			 * @param {Zarafa.settings.SettingsContextModel} model This model
			 * @param {Zarafa.settings.SettingsModel} settingsModel The
			 * settingsModel which is being saved
			 */
			'savesettings',
			/**
			 * @event discardsettings
			 *
			 * Event which is fired when the changes made in the
			 * {@link #editModel} are being discarded.
			 * @param {Zarafa.settings.SettingsContextModel} model This model
			 * @param {Zarafa.settings.SettingsModel} settingsModel The
			 * model for which the settings are just discarded.
			 */
			'discardsettings'
		);

		Zarafa.settings.SettingsContextModel.superclass.constructor.call(this, config);

		this.editModel.on({
			set : this.onSetSetting,
			remove : this.onRemoveSetting,
			scope : this
		});
	},

	/**
	 * Called during the {@link Zarafa.core.Context#enable enabling} of the {@link Zarafa.core.Context context}.
	 * Secondly it will {@link #setFolders set the} {@link #folders folder} to this object to {@link #load} the {@link #store}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link #suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		Zarafa.settings.SettingsContextModel.superclass.enable.apply(this, arguments);

		var defaults = this.realModel.get(undefined, true);
		this.editModel.initialize(defaults);
	},

	/**
	 * Called during the {@link Zarafa.core.Context#disable disabling} of the {@link Zarafa.core.Context context}.
	 */
	disable : Ext.emptyFn,

	/**
	 * Obtain the reference to the {@link #editModel} this can be used by
	 * {@link Zarafa.settings.ui.SettingsCategory categories} for loading
	 * and editing settings.
	 * @return {Zarafa.settings.SettingsModel} The settings model to be
	 * used for editing.
	 */
	getEditableSettingsModel : function()
	{
		return this.editModel;
	},

	/**
	 * Obtain the reference to the {@link #realModel}.
	 * @return {Zarafa.settings.SettingsModel} The settings model to be
	 * used for saving changes to the server .
	 */
	getRealSettingsModel : function()
	{
		return this.realModel;
	},

	/**
	 * True when there are {@link #dirty unsaved changes} pending in the {@link #editModel}
	 * @return {Boolean} True when there are pending changes.
	 */
	hasChanges : function()
	{
		return this.dirty;
	},

	/**
	 * Mark the Model as dirty, this will make {@link #hasChanges} return true.
	 * This should only be used if the SettingsWidget isn't touching the Settings
	 * themselves, but does require a forced save from the user.
	 */
	setDirty : function()
	{
		this.dirty = true;
	},

	/**
	 * Call to save all changes made in {@link #editModel} to the server,
	 * this will also update {@link #realModel} and clear the
	 * {@link #setlist set} and {@link #dellist deleted} lists.
	 * Calling this function makes only sense when {@link #hasChanges}
	 * returned true.
	 */
	applyChanges : function()
	{
		if (this.fireEvent('beforesavesettings', this, this.editModel) !== false) {
			// During the 'beforesavesettings' event handler, the model
			// might have received changes. If we haven't, then there is
			// nothing to save and we can exit here now.
			if (!this.hasChanges()) {
				return;
			}

			this.fireEvent('savesettings', this, this.editModel);

			this.realModel.requiresReload = this.editModel.requiresReload;

			this.realModel.beginEdit();

			if (!Ext.isEmpty(this.setlist)) {
				for (var i = 0, len = this.setlist.length; i < len; i++) {
					var setting = this.setlist[i];
					if (Ext.isDefined(setting['value'])) {
						this.realModel.set(setting['path'], setting['value']);
					}
				}
			}
			if (!Ext.isEmpty(this.dellist)) {
				for (var i = 0, len = this.dellist.length; i < len; i++) {
					var setting = this.dellist[i];
					this.realModel.remove(setting);
				}
			}
			this.realModel.endEdit();

			// now we have syncronized changes from edit model to real model, its time to
			// remove modifications from edit model
			this.editModel.commit();

			this.dirty = false;
			delete this.setlist;
			delete this.dellist;
		}
	},

	/**
	 * Discard any changes made to the {@link #editModel} this will not
	 * save anything to the server and will reload all settings from
	 * {@link #realModel} into the {@link #editModel} and clear the 
	 * {@link #setlist set} and {@link #dellist deleted} lists.
	 * Calling this function makes only sense when {@link #hasChanges}
	 * returned true.
	 */
	discardChanges : function()
	{
		var defaults = this.realModel.get(undefined, true);
		this.editModel.initialize(defaults);

		this.editModel.commit();

		this.dirty = false;
		delete this.setlist;
		delete this.dellist;

		this.fireEvent('discardsettings', this, this.editModel);
	},

	/**
	 * Sets the selected folder list directly.
	 * Fires the {@link #folderchange} event.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders selected folders as an array of
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder} objects.
	 */
	setFolders : Ext.emptyFn,

	/**
	 * Event handler which is fired when the {@link #editModel} fires
	 * the {@link Zarafa.settings.SettingsModel#setsetting} event.
	 * This will add the changed settings to the {@link #setlist}
	 * array.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event
	 * @param {Array} settings The settings which were set
	 * @private
	 */
	onSetSetting : function(model, settings)
	{
		this.dirty = true;
		this.setlist = Ext.value(this.setlist, []);
		this.setlist = this.setlist.concat(settings);
	},

	/**
	 * Event handler which is fired when the {@link #editModel} fires
	 * the {@link Zarafa.settings.SettingsModel#removesetting} event.
	 * This will add the changed settings to the {@link #dellist}
	 * array.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event
	 * @param {Array} settings The settings which were deleted
	 * @private
	 */
	onRemoveSetting : function(mode, settings)
	{
		this.dirty = true;
		this.dellist = Ext.value(this.dellist, []);
		this.dellist = this.dellist.concat(settings);
	}
});
