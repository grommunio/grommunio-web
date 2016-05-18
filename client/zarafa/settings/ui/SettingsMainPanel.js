Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsMainPanel
 * @extends Zarafa.common.ui.ContextMainPanel
 * @xtype zarafa.settingsmainpanel
 */
Zarafa.settings.ui.SettingsMainPanel = Ext.extend(Zarafa.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.settings.categories
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsGeneralCategory categories}
	 * for the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel}.
	 * @param {Zarafa.settings.ui.SettingsMainPanel} panel The Settings Main Panel
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		Ext.apply(config, {iconCls : 'zarafa-settings-category-general'});
		
		// Load all category categories which we will
		// display in the content panel.
		var items = container.populateInsertionPoint('context.settings.categories', this, config.context);

		// Create all content, extract the titles to generate
		// the list of tabs for the category panel. Also detect which
		// widgets placed inside the categories are marked as favorite
		// so we can generate a favorites panel.
		var tabs = [];
		var favorites = [];
		for (var i = 0, len = items.length; i < len; i++) {
			// Create the item to ensure we will have
			// all desired information in our object.
			var category = Ext.create(items[i]);

			// Create the category tab which we use to
			// switch to this particular category.
			tabs.push({
				xtype : 'zarafa.settingscategorytab',
				title : category.title,
				categoryIndex : category.categoryIndex,
				iconCls : category.iconCls,
				hidden : category.hidden,
				context : config.context,
				category : category
			});

			// If the category is not hidden, we can search for
			// widgets which are marked as favorites.
			if (category.hidden !== true) {
				for (var j = 0, lenJ = category.items.length; j < lenJ; j++) {
					var widget = category.items.get(j);

					// If the widget is marked as favorite,
					// create a favorite tab which can be put
					// on the favorites panel.
					if (widget.favorite === true) {
						favorites.push({
							xtype : 'zarafa.settingsfavoritetab',
							title : widget.title,
							favoriteIndex : category.categoryIndex * (j + 1),
							iconCls : widget.iconCls,
							context : config.context,
							category : category,
							widget : widget
						});
					}
				}
			}

			// Make sure our created item is saved
			// back into our main array.
			items[i] = category;
		}

		tabs = Zarafa.core.Util.sortArray(tabs, 'ASC', 'categoryIndex');
		favorites = Zarafa.core.Util.sortArray(favorites, 'ASC', 'favoriteIndex');
		items = Zarafa.core.Util.sortArray(items, 'ASC', 'categoryIndex');

		Ext.applyIf(config, {
			cls : 'zarafa-setting-mainpanel',
			header : false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				xtype : 'zarafa.settingscategorypanel',
				width : 200,
				context : config.context,
				items : tabs
			},{
				xtype : 'container',
				flex  : 1,
				layout : {
					type : 'vbox',
					align : 'stretch'
				},
				items : [{
					// Render the main contents component, we have
					// a widget content panel containing the widgets
					// for the categories, and the panel for the
					// favorites.
					xtype : 'container',
					flex : 1,
					layout : {
						type : 'hbox',
						align : 'stretch'
					},
					items : [{
						xtype : 'zarafa.settingscategorywidgetpanel',
						flex : 0.8,
						context : config.context,
						items : items
					},{
						// Favorite panel is disabled temporary.
						xtype : 'zarafa.settingsfavoritepanel',
						flex : 0.2,
						hidden : true,
						context : config.context,
						items : favorites
					}]
				},{
					// Render the toolbar component, the sizes of the
					// 2 components inside this toolbar match the sizes
					// of the 2 components in the other main content.
					xtype : 'container',
					height : 50,
					layout : {
						type : 'hbox',
						align : 'stretch'
					},
					items : [{
						// This section of the toolbar actually
						// has contents. By changing the cls,
						// and toolbarCls configuration objects
						// we emulate that this contains looks
						// similar to a Ext.Panel#buttons toolbar
						xtype : 'container',
						cls : 'x-panel-btns',
						flex : 0.8,
						layout : 'fit',
						items : [{
							xtype : 'toolbar',
							enableOverflow : false,
							toolbarCls : 'x-panel-footer',
							cls : 'x-panel-fbar',
							flex : 0.8,
							buttonAlign : 'right',
							defaults : {
								// Bit hackish, but just obtain the default
								// button width
								minWidth : Ext.Panel.prototype.minButtonWidth
							},
							items : [{
								xtype : 'button',
								cls : 'zarafa-action',
								text : _('Apply'),
								handler : this.onApply,
								scope : this
							},{
								xtype : 'button',
								// # TRANSLATORS: Used for the button in the settings context to revert to whatever the user had set before he started editing the settings.
								text : _('Discard'),
								handler : this.onDiscard,
								scope : this
							}]
						}]
					},{
						// hide to render Apply & Discard button properly as favorite panel is disabled temporary.
						xtype : 'container',
						hidden : true,
						flex : 0.2
					}]
				}]
			}]
		});

		Zarafa.settings.ui.SettingsMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * {@link Zarafa.settings.SettingsContextModel#applyChanges Save all changes} to the server.
	 * @private
	 */
	onApply : function()
	{
		// Only save the settings when there are actual modifications to be saved.
		if (this.context) {
			this.context.getModel().applyChanges();
		}
	},

	/**
	 * {@link Zarafa.settings.SettingsContextModel#discardChanges Discard all unsaved changes}.
	 * @private
	 */
	onDiscard : function()
	{
		if (this.context) {
			this.context.getModel().discardChanges();
		}
	}
});

Ext.reg('zarafa.settingsmainpanel', Zarafa.settings.ui.SettingsMainPanel);
