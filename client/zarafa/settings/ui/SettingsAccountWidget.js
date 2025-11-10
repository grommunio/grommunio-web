Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsAccountWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsaccountwidget
 *
 * The Account Information widget
 */
Zarafa.settings.ui.SettingsAccountWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * The language which is currently active in the interface
	 * @property
	 * @type String
	 * @private
	 */
	origLanguage: '',

	/**
	 * The name that will be shown for the default theme (i.e. no theme selected)
	 * @property
	 * @type String
	 * @private
	 */
	defaultThemeName: _('Basic'),

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var user = container.getUser();
		var languageStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['lang', 'name'],
			data: container.getLanguages()
		};

		// Load the items from the maintabbar
		var items = container.populateInsertionPoint('main.maintabbar.left', this);
		items = Zarafa.core.Util.sortArray(items, 'ASC', 'tabOrderIndex');
		var startupStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['context', 'text'],
			data: items
		};

		// Create a store with the available themes
		items = [[0, this.defaultThemeName, 'basic']];
		var plugins = container.getPlugins();
		for ( var i=0; i<plugins.length; i++ ){
			var plugin = plugins[i];
			if ( plugin instanceof Zarafa.core.ThemePlugin ){
				items.push([items.length, plugin.getDisplayName(), plugin.getName()]);
			}
		}
		const jsonThemes = container.getServerConfig().getJsonThemes();
		for ( var theme in jsonThemes ) {
			if ( jsonThemes.hasOwnProperty(theme) ) {
				items.push([items.length, jsonThemes[theme], theme]);
			}
		}
		var themeStore = new Ext.data.ArrayStore({
			fields: ['id', 'displayName', 'name'],
			idIndex: 0,
			data: items,
			sortInfo: {
				field: 'displayName',
				direction: 'ASC'
			}
		});

		var iconsetItems = [];
		const iconsets = container.getServerConfig().getIconsets();
		for ( var iconset in iconsets ) {
			if ( iconsets.hasOwnProperty(iconset) ) {
				iconsetItems.push([iconset, iconsets[iconset]['display-name']]);
			}
		}
		var iconsetStore = new Ext.data.ArrayStore({
			fields: ['id', 'displayName'],
			idIndex: 0,
			data: iconsetItems,
			sortInfo: {
				field: 'displayName',
				direction: 'ASC'
			}
		});

		Ext.applyIf(config, {
			title : String.format(_('Account information - {0}'), user.getDisplayName()),
			layout : 'form',
			items : [{
				xtype : 'box',
				fieldLabel : _('Profile Picture'),
				style : 'object-fit: cover; cursor: pointer',
				width : 72,
				height : 72,
				autoEl : {
					tag : 'img',
					src : user.getUserImage()
				},
				border : false,
				name : 'zarafa/v1/main/thumbnail_photo',
				ref : 'thumbnail_photo',
				listeners : {
					afterrender : this.onAfterRender,
					scope : this
				}
			},{
				xtype : 'displayfield',
				fieldLabel : _('Display Name'),
				value : user.getDisplayName(),
				htmlEncode : true
			},{
				xtype: 'displayfield',
				fieldLabel: _('Email'),
				value: user.getSMTPAddress(),
				htmlEncode: true
			},{
				xtype: 'zarafa.compositefield',
				fieldLabel: _('Language'),
				items: [{
					xtype: 'combo',
					name: 'zarafa/v1/main/language',
					ref: '../languageCombo',
					width: 200,
					store: languageStore,
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'lang',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					autoSelect: true,
					listeners: {
						select: this.onLanguageSelect,
						scope: this
					}
				},{
					xtype: 'displayfield',
					cls: 'zarafa-settings-reload-warning',
					ref: '../languageWarning'
				}]
			},{
				xtype: 'combo',
				fieldLabel: _('Startup folder'),
				name: 'zarafa/v1/main/default_context',
				ref: 'startupCombo',
				width: 200,
				store: startupStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'text',
				valueField: 'context',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				autoSelect: true,
				listeners: {
					select: this.onStartupSelect,
					scope: this
				}
			}]
		});

		if ( themeStore.data.length > 1  && container.getServerConfig().isThemingEnabled()){
			// We have more than just the basic theme and Admin allows user to configure theme, only then enabled theme dropdown.
			config.items.push({
				xtype: 'combo',
				width: 200,
				editable: false,
				forceSelection: true,
				triggerAction: 'all',
				store: themeStore,
				fieldLabel: _('Theme'),
				mode: 'local',
				valueField: 'name',
				displayField: 'displayName',
				ref: 'themeCombo',
				name: 'zarafa/v1/main/active_theme',
				listeners: {
					select: this.onThemeSelect,
					scope: this
				}
			});
		}

		// We always have more than one iconset (grommunio Web ships with the classic and breeze icon sets)
		config.items.push({
			xtype: 'combo',
			width: 200,
			editable: false,
			forceSelection: true,
			triggerAction: 'all',
			store: iconsetStore,
			fieldLabel: _('Icons'),
			mode: 'local',
			hidden: !container.getServerConfig().isIconSetsEnabled(),
			valueField: 'id',
			displayField: 'displayName',
			ref: 'iconsetCombo',
			name: 'zarafa/v1/main/active_iconset',
			listeners: {
				select: this.onIconsetSelect,
				scope: this
			}
		});

		// Insertion point at the end of the account information widget
		config.items.push(
			container.populateInsertionPoint('settings.account.last')
		);

		Zarafa.settings.ui.SettingsAccountWidget.superclass.constructor.call(this, config);
	},
	
	/**
	 * Event handler which is fired after the {@link Ext.form.FormPanel FormPanel}
	 * has been {@link Ext.Component#afterrender rendered}. Here thumbnail photo box has 
	 * listen {@link Ext.Element#click single click}, {@link Ext.Element#dblclick double click} and
	 * {@link Ext.Element#contextmenu context menu} evetns. 
	 * @param {Ext.Component} thumbnailPhotoBox which show the thumbnail picture.
	 * @private
	 */
	onAfterRender : function(thumbnailPhotoBox)
	{
		var imageFieldCt = thumbnailPhotoBox.getEl();
		this.mon(imageFieldCt, {
			'click' : this.onSingleClick, 
			'dblclick' : this.onDoubleClick,
			'scope' : this
		});
	},
	
	/**
	 * Callback function for {@link Zarafa.common.attachment.ui.UploadAttachmentComponent}.
	 * 
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Object} form the form is contains {@link Ext.form.BasicForm bacisform} info.
	 */
	uploadThumbnailPhotoCallback : function(files, form)
	{
		try {
			let imageFieldCt = this.thumbnail_photo.getEl();
			var file = files[0]
			const fr = new FileReader(file)
			fr.readAsDataURL(file)
			fr.onload = function () {
			 	imageFieldCt.dom.src = this.result;
			}
		}  catch(e) {
			console.log('File Upload not supported: ${e}');
		}
	},
	
	/**
	 * Event handler for opening the Browser's file selection dialog.
	 * See {@link #onFileInputChange} for the handling of the selected files.
	 * @private
	 */
	uploadThumbnailPhoto : function()
	{
		var attachComponent = new Zarafa.common.attachment.ui.UploadAttachmentComponent({
			callback : this.uploadThumbnailPhotoCallback,
			accept : 'image/*',
			scope : this
		});

		attachComponent.openAttachmentDialog();
	},
	
	/**
	 * Event handler which is fired when the thumbnail
	 * picture field is being clicked this will call the 
	 * {@link #uploadThumbnailPhoto} function to open upload dialog.
	 * 
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @param {Element} target Event target
	 * @param {Object} object Configuration object
	 */
	onSingleClick : function(eventObj, target, object)
	{
		this.uploadThumbnailPhoto();
	},

	/**
	 * Event handler which is fired when thumbnail picture field is being
	 * double-clicked and this will call the {@link #uploadThumbnailPhoto}
	 * function to open upload dialog. 
	 * 
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @param {Element} target Event target
	 * @param {Object} object Configuration object
	 */
	onDoubleClick : function(eventObj, target, object)
	{
		this.uploadThumbnailPhoto();
	},

	/**
	 * Event handler which is fired when a language in the {@link Ext.form.ComboBox combobox}
	 * has been selected. This will inform the user that this setting requires a reload of the
	 * webapp to become active.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onLanguageSelect: function(combo, record, index)
	{
		var value = record.get(combo.valueField);

		if (this.origLanguage !== value) {
			this.model.requiresReload = true;
		}

		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Event handler which is fired when a Startup Context in the {@link Ext.form.ComboBox combobox}
	 * has been selected.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onStartupSelect: function(combo, record, index)
	{
		var value = record.get(combo.valueField);
		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Event handler which is fired when a theme in the {@link Ext.form.ComboBox combobox}
	 * has been selected. This will dynamically apply the new theme without requiring a reload.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onThemeSelect: function(combo, record, index)
	{
		var value = record.get(combo.valueField);

		if (this.activeTheme !== value) {
			// Dynamically switch theme by updating the body class
			var bodyEl = Ext.getBody();

			// Remove ALL existing theme-* classes
			// This handles switching from any theme to any other theme
			var bodyClasses = bodyEl.dom.className.split(' ');
			for (var i = 0; i < bodyClasses.length; i++) {
				if (bodyClasses[i].indexOf('theme-') === 0) {
					bodyEl.removeClass(bodyClasses[i]);
				}
			}

			// Remove dark theme CSS if switching away from dark theme
			if (this.activeTheme === 'dark') {
				this.removeDarkThemeCSS();
			}

			// Add new theme class if not 'basic'
			// Basic theme uses no theme class and falls back to the original hardcoded colors in the CSS
			if (value && value !== 'basic') {
				var newThemeClass = 'theme-' + value;
				bodyEl.addClass(newThemeClass);

				// Load dark theme CSS if switching to dark theme
				if (value === 'dark') {
					this.loadDarkThemeCSS();
				}
			}

			// Update the active theme reference
			this.activeTheme = value;
		}

		if (this.model) {
			this.model.set(combo.name, value);
		}

		// Set Onlyoffice theme
		window.localStorage.setItem('ui-theme',
			value === 'dark' ? '{"id":"theme-dark","type":"dark"}' : '{"id":"theme-light","type":"light"}');
		window.localStorage.setItem('ui-theme-id',
			value === 'dark' ? 'theme-dark' : 'theme-light');
	},

	/**
	 * Dynamically loads the dark theme CSS file by injecting a link element into the page.
	 * @private
	 */
	loadDarkThemeCSS: function()
	{
		// Check if dark theme CSS is already loaded (either by id or by href)
		var existingLink = this.findDarkThemeCSS();
		if (existingLink) {
			// Tag it with our id so we can manage it later
			existingLink.id = 'dark-theme-stylesheet';
			return;
		}

		// Determine the correct path based on build mode
		// In SOURCE mode: client/zarafa/core/themes/dark/css/themedark.css
		// In DEBUG/RELEASE mode: client/themes/dark/css/themedark.css
		var cssPath = this.detectThemePath();

		// Create and inject the dark theme CSS link
		var link = document.createElement('link');
		link.id = 'dark-theme-stylesheet';
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = cssPath;
		document.head.appendChild(link);
	},

	/**
	 * Detects the correct path for theme CSS files based on existing link tags.
	 * Falls back to built version path if detection fails.
	 * @return {String} The path to the dark theme CSS file
	 * @private
	 */
	detectThemePath: function()
	{
		// Check existing CSS link tags to detect the theme path structure
		var links = document.getElementsByTagName('link');
		for (var i = 0; i < links.length; i++) {
			var href = links[i].href;
			if (href && href.indexOf('grommunio.css') !== -1) {
				// Found main CSS, check if it's in client/resources/ (built) or client/zarafa/ (source)
				if (href.indexOf('client/zarafa/') !== -1) {
					// SOURCE mode
					return 'client/zarafa/core/themes/dark/css/themedark.css';
				} else {
					// DEBUG/RELEASE mode (built)
					return 'client/themes/dark/css/themedark.css';
				}
			}
		}

		// Default to built version path
		return 'client/themes/dark/css/themedark.css';
	},

	/**
	 * Removes the dark theme CSS file from the page.
	 * @private
	 */
	removeDarkThemeCSS: function()
	{
		var darkStylesheet = this.findDarkThemeCSS();
		if (darkStylesheet) {
			darkStylesheet.parentNode.removeChild(darkStylesheet);
		}
	},

	/**
	 * Finds the dark theme CSS link element in the page.
	 * @return {HTMLLinkElement} The dark theme link element, or null if not found
	 * @private
	 */
	findDarkThemeCSS: function()
	{
		// First try to find by id
		var link = document.getElementById('dark-theme-stylesheet');
		if (link) {
			return link;
		}

		// If not found by id, search all link elements for the dark theme CSS
		var links = document.getElementsByTagName('link');
		for (var i = 0; i < links.length; i++) {
			if (links[i].href && links[i].href.indexOf('themedark.css') !== -1) {
				return links[i];
			}
		}

		return null;
	},

	/**
	 * Event handler which is fired when an iconset in the {@link Ext.form.ComboBox combobox}
	 * has been selected. This will inform the user that this setting requires a reload of the
	 * webapp to become active.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onIconsetSelect: function(combo, record, index)
	{
		var value = record.get(combo.valueField);

		if (this.activeIconset !== value) {
			this.model.requiresReload = true;
		}

		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAccountWidget.superclass.update.apply(this, arguments);

		this.model = settingsModel;

		// Load the original language from the settings
		this.origLanguage = settingsModel.get(this.languageCombo.name);

		this.languageCombo.setValue(this.origLanguage);
		this.languageWarning.reset();

		this.startupCombo.setValue(settingsModel.get(this.startupCombo.name));

		// Set the currently active theme only when themes are available and the themecombo exists
		if ( Ext.isDefined(this.themeCombo) ){
			this.activeTheme = settingsModel.get(this.themeCombo.name);
			// Check if a theme was set and if this theme has not been removed by the admin
			if ( !this.activeTheme || this.themeCombo.store.find('name', this.activeTheme)===-1 ){
				this.activeTheme = container.getServerConfig().getActiveTheme() || this.defaultThemeName;
			}
			this.themeCombo.setValue(this.activeTheme);
		}

		this.activeIconset = settingsModel.get(this.iconsetCombo.name);
		// Check if an iconset was set
		if ( !this.activeIconset || this.iconsetCombo.store.find('id', this.activeIconset)===-1 ){
			this.activeIconset = container.getServerConfig().getActiveIconset();
		}
		this.iconsetCombo.setValue(this.activeIconset);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAccountWidget.superclass.updateSettings.apply(this, arguments);

		settingsModel.beginEdit();
		var user = container.getUser();
		user.setUserImage(this.thumbnail_photo.getEl().dom.src);
		settingsModel.set(this.thumbnail_photo.name, this.thumbnail_photo.getEl().dom.src);
		settingsModel.set(this.languageCombo.name, this.languageCombo.getValue());
		settingsModel.set(this.startupCombo.name, this.startupCombo.getValue());

		// Save the selected theme only when themes are available and the themecombo exists
		if ( Ext.isDefined(this.themeCombo) ){
			settingsModel.set(this.themeCombo.name, this.themeCombo.getValue());
		}

		settingsModel.set(this.iconsetCombo.name, this.iconsetCombo.getValue());
		settingsModel.endEdit();
	}
});

Ext.reg('zarafa.settingsaccountwidget', Zarafa.settings.ui.SettingsAccountWidget);
