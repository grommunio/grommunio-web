Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ServerConfig
 * @extends Object
 *
 * An object which represents the server
 * configuration. To obtain the instance
 * of this object, use {@link Zarafa.core.Container#getServerConfig}.
 */
Zarafa.core.data.ServerConfig = Ext.extend(Object, {

	/**
	 * Object containing all meta data for this server configuration
	 * @property
	 * @type Object
	 */
	meta : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		this.meta = config;
	},

	/**
	 * @return {String} the base url of the WebApp
	 */
	getBaseUrl : function()
	{
		return this.meta.base_url;
	},

	/**
	 * @return {String} the title of the WebApp
	 */
	getWebappTitle : function()
	{
		return this.meta.webapp_title;
	},

	/**
	 * @return {Boolean} True if the GAB list should only be enabled when searching
	 */
	isFullGabDisabled : function()
	{
		return this.meta.disable_full_gab === true;
	},

	/**
	 * @return {Boolean} True if it should be possible to set rules on the store
	 * of other users.
	 */
	isSharedRulesEnabled : function()
	{
		return this.meta.enable_shared_rules === true;
	},

	/**
	 * @return {Boolean} True if WebApp is using Single Sign-On to login
	 */
	usingSSO : function()
	{
		return this.meta.using_sso;
	},

	/**
	 * @return {Boolean} True if Plugins are enabled
	 */
	isPluginsEnabled : function()
	{
		return this.meta.enable_plugins;
	},

	/**
	 * @return {String} A semicolon separated list of plugins that cannot be
	 * disabled by the user.
	 */
	getAlwaysEnabledPluginsList : function()
	{
		return this.meta.always_enabled_plugins || '';
	},

	/**
	 * @return {Boolean} True if Advanced Settings are enabled
	 */
	isAdvancedSettingsEnabled : function()
	{
		return this.meta.enable_advanced_settings;
	},

	/**
	 * @return {Number} The maximum number of allowed attachments in a single message
	 */
	getMaxAttachments : function()
	{
		return this.meta.max_attachments;
	},

	/**
	 * @return {Number} The maximum number of files that can be uploaded via a single request.
	 */
	getMaxFileUploads : function()
	{
		return this.meta.max_file_uploads;
	},

	/**
	 * @reutn {Number} The maximum attachment size allowed to attach in single request.
	 */
	getMaxPostRequestSize : function()
	{
		return this.meta.post_max_size;
	},

	/**
	 * @return {Number} The maximum size of a single attachment
	 */
	getMaxAttachmentSize : function()
	{
		return this.meta.max_attachment_size;
	},

	/**
	 * @return {Number} The maximum size of all attachments in a single message combined
	 */
	getMaxAttachmentTotalSize : function()
	{
		return this.meta.max_attachment_total_size;
	},

	/**
	 * @return {Number} The start offset to use when loading freebusy data
	 */
	getFreebusyLoadStartOffset : function()
	{
		return this.meta.freebusy_load_start_offset;
	},

	/**
	 * @return {Number} The end offset to use when loading freebusy data
	 */
	getFreebusyLoadEndOffset : function()
	{
		return this.meta.freebusy_load_end_offset;
	},

	/**
	 * @return {Number} The upper limit of the eml files allowed to be included in single ZIP archive
	 */
	getMaxEmlFilesInZIP : function()
	{
		return this.meta.maximum_eml_files_in_zip;
	},

	/**
	 * @return {Mixed} The client timeout time (in seconds) if set or false otherwise.
	 */
	getClientTimeout : function()
	{
		return this.meta.client_timeout;
	},

	/**
	 * @return {String} The active theme selected by admin or user.
	 */
	getActiveTheme : function()
	{
		return this.meta.active_theme;
	},

	/**
 	 * @return {Array} returns the installed plugins version information array.
	 */
	getPluginsVersion : function()
	{
		return this.meta.version_info;
	},

	/**
	 * @return {Array} returns the color schemes defined in config.php/default.php.
	 */
	getColorSchemes : function()
	{
		return this.meta.color_schemes;
	},

	/**
	 * @return {Array} returns the additional color schemes defined in config.php/default.php.
	 */
	getAdditionalColorSchemes : function()
	{
		return this.meta.additional_color_schemes;
	},

	/**
	 * @return {Array} returns the contact prefix defined in config.php.
	 */
	getContactPrefix: function ()
	{
		return this.meta.contact_prefix;
	},

	/**
	 * @return {Array} returns the contact suffix defined in config.php.
	 */
	getContactSuffix: function ()
	{
		return this.meta.contact_suffix;
	},

	/**
	 * @return {Array} returns the powerpaste config defined in config.php.
	 */
	getPowerpasteConfig: function ()
	{
		return this.meta.powerpaste;
	}
});
