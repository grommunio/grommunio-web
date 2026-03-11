Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsKeyShortcutCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingskeyshortcutcategory
 *
 * Special Settings Category which shows the list and description of keyboard shortcuts
 * of grommunio Web.
 */
Zarafa.settings.ui.SettingsKeyShortcutCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Keyboard Shortcuts'),
			categoryIndex: 9998,
			iconCls: 'zarafa-settings-category-keyshortcut',
			items: this.generateWidgets(config)
		});

		Zarafa.settings.ui.SettingsKeyShortcutCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Retrieve The list of {@link Zarafa.core.KeyMapMgr#keys key} configurations.
	 * Generate the key Combinations and Description based on the
	 * available {@link Zarafa.core.KeyMap KeyMap} configurations.
	 * Preparing a Key Combination of keys along with some Special keys like ENTER, F5, DELETE.
	 * @return {Object} keyDescription An object contains the Key-Combination and Description.
	 * @private
	 */
	getShortcutDescription: function()
	{
		var keyDescription = {};

		Ext.iterate(Zarafa.core.KeyMapMgr.keys, function(key, bindings) {
			for (var i = 0, len = bindings.length; i < len; i++)
			{
				var keyCombination = this.getKeyCombination(bindings[i]);
				var settingsCfg = bindings[i].settingsCfg;

				if(Ext.isEmpty(keyCombination) || !Ext.isDefined(settingsCfg)) {
					// there was some problem getting key combination
					// don't add the row
					continue;
				}

				var category = settingsCfg.category;

				if(!Ext.isObject(keyDescription[category])) {
					keyDescription[category] = {};
				}

				keyDescription[category][keyCombination] = {
					shortcutDesc: settingsCfg.description,
					fieldLabel: keyCombination,
					basicShortcut: Ext.isDefined(bindings[i].basic)
				};
			}
		}, this);

		return keyDescription;
	},

	/**
	 * Creates the {@link Zarafa.settings.ui.SettingsWidget widget} for 'Plugins'
	 * category of Settings context, In which the key combination and its respective
	 * description will be displayed as per the different Description categories.
	 * It will also include {@link Zarafa.settings.ui.SettingsKeyShortcutWidget widget} to
	 * enable/ disable the entire Keyboard control.
	 * @param {Object} config Configuration object
	 * @return {Array} widgets The widget components.
	 * @private
	 */
	generateWidgets: function(config)
	{
		var keyDescription = this.getShortcutDescription();

		var widgets = [{
			xtype: 'zarafa.settingskeyshortcutwidget',
			settingsContext: config.settingsContext
		}];

		Ext.iterate(keyDescription, function(key, bindings) {
			widgets.push({
				xtype: 'zarafa.settingswidget',
				title: key,
				layout: 'form',
				itemCls: 'zarafa-settings-keyboard-shortcut-row',
				items: this.generateRows(keyDescription[key]),
				// we don't want to show label separators
				labelSeparator: ''
			});
		}, this);

		return widgets;
	},

	/**
	 * Generate the UI components which contains the Key Combination and its respective description,
	 * to insert it into the category wise widgets.
	 * @param {Object} categoryDescription The object containing description about a particular category.
	 * @return {Array} categoryRows The array of components to display rows for the widgets.
	 * @private
	 */
	generateRows: function(categoryDescription)
	{
		var categoryRows = [];

		Ext.iterate(categoryDescription, function(descKey, description) {
			categoryRows.push({
				xtype: 'displayfield',
				hideLabel: true,
				html: this.generateDisplayValue(description)
			});
		},this);

		return categoryRows;
	},

	/**
	 * Generates the HTML for a keyboard shortcut row with level chiplet,
	 * key combination styled as keyboard keys, and description.
	 *
	 * @param {Object} description The object containing the description of a keybinding
	 * @private
	 */
	generateDisplayValue: function(description)
	{
		var levelCls = description.basicShortcut ? 'k-kbd-level-basic' : 'k-kbd-level-extended';
		var levelText = description.basicShortcut ? _('Basic') : _('Extended');
		var html = '<span class="k-kbd-level ' + levelCls + '">' + levelText + '</span>';

		// Style each key in the combination as a key cap
		var keys = description.fieldLabel.split(' + ');
		html += '<span class="k-kbd-keys">';
		for (var i = 0; i < keys.length; i++) {
			if (i > 0) {
				html += '<span class="k-kbd-plus">+</span>';
			}
			html += '<kbd>' + Ext.util.Format.htmlEncode(keys[i]) + '</kbd>';
		}
		html += '</span>';

		html += '<span class="keyboard-desc">' + description.shortcutDesc + '</span>';
		return html;
	},

	/**
	 * Generate the key Combinations based on available {@link Zarafa.core.KeyMap KeyMap} configurations.
	 * It will also concate the combination for special keys like ENTER, F5, DELETE accordingly.
	 * @param {Object|Array} keyConfig The {@link Zarafa.core.KeyMap KeyMap} configurations.
	 * @return {Object} {@link #keyDescription} keyConfig contains the Key-Combination and Description.
	 * @private
	 */
	getKeyCombination: function(keyConfig)
	{
		var keyCombination = [];

		if(keyConfig.ctrl) {
			// check if we have a mac OS then show CMD instead of CTRL
			keyCombination.push(Ext.isMac ? 'CMD' : 'CTRL');
		}

		if(keyConfig.alt) {
			keyCombination.push('ALT');
		}

		if(keyConfig.shift) {
			keyCombination.push('SHIFT');
		}

		var key = keyConfig.key;
		if(!Ext.isEmpty(key)) {
			// if any special key is there in configuration, then we need to prepare the combination accordingly
			if (Array.isArray(key)) {
				if (key[0] === Ext.EventObject.LEFT && key[1] === Ext.EventObject.RIGHT){
					keyCombination.push('ARROW KEYS');
				} else {
					// it is use to prepare key combination Ctrl + 0..9 and Ctrl + Alt + 1..9.
					// which is use for context switching and different view switching respectively.
					keyCombination.push(keyConfig.ctrl && keyConfig.alt ? '1...9' : '0...9');
				}
			} else {
				if (key === Ext.EventObject.F5) {
					keyCombination.push('F5');
				} else if (key === Ext.EventObject.F2) {
					keyCombination.push('F2');
				} else if (key === Ext.EventObject.LEFT) {
					keyCombination.push('LEFT ARROW');
				} else if (key === Ext.EventObject.RIGHT) {
					keyCombination.push('RIGHT ARROW');
				} else if (key === Ext.EventObject.ENTER) {
					keyCombination.push('ENTER');
				} else if (key === Ext.EventObject.HOME) {
					keyCombination.push('HOME');
				} else if (key === Ext.EventObject.END) {
					keyCombination.push('END');
				} else if (key === Ext.EventObject.DELETE) {
					// Check if Mac OS is used, then show FN + BACKSPACE (Mac OS does not have a delete key)
					if(Ext.isMac) {
						keyCombination.push('FN');
						keyCombination.push('BACKSPACE');
					} else {
						keyCombination.push('DELETE');
					}
				} else {
					if(Ext.isNumber(key)) {
						keyCombination.push(String.fromCharCode(key));
					} else {
						// assume that we have a string as key
						keyCombination.push(key);
					}
				}
			}

			return keyCombination.join(' + ');
		}

		// hmmm there is some problem, you shouldn't arrive here
		return '';
	}
});

Ext.reg('zarafa.settingskeyshortcutcategory', Zarafa.settings.ui.SettingsKeyShortcutCategory);
