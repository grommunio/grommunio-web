Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.FreebusyTimelineHeaderContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.freebusytimelineheadercontextmenu
 */
Zarafa.common.freebusy.ui.FreebusyTimelineHeaderContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.freebusy.timelineheader.contextmenu
	 * Insertion point for adding items to the contextmenu that is triggered when right-clicking on the header of the timeline.
	 * @param {Zarafa.common.freebusy.ui.FreebusyTimelineHeaderContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyModel} model The model which holds all freebusy information.
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items : [{
				xtype: 'zarafa.conditionalitem',
				text: _('Show non-working hours'),
				showNonWorkingHours : true,
				hidden : config.model ? config.model.showOnlyWorkingHours() === false : false,
				handler: this.onHeaderContextMenuToggleNonWorkingHours,
				scope: this
			},{
				xtype: 'zarafa.conditionalitem',
				text: _('Hide non-working hours'),
				showNonWorkingHours : false,
				hidden : config.model ? config.model.showOnlyWorkingHours() === true : false,
				handler: this.onHeaderContextMenuToggleNonWorkingHours,
				scope: this
			},
			container.populateInsertionPoint('context.freebusy.timelineheader.contextmenu', this)
			]
		});

		Zarafa.common.freebusy.ui.FreebusyTimelineHeaderContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Called when the context menuitem "show/hide non-working hours" in the timeline is used.
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item which was clicked
	 * @private
	 */
	onHeaderContextMenuToggleNonWorkingHours: function(item)
	{
		this.model.hideNonWorkingHours(!item.showNonWorkingHours);
	}
});

Ext.reg('zarafa.freebusytimelineheadercontextmenu', Zarafa.common.freebusy.ui.FreebusyTimelineHeaderContextMenu);
