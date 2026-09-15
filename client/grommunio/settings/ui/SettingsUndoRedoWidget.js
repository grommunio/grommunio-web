Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsUndoRedoWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingsundoredowidget
 *
 * The undo/redo settings widget. The undo/redo feature is opt-in
 * (see {@link Grommunio.core.data.UndoManager#enabled}): recording undo
 * information adds overhead to every message action, so the user has to
 * enable it here explicitly.
 */
Grommunio.settings.ui.SettingsUndoRedoWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Undo and redo'),
			layout: 'form',
			items: [{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('Undo (Ctrl+Z) and redo (Ctrl+Y) of actions such as deleting, moving or flagging messages. Recording these actions adds a small overhead, therefore the feature is disabled by default.')
			},{
				xtype: 'checkbox',
				name: 'grommunio/v1/main/undo_redo/enable',
				ref: 'enableUndoRedo',
				boxLabel: _('Enable undo and redo of message actions'),
				hideLabel: true,
				requiresReload: true,
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			}]
		});

		Grommunio.settings.ui.SettingsUndoRedoWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;
		this.enableUndoRedo.setValue(settingsModel.get(this.enableUndoRedo.name));
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		settingsModel.set(this.enableUndoRedo.name, this.enableUndoRedo.getValue());
	},

	/**
	 * Event handler which is called when the checkbox has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {Boolean} value The new value
	 * @private
	 */
	onFieldChange: function(field, value)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== value) {
				this.model.set(field.name, value);

				// The toolbar buttons, keyboard shortcuts and store
				// listeners are only set up during startup.
				if (Ext.isDefined(field.requiresReload) && field.requiresReload) {
					this.model.requiresReload = true;
				}
			}
		}
	}
});

Ext.reg('grommunio.settingsundoredowidget', Grommunio.settings.ui.SettingsUndoRedoWidget);
