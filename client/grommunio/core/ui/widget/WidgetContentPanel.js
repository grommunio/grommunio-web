/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.ui.widget');

/**
 * @class Grommunio.core.ui.widget.WidgetContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 *
 * ContentPanel used by the user to select which {@link Grommunio.core.ui.widget.Widget widget}
 * must be added to the {@link #widgetPanel panel}.
 */
Grommunio.core.ui.widget.WidgetContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.ui.widget.WidgetPanel} widgetPanel The widget panel to which
	 * the selected widget will be added.
	 */
	widgetPanel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var template = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="k-widget-item {iconCls}" id="{name}">',
					'<div class="thumb-wrap">',
						'<img src="{icon}" alt="">',
					'</div>',
					'<span>{display_name}</span>',
				'</div>',
			'</tpl>',
			'<div class="x-clear"></div>'
		);

		var data = [];
		var widgets = container.getWidgetsMetaData();
		Ext.each(widgets, function(widget) {
			data.push({ name: widget.getName(), display_name: widget.getDisplayName(), icon: widget.getIconPath(), iconCls: widget.getIconCls() });
		}, this);

		var store = {
			xtype: 'jsonstore',
			fields: [ 'name', 'display_name', 'icon', 'iconCls' ],
			data: data,
			sortInfo: {
				field: 'display_name',
				direction: 'ASC'
			}
		};

		Ext.applyIf(config, {
			layout: 'fit',
			border: false,
			width: 550,
			height: 280,
			modal: true,
			title: _('Add widgets'),
			items: [{
				xtype: 'dataview',
				store: store,
				tpl: template,
				autoScroll: true,
				singleSelect: true,
				multiSelect: false,
				selectedClass: 'k-widgets-selectedwidget',
				overClass: 'k-widgets-hoverwidget',
				itemSelector: 'div.k-widget-item',
				deferEmptyText: false,
				emptyText: _('No widgets installed.'),
				listeners: {
					'dblclick': this.onWidgetDblClick,
					scope: this
				}
			}]
		});

		Grommunio.core.ui.widget.WidgetContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the user double clicks on a widget
	 * @param {Ext.DataView} dataview The view which fired the event
	 * @param {Number} index The selected index
	 * @param {HTMLElement} node The node which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onWidgetDblClick: function(dataview, index, node, event)
	{
		if (this.widgetPanel) {
			this.widgetPanel.createWidget(dataview.getRecord(node).get('name'));
		}
	}
});

Ext.reg('grommunio.widgetcontentpanel', Grommunio.core.ui.widget.WidgetContentPanel);
