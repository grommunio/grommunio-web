Ext.namespace('Zarafa.settings');

/**
 * @class Zarafa.settings.SettingsModel
 * @extends Ext.util.Observable
 * 
 * The SettingsModel class contains information about stores and folders the user has access to.
 * The settings are built up in a hierarchical way, where each node in the path is separated using
 * the {@link #pathSeparator}.
 */
Zarafa.settings.SettingsModel = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {String} pathSeparator The separator used in settings names to separate the
	 * hierarchy keys.
	 */
	pathSeparator : '/',

	/**
	 * @cfg {Boolean} autoSave True when the settings should be saved to the server
	 * as soon as editing is {@link #afterEdit completed}.
	 */
	autoSave : true,

	/**
	 * @cfg {Object} defaults Javascript object containing the full hierarchy of the default settings.
	 * Defaults to {@link Zarafa.settings.data.SettingsDefaultValue}.
	 */
	defaults : undefined,

	/**
	 * Javascript object containing the full hierarchy of the currently
	 * active settings.
	 * @property
	 * @type Object
	 */
	settings : undefined,

	/**
	 * Flag which indicating if {@link #beginEdit} has been used to begin a transaction,
	 * this means no {@link #save saving} will be done until {@link #endEdit} has been called.
	 * @property
	 * @type Boolean
	 */
	editing : false,

	/**
	 * The number of editors working on this model. The {@link #beginEdit} and {@link #endEdit}
	 * support nested editing blocks. This means that {@link #update} will not be fired until
	 * this counter drops to 0.
	 * @property
	 * @type Number
	 * @private
	 */
	editingCount : 0,

	/**
	 * The list of properties which have been modified during a {@link #editing transaction}.
	 * Will be reset on {@link #endEdit}.
	 * @property
	 * @type Array
	 */
	modified : undefined,

	/**
	 * The list of properties which have been restored during a {@link #editing transaction}.
	 * Will be reset on {@link #endEdit}.
	 * @property
	 * @type Array
	 */
	restored : undefined,

	/**
	 * The list of properties which have been deleted during a {@link #editing transaction}.
	 * Will be reset on {@link #endEdit}.
	 * @property
	 * @type Array
	 */
	deleted : undefined,

	/**
	 * The list of properties which have been reset from server.
	 * @property
	 * @type Array
	 */
	resetSettings : undefined,
	
	/**
	 * The property which decide that webapp requires to reload.
	 * @property
	 * @type Boolean
	 */
	requiresReload : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.addEvents(
			/**
			 * @event set
			 * Fires when a property is assigned a new value.  
			 * @param {Zarafa.settings.SettingsModel} settingsModel   
			 * @param {Object/Array} setting The setting which was modified. The object contains a 'path' and 'value'
			 * indicating the path and the value for the modified setting respectively.
			 */
			'set',
			/**
			 * @event remove
			 * Fires when a property is removed.  
			 * @param {Zarafa.settings.SettingsModel} settingsModel   
			 * @param {String/Array} path The key to delete. When multiple settings are removed simulataneously, then the
			 * array of Strings is provided.
			 */
			'remove',
			/**
			 * @event exception
			 * Fires when a server-side error occured during updating the settings in the server.
			 * (See {@link Ext.data.DataStore#exception} for better exception argument documentation).
			 * @param {Zarafa.settings.SettingsModel} model The model which fired the event.
			 * @param {String} type The value of this parameter will be either 'response' or 'remote'. 
			 * @param {String} action Name of the action (see {@link Ext.data.Api#actions}).
			 * @param {Object} options The object containing a 'path' and 'value' field indicating
			 * respectively the Setting and corresponding value for the setting which was being saved.
			 * @param {Object} response The response object as received from the PHP-side
			 */
			'exception',
			/**
			 * @event beforesave
			 * Fires when the Settings Model is about to save data to the server
			 * @param {Zarafa.settings.SettingsModel} model The model which fired the event.
			 * @param {Object} parameters The key-value object containing the action and the corresponding
			 * settings which will be send to the server.
			 * @return {Boolean} false to prevent the save action from executing
			 */
			'beforesave',
			/**
			 * @event save
			 * Fires when the Settings Model has successfully saved the settings to the server
			 * @param {Zarafa.settings.SettingsModel} model The model which fired the event.
			 * @param {Object} parameters The key-value object containing the action and the corresponding
			 * settings which were saved to the server.
			 */
			'save'
		);

		if (!Ext.isObject(config.defaults)) {
			config.defaults = Zarafa.settings.data.SettingsDefaultValue.getDefaultValues();
		}

		Ext.apply(this, config);

		Zarafa.settings.SettingsModel.superclass.constructor.call(this, config);

		this.settings = {};
		this.modified = [];
		this.restored = [];
		this.deleted = [];
		this.resetSettings = [];

		// Relays the exception event to the DataProxy
		Ext.data.DataProxy.relayEvents(this, ['exception']);
	},

	/**
	 * Initialize the SettingsModel with the initial batch of settings.
	 * This will first apply the {@link #defaults}
	 * on {@link #settings} and then apply the provided settings.
	 *
	 * @param {Object} obj a JSON object hierarchy representing a tree of key/value pairs.
	 */
	initialize : function(obj)
	{
		this.settings = Zarafa.core.Util.applyRecursive({}, obj, this.defaults);
	},

	/**
	 * Indicates a transaction of setting changes will commence. This will set the
	 * {@link #editing} flag to prevent automatic saving during {@link #set}.
	 *
	 * This functions supports nested calls by using {@link #editingCount}.
	 */
	beginEdit : function()
	{
		// Increase editing counter, if it is a negative value, it means that
		// it has been corrupted and we must force it to something valid.
		this.editingCount++;
		if (this.editingCount < 1) {
			this.editingCount = 1;
		}

		// If this is not a nested call, we can direct the call to the superclass.
		if (this.editingCount === 1) {
			this.editing = true;
			this.modified = this.modified || [];
			this.restored = this.restored || [];
			this.deleted = this.deleted || [];
		}
	},

	/**
	 * Indicates a transaction of setting changes has completed and that all changes must
	 * be saved to the server. This will reset the {@link #editing} field.
	 *
	 * This functions supports nested calls by using {@link #editingCount}.
	 */
	endEdit : function()
	{
		// Increase editing counter, if it is a negative value, it means that
		// it has been corrupted and we must force it to something valid.
		this.editingCount--;
		if (this.editingCount < 0) {
			this.editingCount = 0;
		}

		// If this is not a nested call, we can direct the call to the superclass.
		if (this.editingCount === 0) {
			this.editing = false;
			if (!Ext.isEmpty(this.modified) || !Ext.isEmpty(this.deleted)) {
				this.afterEdit();
			}
		}
	},

	/**
	 * Transaction completion handler which is called by {@link #endEdit} when
	 * a setting transaction has been completed or by {@link #setSettings} and {@link #removeSettings}
	 * when no transaction is being used. This will call {@link #save} to send all changes to the server.
	 * @private
	 */
	afterEdit : function()
	{
		var needsSave = false;

		if (!Ext.isEmpty(this.restored)) {
			this.fireEvent('set', this, this.restored);
		}
		this.restored = [];

		if (!Ext.isEmpty(this.modified)) {
			this.fireEvent('set', this, this.modified);
			needsSave = true;
		}

		if (!Ext.isEmpty(this.deleted)) {
			this.fireEvent('remove', this, this.deleted);
			needsSave = true;
		}

		if (needsSave === true && this.autoSave !== false) {
			this.save();
		}
	},

	/**
	 * Go through the given list and remove any item which also
	 * is present in the given filter. Use this to prevent duplicates
	 * in the {@link #modified}, {@link #deleted} and {@link #restored}
	 * arrays.
	 * @param {Object/String|Array} list The list which must be filtered
	 * @param {String|Array} filter The list of paths which must be filterd
	 * out of the list
	 * @private
	 */
	filterDuplicates : function(list, filter)
	{
		for (var i = 0, len = filter.length; i < len; i++) {
			var path = filter[i];
			var paths = list;
			var index = -1;

			if (Ext.isObject(list[0])) {
				paths = Ext.pluck(list, 'path');
			}

			// Also check if the item in the list exists multiple times,
			// as that is not needed either.
			while ((index = paths.indexOf(path)) >= 0) {
				list.splice(index, 1);
				if (list !== paths) {
					paths.splice(index, 1);
				}
			}
		}
	},

	/**
	 * Performs the removal of the settings from the server.
	 *
	 * @param {String/Array} path The list of setting paths which must be deleted
	 * from the settings.
	 * @private
	 */
	removeSettings : function(path)
	{
		if (!Array.isArray(path)) {
			path = [ path ];
		}

		// First remove all duplicates
		path = Zarafa.core.Util.uniqueArray(path);

		// Now remove any settings which are removed now,
		// but are already in one of the editing lists
		this.filterDuplicates(this.modified, path);
		this.filterDuplicates(this.restored, path);
		this.filterDuplicates(this.deleted, path);

		// ALl filtering is done, update the deleted array
		this.deleted = this.deleted.concat(path);
	},

	/**
	 * Performs the update of the settings on the server.
	 *
	 * @param {Object/Array} settings The list of objects containing the 'path' and 'value'
	 * of the settings which are being updated.
	 * @private
	 */
	restoreSettings : function(settings)
	{
		if (!Array.isArray(settings)) {
			settings = [ settings ];
		}

		// First remove all duplicates
		settings = Zarafa.core.Util.uniqueArray(settings, 'path');

		// Now remove any settings which are restored now,
		// but are already in one of the editing lists.
		var path = Ext.pluck(settings, 'path');
		this.filterDuplicates(this.modified, path);
		this.filterDuplicates(this.restored, path);
		this.filterDuplicates(this.deleted, path);

		// All filtering is done, update the restored array
		this.restored = this.restored.concat(settings);
	},

	/**
	 * Performs the update of the settings on the server.
	 *
	 * @param {Object/Array} settings The list of objects containing the 'path' and 'value'
	 * of the settings which are being updated.
	 * @private
	 */
	setSettings : function(settings)
	{
		if (!Array.isArray(settings)) {
			settings = [ settings ];
		}

		// First remove all duplicates
		settings = Zarafa.core.Util.uniqueArray(settings, 'path');

		// Now remove any settings which are added now,
		// but are alreasdy in one of the editing lists.
		var path = Ext.pluck(settings, 'path');
		this.filterDuplicates(this.modified, path);
		this.filterDuplicates(this.restored, path);
		this.filterDuplicates(this.deleted, path);

		// All filtering is done, update the modified array
		this.modified = this.modified.concat(settings);
	},

	/**
	 * Save the settings to the server, this will call {@link #execute} for
	 * the different {@link Zarafa.core.Actions actions} which are supposed
	 * to be executed on the server.
	 */
	save : function()
	{
		if (!Ext.isEmpty(this.deleted)) {
			this.execute(Zarafa.core.Actions['delete'], this.deleted);
		}

		if (!Ext.isEmpty(this.modified)) {
			this.execute(Zarafa.core.Actions['set'], this.modified);
		}

		if (!Ext.isEmpty(this.resetSettings)) {
			this.execute(Zarafa.core.Actions['reset'], this.resetSettings);
		}
	},

	/**
	 * Send the save action to the server.
	 * @param {Zarafa.core.Actions} action The action which must be performed on the server
	 * @param {Object} parameters The action parameters which must be send to the server.
	 * @private
	 */
	execute : function(action, parameters)
	{
		if (this.fireEvent('beforesave', this, { action : parameters}) !== false) {
			// FIXME: Perhaps this needs to be moved into a Ext.data.DataProxy
			container.getRequest().singleRequest(
				Zarafa.core.ModuleNames.getListName('settings'),
				action,
				{ 'setting' : parameters},
				new Zarafa.core.data.ProxyResponseHandler({
					proxy: this,
					action: Ext.data.Api.actions['update'],
					options: {action : action, parameters : parameters,'requiresReload' : this.requiresReload },
					callback:  this.onExecuteComplete,
					scope : this
				})
			);
		}
	},

	/**
	 * Event handler which is fired when the Request made in the {@link #execute} function
	 * has been completed. This will fire the {@link #save 'save'} event.
	 * @param {Ext.data.Api} action The action which was executed
	 * @param {Object} parameters The parameters which were send to the server
	 * @param {Boolean} success True if the save was successful
	 * @private
	 */
	onExecuteComplete : function(action, parameters, success)
	{
		if (success) {
			this.fireEvent('save', this, parameters);
			this.commit();
		}
	},

	/**
	 * Called after all settings were saved, this will reset the {@link #deleted}
	 * and {@link #modified} arrays (which held all changes since the previous
	 * call to {@link #commit}.
	 */
	commit : function()
	{
		this.deleted = [];
		this.modified = [];
		this.resetSettings = [];
		this.requiresReload = false;
	},

	/**
	 * Get a javascript object containing the hierarchy from a certain position in the {@link #settings} hierarchy.
	 *
	 * Note: This function only accessed {@link #settings} it does not communicate with the Server.
	 *
	 * @param {String} path The key path from where the settings hierarchy must be loaded.
	 * @param {Object} settings (optional) The settings object on which the changes are applied.
	 * @return {Object} The settings object containing all settings from the given key position at the specified path.
	 * @private
	 */
	getSettingsObject : function(path, settings)
	{
		var pieces = path.split(this.pathSeparator);
		var obj = settings || this.settings;

		for (var i = 0, len = pieces.length; i < len; i++) {
			var piece = pieces[i];
			if (Ext.isEmpty(piece)) {
				break;
			}
	
			obj = obj[pieces[i]];
			if (Ext.isEmpty(obj)) {
				break;
			}
		}

		return obj;
	},

	/**
	 * Remove all settings which are positioned below the path inside the {@link #settings} hierarchy.
	 *
	 * Note: This function only accessed {@link #settings} it does not communicate with the Server.
	 *
	 * @param {String} path The key path from where all settings should be deleted.
	 * @param {Object} settings (optional) The settings object on which the changes are applied.
	 * @return {Array} The list of flat setting names which have been deleted from the hierarchy.
	 * @private
	 */
	removeSettingsObject : function(path, settings)
	{
		var lastIndex = path.lastIndexOf(this.pathSeparator);
		var parentPath = path.substring(0, lastIndex);
		var settingName = path.substring(lastIndex + 1);
		var obj = this.getSettingsObject(parentPath, settings);
		var flatSettings = [];

		if (obj) {
			var setting = obj[settingName];

			if (Ext.isObject(setting) && !Ext.isDate(setting) && !Array.isArray(setting)) {
				for (var key in setting) {
					var removed = this.removeSettingsObject(path + this.pathSeparator + key, settings);
					flatSettings = flatSettings.concat(removed);
				}
			}
			flatSettings.push(path);

			delete obj[settingName];
		}

		return flatSettings;
	},

	/**
	 * Applies all settings which are positioned below the path inside the {@link #settings} hierarchy.
	 *
	 * Note: This function only accessed {@link #settings} it does not communicate with the Server.
	 *
	 * @param {String} path The key path from where all settings should be added.
	 * @param {Object} obj The object containing the values which must be placed below the given
	 * path in the settings hierarchy.
	 * @param {Object} settings (optional) The settings object on which the changes are applied.
	 * @return {Array} The list of flat setting names which have been added to the hierarchy.
	 * @private
	 */
	applySettingsObject : function(path, obj, settings)
	{
		var flatSettings = [];

		if (Ext.isObject(obj)) {
			flatSettings.push({ path : path });

			for (var key in obj) {
				flatSettings = flatSettings.concat(this.applySettingsObject(path + this.pathSeparator + key, obj[key], settings));
			}
		} else {
			var lastIndex = path.lastIndexOf(this.pathSeparator);
			var parentPath = path.substring(0, lastIndex);
			var settingName = path.substring(lastIndex + 1);
			var pos = settings || this.settings;

			if (!Ext.isEmpty(parentPath)) {
				var pieces = parentPath.split(this.pathSeparator);
				var piecePath = '';

				for (var i = 0, len = pieces.length; i < len; i++) {
					var piece = pieces[i];

					piecePath += (!Ext.isEmpty(piecePath) ? this.pathSeparator : '') + piece;

					if (Ext.isEmpty(pos[piece])) {
						pos[piece] = {};
					}

					pos = pos[piece];
				}
			}

			if (Array.isArray(obj) || Ext.isDate(obj)) {
				pos[settingName] = obj.clone();
			} else {
				pos[settingName] = obj;
			}

			flatSettings.push({ path: path, value : obj });
		}

		return flatSettings;
	},

	/**
	 * Convert the string into a fully-validated path which is accepted
	 * by this SettingsModel. This will check if the path is a string, and
	 * remove any prefixed or postfixed {@link #pathSeperator path seperators}.
	 * @param {String} path The path the convert
	 * @return {String} The converted path
	 * @private
	 */
	getPath : function(path)
	{
		if (!Ext.isString(path)) {
			return '';
		} else {
			// Remove any trailing, and ending / characters.
			return path.replace(/^\/*|\/*$/g, '');
		}
	},

	/**
	 * Sets a value. The value is immediately stored locally (in {@link #setting}),
	 * and also sent to the server. If saving the setting to the server failed, the {@link #exception} event will be fired.
	 * @param {String} path the key path of the value.
	 * @param {String} value value to set.
	 * @return {String} the value of the requested path, or undefined if it doesn't exist.
	 */
	set : function(path, value)
	{
		path = this.getPath(path);

		// Compare the value with the current saved setting.
		if (JSON.stringify(this.get(path, true)) === JSON.stringify(value)) {
			return;
		}

		var deleteSettings = this.removeSettingsObject(path, this.settings);
		var newSettings = this.applySettingsObject(path, value, this.settings);

		if (!Ext.isEmpty(deleteSettings)) {
			this.removeSettings(deleteSettings);
		}

		if (!Ext.isEmpty(newSettings)) {
			this.setSettings(newSettings);
		}

		// If we are not editing in a batch, save the changes now.
		// Otherwise wait for endEdit.
		if (this.editing === false) {
			this.afterEdit();
		}
	},

	/**
	 * Removes a value. The value is deleted from the local cache immediately,
	 * and a request is sent out to the server to delete the key remotely. If deleting
	 * the setting from the server failed, the {@link #exception} event will be fired.
	 * @param {String} path the key path of the value.
	 */
	remove : function(path)
	{
		path = this.getPath(path);

		var deleteSettings = this.removeSettingsObject(path, this.settings);

		if (!Ext.isEmpty(deleteSettings)) {
			this.removeSettings(deleteSettings);
		}

		// If we are not editing in a batch, save the changes now.
		// Otherwise wait for endEdit.
		if (this.editing === false) {
			this.afterEdit();
		}
	},

	/**
	 * Here it will set the path of settings in {@link #resetSettings} which is needs to be reset.
	 * 
	 * @param {String} path the key path of the value.
	 */
	reset : function(path)
	{
		if (!Array.isArray(path)) {
			path = [ path ];
		}

		this.resetSettings = this.resetSettings.concat(path);
	},

	/**
	 * Restores a value to the predefined {@link #defaults}. The value is deleted from
	 * the local cache immediately and a request is sent out to the server to delete the key
	 * If deleting the setting from the server failed, the {@link #exception} event will be fired.
	 * After the setting has been removed, the {@link #defaults default value} will be set
	 * again. But this will not be saved to the server.
	 * @param {String} path the key path of the value
	 */
	restore : function(path)
	{
		path = this.getPath(path);

		var deleteSettings = this.removeSettingsObject(path, this.settings);
		var newValues = this.getSettingsObject(path, this.defaults);
		var newSettings = this.applySettingsObject(path, newValues, this.settings);

		if (!Ext.isEmpty(deleteSettings)) {
			this.removeSettings(deleteSettings);
		}

		if (!Ext.isEmpty(newSettings)) {
			this.restoreSettings(newSettings);
		}

		// If we are not editing in a batch, save the changes now.
		// Otherwise wait for endEdit.
		if (this.editing === false) {
			this.afterEdit();
		}
	},

	/**
	 * Gets a value. This getter only gets a <b>local</b> copy of the setting, meaning that this method does not initiate
	 * communication with the server. There is currently no way to get an 'up-to-date' value.
	 * @param {String} path the key path of the value.
	 * @param {Boolean} raw True to return if the pathname is only partial and the underlying JS object 
	 * @param {Boolean} [returnDefaults] True to return the default value, else the set value
	 * (containing all underlying settings) must be returned. Defaults to false.
	 * @return {String} the value of the requested path, or undefined if it doesn't exist.
	 */
	get : function(path, raw, returnDefaults)
	{
		path = this.getPath(path);

		var value = returnDefaults ? this.getSettingsObject(path, this.defaults) : this.getSettingsObject(path, this.settings);
		if (Ext.isObject(value)) {
			if (raw === true) {
				return Zarafa.core.Util.applyRecursive({}, value);
			}
		} else if (Array.isArray(value) || Ext.isDate(value)) {
			return value.clone();
		} else {
			return value;
		}
	}
});
