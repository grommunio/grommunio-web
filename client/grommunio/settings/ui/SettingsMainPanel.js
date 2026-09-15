/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsMainPanel
 * @extends Grommunio.common.ui.ContextMainPanel
 * @xtype grommunio.settingsmainpanel
 */
Grommunio.settings.ui.SettingsMainPanel = Ext.extend(Grommunio.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.settings.categories
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsGeneralCategory categories}
	 * for the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel}.
	 * @param {Grommunio.settings.ui.SettingsMainPanel} panel The Settings Main Panel
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.apply(config, {iconCls: 'icon_cogwheel'});

		// Load all category categories which we will
		// display in the content panel.
		var items = container.populateInsertionPoint('context.settings.categories', this, config.context);

		// Create all content, extract the titles to generate
		// the list of tabs for the category panel.
		var tabs = [];
		for (var i = 0, len = items.length; i < len; i++) {
			// Create the item to ensure we will have
			// all desired information in our object.
			var category = Ext.create(items[i]);

			// Create the category tab which we use to
			// switch to this particular category.
			tabs.push({
				xtype: 'grommunio.settingscategorytab',
				title: category.title,
				categoryIndex: category.categoryIndex,
				iconCls: category.iconCls,
				hidden: category.hidden,
				context: config.context,
				category: category
			});

			// Make sure our created item is saved
			// back into our main array.
			items[i] = category;
		}

		tabs = Grommunio.core.Util.sortArray(tabs, 'ASC', 'categoryIndex');
		items = Grommunio.core.Util.sortArray(items, 'ASC', 'categoryIndex');

		Ext.applyIf(config, {
			cls: 'grommunio-setting-mainpanel',
			header: false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'container',
				cls: 'k-settings-sidebar',
				width: 250,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'grommunio.settingssearchfield',
					context: config.context,
					margins: '10 6 4 6'
				},{
					xtype: 'grommunio.settingscategorypanel',
					flex: 1,
					context: config.context,
					autoScroll: true,
					items: tabs
				}]
			},{
				xtype: 'container',
				flex : 1,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					// Render the main contents component, we have
					// a widget content panel containing the widgets
					// for the categories.
					xtype: 'container',
					flex: 1,
					layout: {
						type: 'fit',
						align: 'stretch'
					},
					items: [{
						xtype: 'grommunio.settingscategorywidgetpanel',
						context: config.context,
						items: items
					}]
				},{
					// Render the toolbar component, the sizes of the
					// 2 components inside this toolbar match the sizes
					// of the 2 components in the other main content.
					xtype: 'container',
					height: 50,
					layout: {
						type: 'fit',
						align: 'stretch'
					},
					items: [{
						// This section of the toolbar actually
						// has contents. By changing the cls,
						// and toolbarCls configuration objects
						// we emulate that this contains looks
						// similar to a Ext.Panel#buttons toolbar
						xtype: 'container',
						cls: 'x-panel-btns',
						layout: 'fit',
						items: [{
							xtype: 'toolbar',
							toolbarCls: 'x-panel-footer',
							buttonAlign: 'right',
							items: [{
								xtype: 'button',
								cls: 'grommunio-action',
								text: _('Apply'),
								handler: this.onApply,
								scope: this
							},{
								xtype: 'button',
								text: _('Discard'),
								handler: this.onDiscard,
								scope: this
							}]
						}]
					}]
				}]
			}]
		});

		Grommunio.settings.ui.SettingsMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * {@link Grommunio.settings.SettingsContextModel#applyChanges Save all changes} to the server.
	 * @private
	 */
	onApply: function()
	{
		// Only save the settings when there are actual modifications to be saved.
		if (this.context) {
			this.context.getModel().applyChanges();
		}
	},

	/**
	 * {@link Grommunio.settings.SettingsContextModel#discardChanges Discard all unsaved changes}.
	 * @private
	 */
	onDiscard: function()
	{
		if (this.context) {
			this.context.getModel().discardChanges();
		}
	}
});

Ext.reg('grommunio.settingsmainpanel', Grommunio.settings.ui.SettingsMainPanel);
