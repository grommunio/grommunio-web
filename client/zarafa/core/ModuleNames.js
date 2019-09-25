Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.ModuleNames
 * List of module names. Each module represents a server side component that can process actions. A list module
 * for instance will allow 'list' actions.
 * @singleton
 */
Zarafa.core.ModuleNames = 
{
	/**
	 * Module information for the Address book.  
	 * @property
	 * @type Mixed
	 */
	'ADDRESSBOOK' : {
		list : 'addressbooklistmodule',
		item : 'addressbookitemmodule'
	},
	
	/**
	 * Module information for IPM.Appointment
	 * @property
	 * @type Mixed
	 */
	'IPM.APPOINTMENT' : {
		list : 'appointmentlistmodule',
		item : 'appointmentitemmodule'
	},

	/**
	 * Module information for Appointment recurrence exceptions
	 * @property
	 * @type Mixed
	 */
	'IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}' : {
		list : 'appointmentlistmodule',
		item : 'appointmentitemmodule'
	},

	/**
	 * Module information for IPM.Task
	 * @property
	 * @type Mixed
	 */
	'IPM.TASK' : {
		list : 'tasklistmodule',
		item : 'taskitemmodule'
	},

	/**
	 * Module information for IPM.TaskRequest
	 * @property
	 * @type Mixed
	 */
	'IPM.TASKREQUEST' : {
		list : 'tasklistmodule',
		item : 'taskitemmodule'
	},

	/**
	 * contact list module.  
	 * @property
	 * @type Mixed
	 */
	'IPM.CONTACT' : {
		list : 'contactlistmodule',
		item : 'contactitemmodule'
	},

	/**
	 * Distribution list module.
	 * Here we use same module as contact module.
	 * @property
	 * @type Mixed
	 */
	'IPM.DISTLIST' : {
		list : 'contactlistmodule',
		item : 'contactitemmodule'
	},
	
	/**
	 * Module information for hierarchy.
	 * The hierarchy is the set of stores a user can see, and the folders within those
	 * stores.   
	 * @property
	 * @type Mixed
	 */
	'HIERARCHY' : {
		list : 'hierarchymodule',
		item : 'hierarchymodule'
	},

	/**
	 * Module information for settings. 
	 * stores.   
	 * @property
	 * @type Mixed
	 */
	'SETTINGS' : {
		list : 'settingsmodule'
	},

	/**
	 * Module information for IPM.Note
	 * @property
	 * @type Mixed
	 */
	'IPM.NOTE' : {
		list : 'maillistmodule',
		item : 'createmailitemmodule'
	},

	/**
	 * Module information for IPM.StickyNote
	 * @property
	 * @type Mixed
	 */
	'IPM.STICKYNOTE' : {
		list : 'stickynotelistmodule',
		item : 'stickynoteitemmodule'
	},

	/**
	 * Module information for freebusy
	 * @property
	 * @type Mixed
	 */
	'FREEBUSY' : {
		list : 'freebusymodule'
	},

	/**
	 * Module information for busytime
	 * @property
	 * @type Mixed
	 */
	 'BUSYTIME' : {
		 list : 'busytimelistmodule'
	 },

	/**
	 * Module information for freebusy
	 * @property
	 * @type Mixed
	 */
	'SUGGESTEMAILADDRESS' : {
		list : 'suggestemailaddressmodule',
		item : 'suggestemailaddressmodule'
	},
	
	/**
	 * Module information for reminder
	 * @property
	 * @type Mixed
	 */
	'REMINDER' : {
		list : 'reminderlistmodule',
		item : 'reminderitemmodule'
	},

	/**
	 * Module information for delegates
	 * @property
	 * @type Mixed
	 */
	'DELEGATES' : {
		list : 'delegatesmodule',
		item : 'delegatesmodule'
	},

	/**
	 * Module information for Rules
	 * @property
	 * @type Mixed
	 */
	'RULES' : {
		list : 'rulesmodule',
		item : 'rulesmodule'
	},

	/**
	 * Module information for Restore Soft Deleted Items
	 * @property
	 * @type Mixed
	 */
	'RESTOREITEMS' : {
		list : 'restoreitemslistmodule',
		item : 'restoreitemslistmodule'
	},

	/**
	 * Modul information for advance search.
	 * @property
	 * @type Mixed
	 */
	'IPM.SEARCH' : {
		list : 'advancedsearchlistmodule',
		item : 'createmailitemmodule'
	},

	/**
	 * Obtain the moduleName for an appropriate key.
	 * The key could either be a component name, or a Message Class.
	 *
	 * @param {String} key The key for which the module must be found
	 * @param {Boolean} baseOnly (optional) When the the key is not exactly
	 * matched againsts a moduleName, remove everything after the last '.',
	 * defaults to false.
	 * @return {Object} An object containing a 'list' and 'item' key,
	 * for the moduleNames for the 'list' and 'item' module respectively.
	 */
	getModule : function(key, baseOnly)
	{
		key = key.toUpperCase();

		var module = this[key];
		if (!module && baseOnly === true) {
			var index = key.lastIndexOf('.');
			if (index > 0) {
				key = key.substr(0, index);
				module = this.getModule(key, baseOnly);
			}
		}

		return module;
	},

	/**
	 * Obtain the moduleName for the Item module for the appropriate key.
	 * This uses {@link #getModule} to obtain the module, and returns the
	 * itemModulename from the result.
	 * 
	 * @param {String} key The key for which the module must be found
	 * @param {Boolean} baseOnly (optional) When the the key is not exactly
	 * matched againsts a moduleName, remove everything after the last '.',
	 * defaults to false.
	 * @return {String} The item moduleName for the requested module
	 */
	getItemName : function(key, baseOnly)
	{
		var module = this.getModule(key, baseOnly);
		if (module) {
			return module.item;
		}
	},

	/**
	 * Obtain the moduleName for the List module for the appropriate key.
	 * This uses {@link #getModule} to obtain the module, and returns the
	 * listModulename from the result.
	 * 
	 * @param {String} key The key for which the module must be found
	 * @param {Boolean} baseOnly (optional) When the the key is not exactly
	 * matched againsts a moduleName, remove everything after the last '.',
	 * defaults to false.
	 * @return {String} The list moduleName for the requested module
	 */
	getListName : function(key, baseOnly)
	{
		var module = this.getModule(key, baseOnly);
		if (module) {
			return module.list;
		}
	}
};
