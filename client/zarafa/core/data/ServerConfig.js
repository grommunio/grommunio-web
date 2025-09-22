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
	meta: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		this.meta = config;
	},

	/**
	 * @return {String} the base url of grommunio Web
	 */
	getBaseUrl: function()
	{
		return this.meta.base_url;
	},

	/**
	 * @return {String} the title of grommunio Web
	 */
	getWebappTitle: function()
	{
		return this.meta.webapp_title;
	},

	/**
	 * @return {Boolean} True if the GAB list should only be enabled when searching
	 */
	isFullGabDisabled: function()
	{
		return this.meta.disable_full_gab === true;
	},

	/**
	 * @return {Boolean} True if it should be possible to set rules on the store
	 * of other users.
	 */
	isSharedRulesEnabled: function()
	{
		return this.meta.enable_shared_rules === true;
	},

	/**
	 * @return {Boolean} True if grommunio Web is using Single Sign-On to login
	 */
	usingSSO: function()
	{
		return this.meta.using_sso;
	},

	/**
	 * @return {Boolean} True if Plugins are enabled
	 */
	isPluginsEnabled: function()
	{
		return this.meta.enable_plugins;
	},

	/**
	 * @return {String} A semicolon separated list of plugins that cannot be
	 * disabled by the user.
	 */
	getAlwaysEnabledPluginsList: function()
	{
		return this.meta.always_enabled_plugins || '';
	},

	/**
	 * @return {Boolean} True if Advanced Settings are enabled
	 */
	isAdvancedSettingsEnabled: function()
	{
		return this.meta.enable_advanced_settings;
	},

	/**
	 * @return {Number} The maximum number of allowed attachments in a single message
	 */
	getMaxAttachments: function()
	{
		return this.meta.max_attachments;
	},

	/**
	 * @return {String} The base url for webapp help manual plugin.
	 */
	getWebappManualUrl: function()
	{
		return this.meta.plugin_webappmanual_url;
	},

	/**
	 * @return {Number} The maximum number of files that can be uploaded via a single request.
	 */
	getMaxFileUploads: function()
	{
		return this.meta.max_file_uploads;
	},

	/**
	 * @reutn {Number} The maximum attachment size allowed to attach in single request.
	 */
	getMaxPostRequestSize: function()
	{
		return this.meta.post_max_size;
	},

	/**
	 * @return {Number} The maximum size of a single attachment
	 */
	getMaxAttachmentSize: function()
	{
		return this.meta.max_attachment_size;
	},

	/**
	 * @return {Number} The maximum size of all attachments in a single message combined
	 */
	getMaxAttachmentTotalSize: function()
	{
		return this.meta.max_attachment_total_size;
	},

	/**
	 * @return {Number} The start offset to use when loading freebusy data
	 */
	getFreebusyLoadStartOffset: function()
	{
		return this.meta.freebusy_load_start_offset;
	},

	/**
	 * @return {Number} The end offset to use when loading freebusy data
	 */
	getFreebusyLoadEndOffset: function()
	{
		return this.meta.freebusy_load_end_offset;
	},

	/**
	 * @return {Number} The upper limit of the eml files allowed to be included in single ZIP archive
	 */
	getMaxEmlFilesInZIP: function()
	{
		return this.meta.maximum_eml_files_in_zip;
	},

	/**
	 * @return {Mixed} The client timeout time (in seconds) if set or false otherwise.
	 */
	getClientTimeout: function()
	{
		return this.meta.client_timeout;
	},

	/**
	 * @return {String} The active theme selected by admin or user.
	 */
	getActiveTheme: function()
	{
		return this.meta.active_theme;
	},

	/**
	 * @return {Array} The installed json themes
	 */
	getJsonThemes: function()
	{
		return this.meta.json_themes;
	},

	/**
	 * @return {String} The active iconset selected by admin or user.
	 */
	getActiveIconset: function()
	{
		return this.meta.active_iconset;
	},

	/**
	 * @return {Array} The installed iconsets
	 */
	getIconsets: function()
	{
		return this.meta.iconsets;
	},

	/**
	 * @return {String|Boolean} The primary color for SVG icons if defined by the active theme,
	 * or false otherwise
	 */
	getPrimaryIconColor: function()
	{
		return this.meta.icons_primary_color;
	},

	/**
	 * @return {String|Boolean} The secondary color for SVG icons if defined by the active theme,
	 * or false otherwise
	 */
	getSecondaryIconColor: function()
	{
		return this.meta.icons_secondary_color;
	},

	/**
	 * @return {Object} The about texts of iconsets
	 */
	getIconsetAbouts: function()
	{
		return this.meta.iconsets_about;
	},

	/**
 	 * @return {Array} returns the installed plugins version information array.
	 */
	getPluginsVersion: function()
	{
		return this.meta.version_info;
	},

	/**
	 * @return {Boolean} True if VCF import functionality is supported on backend, false otherwise.
	 */
	isVCfImportSupported: function()
	{
		return this.meta.is_vcfimport_supported;
	},

	/**
	 * @return {Boolean} True if ICS and VCS import functionality is supported on backend, false otherwise.
	 */
	isICSImportSupported: function()
	{
		return this.meta.is_icsimport_supported;
	},

	/**
	 * @return {Array} returns the color schemes defined in config.php/default.php.
	 */
	getColorSchemes: function()
	{
		return this.meta.color_schemes;
	},

	/**
	 * @return {Array} returns the additional color schemes defined in config.php/default.php.
	 */
	getAdditionalColorSchemes: function()
	{
		return this.meta.additional_color_schemes;
	},

	/**
	 * @return {Array} returns the categories defined in config.php/default.php.
	 */
	getDefaultCategories: function()
	{
		return this.meta.default_categories;
	},

	/**
	 * @return {Array} returns the additional categories defined in config.php/default.php.
	 */
	getAdditionalDefaultCategories: function()
	{
		return this.meta.additional_default_categories;
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
	},

	/**
	 * @return {Number} return the shared stores polling interval in microseconds
	 */
	getSharedStorePollingInterval: function()
	{
		return this.meta.shared_store_polling_interval * 60000;
	},

	/**
	 * @return {Boolean} True when the client should prefetch the bodies of the mails that are currently visible.
	 */
	isPrefetchEnabled: function()
	{
		if (Ext.isDefined(this.meta.prefetch_email_enabled)) {
			return this.meta.prefetch_email_enabled;
		}

		return this.getPrefetchTotalCount() > 0;
	},

	/**
	 * @return {Number} return the amount of emails to load in the background
	 */
	getPrefetchTotalCount: function()
	{
		return this.meta.prefetch_email_count;
	},

	/**
	 * @return {String} return the strategy used for mail prefetching.
	 */
	getPrefetchStrategy: function()
	{
		if (!Ext.isString(this.meta.prefetch_email_strategy)) {
			return 'VIEWPORT';
		}

		return this.meta.prefetch_email_strategy;
	},

	/**
	 * @return {Number} return the interval in microseconds to load new emails in the background.
	 */
	getPrefetchInterval: function()
	{
		return this.meta.prefetch_email_interval * 1000;
	},

	/**
	 * @returns {Boolean} True if DOMPurify is enabled by admin(from config.php) else false.
	 */
	getDOMPurifyEnabled: function ()
	{
		return this.meta.enable_dompurify;
	},

	/**
	 * @returns {Boolean} True if file previewer is enabled by admin(from config.php) else false.
	 */
	isFilePreviewerEnabled: function ()
	{
		return this.meta.enable_file_previewer;
	},

	/**
	 * @returns {Boolean} True if theming is enabled by admin(from config.php) else false.
	 */
	isThemingEnabled: function ()
	{
		return this.meta.enable_themes;
	},

	/**
	 * @returns {Boolean} True if iconsets are enabled by admin(from config.php) else false.
	 */
	isIconSetsEnabled: function ()
	{
		return this.meta.enable_iconsets;
	},

	/**
	 * @returns {Boolean} True if widgets are enabled by admin(from config.php) else false.
	 */
	isWidgetEnabled : function()
	{
		return this.meta.enable_widgets;
	}
});
