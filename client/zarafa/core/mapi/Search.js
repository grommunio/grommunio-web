Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.Search
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different search flags used in SetSearchCriteria and GetSearchCriteria.
 * 
 * @singleton
 */
Zarafa.core.mapi.Search = Zarafa.core.Enum.create({
	// Flags used by GetSearchCriteria

	/**
	 * @property
	 * @type Number
	 * The search is running means search folder is in active state.
	 */
	SEARCH_RUNNING : 0x00000001,
	
	/**
	 * @property
	 * @type Number
	 * The search is in the CPU-intensive mode of its operation, trying to locate messages that match the criteria.
	 * If this flag is not set, the CPU-intensive part of the search's operation is over.
	 * This flag only has meaning if the search is active (if the SEARCH_RUNNING flag is set).
	 */
	SEARCH_REBUILD : 0x00000002,

	/**
	 * @property
	 * @type Number
	 * The search is looking in specified folder containers and all their child folder containers for matching entries.
	 */
	SEARCH_RECURSIVE : 0x00000004,

	/**
	 * @property
	 * @type Number
	 * The search is running at a high priority relative to other searches.
	 */
	SEARCH_FOREGROUND : 0x00000008,

	// Flags used by SetSearchCriteria

	/**
	 * @property
	 * @type Number
	 * Request server to abort the search.
	 */
	STOP_SEARCH : 0x00000001,

	/**
	 * @property
	 * @type Number
	 * Request server to restart/start the search.
	 */
	RESTART_SEARCH : 0x00000002,

	/**
	 * @property
	 * @type Number
	 * Request server to search in specified folder containers and all their child folder containers for matching entries.
	 */
	RECURSIVE_SEARCH : 0x00000004,

	/**
	 * @property
	 * @type Number
	 * Request server to search in specified folder containers only and not in child folder containers for matching entries.
	 * defaults for first search call if RECURSIVE_SEARCH or SHALLOW_SEARCH flag is not used.
	 */
	SHALLOW_SEARCH : 0x00000008,

	/**
	 * @property
	 * @type Number
	 * Request the server to run this search at a high priority relative to other searches.
	 */
	FOREGROUND_SEARCH : 0x00000010,

	/**
	 * @property
	 * @type Number
	 * Request the server to run this search at normal priority relative to other searches.
	 * defaults for first search call if FOREGROUND_SEARCH or BACKGROUND_SEARCH flag is not used.
	 */
	BACKGROUND_SEARCH : 0x00000020,

	/**
	 * Convinience method to check if search is active or it has been stopped by user.
	 * @param {Number} searchState value of searchState flag that is returned by GetSearchCriteria.
	 * @return {Boolean} true if search is active or false.
	 */
	isSearchActive : function(searchState)
	{
		if(!Ext.isNumber(searchState)) {
			searchState = parseInt(searchState, 10);
		}

		if(!Ext.isNumber(searchState)) {
			return false;
		}

		if(searchState & this.SEARCH_RUNNING) {
			return true;
		}

		return false;
	},

	/**
	 * Convinience method to check if search is locating messages in folder containers for matching entries.
	 * @param {Number} searchState value of searchState flag that is returned by GetSearchCriteria.
	 * @return {Boolean} true if search is running or false.
	 */
	isSearchRunning : function(searchState)
	{
		if(!Ext.isNumber(searchState)) {
			searchState = parseInt(searchState, 10);
		}

		if(!Ext.isNumber(searchState)) {
			return false;
		}

		if(searchState & this.SEARCH_REBUILD && searchState & this.SEARCH_RUNNING) {
			return true;
		}

		return false;
	}
});
