Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsVersionWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsversionwidget
 *
 * grommunio Web About widget — shows version info and reset button.
 */
Zarafa.settings.ui.SettingsVersionWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * The loadMask object which will be shown when reset request is being sent to the server.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var version = container.getVersion();
		var serverConfig = container.getServerConfig();
		var webVersion = version.getWebApp() + (!Ext.isEmpty(version.getGit()) ? ('-' + version.getGit()) : '');
		var gromoxVersion = version.getZCP();

		// Build diagnostic info
		var authMethod = serverConfig.getAuthMethod();
		var authLabel = authMethod === 'oidc' ? _('OpenID Connect') : _('Basic Authentication');
		var userAgent = navigator.userAgent;
		var browserName = this.detectBrowser(userAgent);

		Ext.applyIf(config, {
			title: _('About'),
			items: [{
				xtype: 'box',
				cls: 'k-settings-about-section',
				autoEl: {
					tag: 'div',
					children: [{
						tag: 'div',
						cls: 'k-settings-about-section-title',
						html: _('System information')
					},{
						tag: 'div',
						cls: 'k-settings-about-info',
						children: [{
							tag: 'span',
							html: '<b>' + _('grommunio Web') + '</b> ' +
								Ext.util.Format.htmlEncode(webVersion)
						},{
							tag: 'span',
							html: '<b>' + _('Gromox') + '</b> ' +
								Ext.util.Format.htmlEncode(gromoxVersion)
						},{
							tag: 'span',
							html: '<b>' + _('Logged in via') + '</b> ' +
								Ext.util.Format.htmlEncode(authLabel)
						},{
							tag: 'span',
							html: '<b>' + _('Browser') + '</b> ' +
								Ext.util.Format.htmlEncode(browserName)
						}]
					}]
				}
			},{
				xtype: 'box',
				cls: 'k-settings-about-section',
				autoEl: {
					tag: 'div',
					children: [{
						tag: 'div',
						cls: 'k-settings-about-section-title',
						html: _('Maintenance')
					}]
				}
			},{
				xtype: 'button',
				cls: 'k-settings-about-reset-btn',
				text: _('Reset all settings to defaults'),
				handler: this.onResetSettings,
				scope: this
			},
				container.populateInsertionPoint('settings.versioninformation')
			]
		});

		Zarafa.settings.ui.SettingsVersionWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Detect browser name and version from user agent string.
	 * @param {String} ua The user agent string
	 * @return {String} Human-readable browser name
	 * @private
	 */
	detectBrowser: function(ua)
	{
		if (ua.indexOf('Firefox') > -1) {
			var match = ua.match(/Firefox\/(\d+)/);
			return 'Firefox' + (match ? ' ' + match[1] : '');
		} else if (ua.indexOf('Edg/') > -1) {
			var match = ua.match(/Edg\/(\d+)/);
			return 'Microsoft Edge' + (match ? ' ' + match[1] : '');
		} else if (ua.indexOf('Chrome') > -1) {
			var match = ua.match(/Chrome\/(\d+)/);
			return 'Chrome' + (match ? ' ' + match[1] : '');
		} else if (ua.indexOf('Safari') > -1) {
			var match = ua.match(/Version\/(\d+)/);
			return 'Safari' + (match ? ' ' + match[1] : '');
		}
		return _('Unknown');
	},

	/**
	 * Event handler when the "Reset settings" button was clicked.
	 * @private
	 */
	onResetSettings: function()
	{
		var message = _('This will close all opened shared stores and resets all settings to the default value.');
		message += '<br/><br/>';
		message += _('grommunio Web will automatically reload in order for these changes to take effect');
		message += '<br/>';

		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			title: _('Reset settings'),
			msg: message,
			cls: Ext.MessageBox.WARNING_CLS,
			fn: this.resetDefaultSettings,
			customButton: [{
				text: _('Reset'),
				name: 'reset'
			}, {
				text: _('Cancel'),
				name: 'cancel'
			}],
			scope: this
		});
	},

	/**
	 * Event handler for {@link #onResetSettings}.
	 * @param {String} button The button which user pressed.
	 * @private
	 */
	resetDefaultSettings: function(button)
	{
		if (button === 'reset') {
			var contextModel = this.settingsContext.getModel();
			var realModel = contextModel.getRealSettingsModel();

			realModel.reset('zarafa/v1');
			realModel.save();

			this.loadMask = new Zarafa.common.ui.LoadMask(Ext.getBody(), {
				msg: '<b>' + _('Reloading, Please wait.') + '</b>'
			});

			this.loadMask.show();

			this.mon(realModel, 'save', this.onSettingsSave, this);
			this.mon(realModel, 'exception', this.onSettingsException, this);
		}
	},

	/**
	 * Called when settings were successfully saved — forces reload.
	 * @param {Zarafa.settings.SettingsModel} model
	 * @param {Object} parameters
	 * @private
	 */
	onSettingsSave: function(model, parameters)
	{
		if(parameters.action === Zarafa.core.Actions['reset']) {
			this.mun(model, 'save', this.onSettingsSave, this);
			this.mun(model, 'exception', this.onSettingsException, this);
			Zarafa.core.Util.reloadWebapp();
		}
	},

	/**
	 * Called when settings save failed.
	 * @param {Zarafa.settings.SettingsModel} model
	 * @param {String} type
	 * @param {String} action
	 * @param {Object} options
	 * @param {Object} response
	 * @private
	 */
	onSettingsException: function(model, type, action, options, response)
	{
		if(options.action === Zarafa.core.Actions['reset']) {
			this.loadMask.hide();
			this.mun(model, 'save', this.onSettingsSave, this);
			this.mun(model, 'exception', this.onSettingsException, this);
		}
	}
});

Ext.reg('zarafa.settingsversionwidget', Zarafa.settings.ui.SettingsVersionWidget);
