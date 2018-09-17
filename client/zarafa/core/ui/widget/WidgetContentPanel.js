Ext.namespace('Zarafa.core.ui.widget');

/**
 * @class Zarafa.core.ui.widget.WidgetContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 *
 * ContentPanel used by the user to select which {@link Zarafa.core.ui.widget.Widget widget}
 * must be added to the {@link #widgetPanel panel}.
 */
Zarafa.core.ui.widget.WidgetContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.ui.widget.WidgetPanel} widgetPanel The widget panel to which
	 * the selected widget will be added.
	 */
	widgetPanel : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var template = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="zarafa-widget-item" id="{name}">',
					'<div class="thumb-wrap">',
						'<img src="{icon}">',
					'</div>',
					'<span>{display_name}</span>',
				'</div>',
			'</tpl>',
			'<div class="x-clear"></div>'
		);

		var data = [];
		var widgets = container.getWidgetsMetaData();
		Ext.each(widgets, function(widget) {
			data.push({ name : widget.getName(), display_name : widget.getDisplayName(), icon : widget.getIconPath() });
		}, this);
		
		var store = {
			xtype : 'jsonstore',
			fields : [ 'name', 'display_name', 'icon' ],
			data : data,
			sortInfo : {
				field : 'display_name',
				direction : 'ASC'
			}
		};

		Ext.applyIf(config, {
			layout : 'fit',
			border : false,
			width : 550,
			height : 280,
			modal: true,
			title : _('Add widgets'),
			items : [{
				xtype : 'dataview',
				store: store,
				tpl: template,
				autoScroll : true,
				singleSelect : true,
				multiSelect : false,
				selectedClass : 'zarafa-widgets-selectedwidget',
				overClass : 'zarafa-widgets-hoverwidget',
				itemSelector : 'div.zarafa-widget-item',
				deferEmptyText: false,
				emptyText : _('No widgets installed.'),
				listeners : {
					'dblclick' : this.onWidgetDblClick,
					scope : this
				}
			}]
		});

		Zarafa.core.ui.widget.WidgetContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the user double clicks on a widget
	 * @param {Ext.DataView} dataview The view which fired the event
	 * @param {Number} index The selected index
	 * @param {HTMLElement} node The node which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onWidgetDblClick : function(dataview, index, node, event)
	{
		if (this.widgetPanel) {
			this.widgetPanel.createWidget(dataview.getRecord(node).get('name'));
		}
	}
});

Ext.reg('zarafa.widgetcontentpanel', Zarafa.core.ui.widget.WidgetContentPanel);
