Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsKeyShortcutWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingskeyshortcutwidget
 *
 * The WebApp Keyboard Shortcut widget
 */
Zarafa.settings.ui.SettingsKeyShortcutWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Keyboard Shortcuts'),
			layout : 'form',
			items : [{
				xtype : 'zarafa.compositefield',
				hideLabel : true,
				// FIXME: Set height for IE 11, since otherwise it won't resize properly and leaves a huge empty gap...
				height: 60,
				items : [{
					xtype : 'radiogroup',
					ref : '../keyShortcutGroup',
					columns : 1,
					hideLabel: true,
					name : 'zarafa/v1/main/keycontrols',
					items: [{
						xtype: 'radio',
						boxLabel : _('Keyboard shortcuts off'),
						name: 'keyboardshortcut',
						inputValue: Zarafa.settings.data.KeyboardSettings.NO_KEYBOARD_SHORTCUTS
					},{
						xtype: 'radio',
						boxLabel : _('Basic keyboard shortcuts on'),
						name: 'keyboardshortcut',
						inputValue: Zarafa.settings.data.KeyboardSettings.BASIC_KEYBOARD_SHORTCUTS
					},{
						xtype: 'radio',
						boxLabel : _('All keyboard shortcuts on'),
						name: 'keyboardshortcut',
						inputValue: Zarafa.settings.data.KeyboardSettings.ALL_KEYBOARD_SHORTCUTS
					}],
					listeners : {
						change : this.enableKeyboardShortcuts,
						scope : this
					},
					flex : 1
				},{
					xtype : 'displayfield',
					hideLabel : true,
					height : 20,
					ref : '../keyShortcutWarning',
					flex : 2
				}]
			}]
		});

		Zarafa.settings.ui.SettingsKeyShortcutWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Function initializes 'savesettings' event on {link #settingsContext} for the
	 * {@link Zarafa.settings.ui.SettingsKeyShortcutWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.settings.ui.SettingsKeyShortcutWidget.superclass.initEvents.call(this);

		// listen to savesettings to enable/disable Keyboard controls.
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
	},

	/**
	 * Event handler will be called when
	 * {@link Zarafa.settings.SettingsContextModel#savesettings} event is fired.
	 * Function will enable/disable all keymaps registered with {@link Zarafa.core.KeyMapMgr}
	 * based on setting zarafa/v1/main/keycontrols.
	 * 
	 * @param {Zarafa.settings.SettingsContextModel} settingsContextModel The
	 * context model of settings context.
	 * @param {Zarafa.settings.SettingsModel} settingsEditModel The settingsModel which is being saved.
	 * 
	 * @private
	 */
	onSaveSettings : function(settingsContextModel, settingsEditModel)
	{
		var changed = false;
		var modifiedSettings = settingsEditModel.modified;

		if(!Ext.isEmpty(modifiedSettings)) {
			// Check whether keyboard settings are changed or not.
			for(var i = 0; i < modifiedSettings.length; i++) {
				if (modifiedSettings[i].path === this.keyShortcutGroup.name) {
					changed = true;
					break;
				}
			}
		}

		// keyboard control setting is toggled.
		if(changed === true) {
			// FIXME use isGloballyEnabled : function() in core/KeyMapMgr?
			if (settingsEditModel.get(this.keyShortcutGroup.name) !== Zarafa.settings.data.KeyboardSettings.NO_KEYBOARD_SHORTCUTS) {
				Zarafa.core.KeyMapMgr.enableAllKeymaps();
			} else {
				Zarafa.core.KeyMapMgr.disableAllKeymaps();
			}
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;
		this.keyShortcutGroup.setValue(settingsModel.get(this.keyShortcutGroup.name));
		this.keyShortcutWarning.reset();
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.set(this.keyShortcutGroup.name, this.keyShortcutGroup.getValue().inputValue);
	},
	
	/**
	 * Event handler which is fired when the radiogroup has changed.
	 * If the radiogroup value has been changed it displays a warning which,
	 * informs the user that he needs to reload the WebApp.
	 *
	 * @param {Ext.form.RadioGroup} group The radio group which fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	enableKeyboardShortcuts : function(group, radio)
	{
		if (this.model.get(group.name) !== radio.inputValue) {
			this.model.set(group.name, radio.inputValue);
		}

		// If settingsmodel has been modified, display a warning
		if(!Ext.isEmpty(this.model.modified)) {
			this.keyShortcutWarning.setValue(_('This change requires a reload of the WebApp'));
			this.model.requiresReload = true;
		} else {
			this.keyShortcutWarning.reset();
		}
	}
});

Ext.reg('zarafa.settingskeyshortcutwidget', Zarafa.settings.ui.SettingsKeyShortcutWidget);
