/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui.messagepanel');

/**
 * @class Grommunio.common.ui.messagepanel.CategoryLinks
 * @extends Ext.Container
 * @xtype grommunio.categorylinks
 *
 * Renders the categories as colored labels in the
 * {@link Grommunio.common.ui.messagepanel.MessageHeader}.
 */
Grommunio.common.ui.messagepanel.CategoryLinks = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecord} record Holds the current record
	 */
	record: undefined,

	/**
	 * Holds the tooltip that will be used to show the full category name
	 * of truncated categories
	 * @property
	 * @type {Grommunio.common.categories.ui.Tooltip}
	 */
	tooltip: null,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config,{
			xtype: 'grommunio.categorylinks',
			border: false,
			anchor: '100%',
			cls: 'k-preview-header-categories',
			listeners: {
				render: this.onRenderCategoryLinks,
				scope: this
			}
		});

		Grommunio.common.ui.messagepanel.CategoryLinks.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the render event of the category links. Creates
	 * the {@link Grommunio.common.categories.ui.Tooltip tooltip object} that will
	 * be used to display truncated categories. And adds a listener for
	 * the contextmenu event.
	 */
	onRenderCategoryLinks: function()
	{
		// Create a tooltip for truncated categories
		this.tooltip = new Grommunio.common.categories.ui.Tooltip({
			target: this.el
		});

		// Create the contextmenu for the category labels
		this.mon(this.el, 'contextmenu', this.onContextMenu, this);
	},

	/**
	 * Event handler for the contextmenu event of the category labels. Will
	 * show the context menu if the click was on a label.
	 * @param {Ext.EventObject} event The event object
	 * @param {HtmlElement} targetElement The element on which the click happened
	 */
	onContextMenu: function(event, targetElement)
	{
		targetElement = Ext.get(targetElement);
		if ( targetElement.hasClass('k-category-block') ){
			Grommunio.core.data.UIFactory.openContextMenu(Grommunio.core.data.SharedComponentType['common.contextmenu.category'], [this.record], {
				category: targetElement.dom.textContent,
				position: event.getXY()
			});
		}
	},

	/**
	 * Update the {@link Grommunio.common.ui.messagepanel.CategoryLinks header} with the data
	 * from the {@link Grommunio.core.data.IPMRecord record}. Updates the panel
	 * by loading data from the record data into the template.
	 * Attach mouse handlers on the anchors
	 * @param {Grommunio.core.data.IPMRecord} record to update the header panel with
	 */
	update: function(record)
	{
		this.record = record;

		if ( this.el && this.el.dom ){
			if (!record) {
				this.el.dom.innerHTML = '';
				return;
			}
			// Render the categories, resolving colours against the record's own
			// mailbox category list.
			var categories = Grommunio.common.categories.Util.getCategories(record);
			var html = Grommunio.common.categories.Util.getCategoriesHtml(categories, record.get('store_entryid'));
			this.el.dom.innerHTML = html;
		}
	}
});

Ext.reg('grommunio.categorylinks', Grommunio.common.ui.messagepanel.CategoryLinks);
