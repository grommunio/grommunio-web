/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.settings');

/**
 * @class Grommunio.common.settings.SettingsRuleCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsrulecategory
 *
 * The rule category to modify inbox rules for user.
 */
Grommunio.common.settings.SettingsRuleCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.rules
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.common.settings.SettingsRuleCategory Rule Category}.
	 * @param {Grommunio.common.settings.SettingsRuleCategory} category The rule
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Rules'),
			categoryIndex: 3,
			xtype: 'grommunio.settingsrulecategory',
			iconCls: 'grommunio-settings-category-rules',
			layout: 'fit',
			autoScroll: false,
			items: [{
					xtype: 'grommunio.settingsrulewidget',
					settingsContext: config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.rules', this)
			]
		});

		Grommunio.common.settings.SettingsRuleCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by superclass when the Category has been deselected and is hidden from the user,
	 * this will unregister the {@link #onBeforeSaveRules} event handler.
	 * @private
	 */
	onHide: function()
	{
		Grommunio.common.settings.SettingsRuleCategory.superclass.onHide.apply(this, arguments);

		// Unregister the 'beforesave' event. This could be lingering when
		// 'savesettings' was fired but it was cancelled by one of the
		// event handlers.
		var store = this.get(0).getRulesStore();
		this.mun(store, 'beforesave', this.onBeforeSaveRules, this);
	},

	/**
	 * Event handler for the
	 * {@link Grommunio.settings.SettingsContextModel ContextModel}#{@link Grommunio.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will register the 'beforesave' event on {@link Grommunio.common.rules.data.RulesStore Rules Store}.
	 * @private
	 */
	onBeforeSaveSettingsModel: function()
	{
		var store = this.get(0).getRulesStore();
		this.mon(store, 'beforesave', this.onBeforeSaveRules, this, { single: true });
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.common.rules.data.RulesStore Rules Store}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSaveRules: function()
	{
		this.displaySavingMask();

		var store = this.get(0).getRulesStore();
		this.mon(store, 'save', this.onRulesSave, this);
		this.mon(store, 'exception', this.onRulesException, this);
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.common.rules.data.RulesStore Rules Store}
	 * fires the 'save' event indicating the successful save of the rules. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onRulesSave: function()
	{
		this.hideSavingMask(true);

		var store = this.get(0).getRulesStore();
		this.mun(store, 'save', this.onRulesSave, this);
		this.mun(store, 'exception', this.onRulesException, this);
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.common.rules.data.RulesStore Rules Store}
	 * fires the 'exception' event indicating a failing save of the rules. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onRulesException: function()
	{
		this.hideSavingMask(false);

		var store = this.get(0).getRulesStore();
		this.mun(store, 'save', this.onRulesSave, this);
		this.mun(store, 'exception', this.onRulesException, this);
	}
});

Ext.reg('grommunio.settingsrulecategory', Grommunio.common.settings.SettingsRuleCategory);
