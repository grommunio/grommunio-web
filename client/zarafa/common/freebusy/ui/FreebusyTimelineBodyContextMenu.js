Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.FreebusyTimelineBodyContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.freebusytimelinebodycontextmenu
 */
Zarafa.common.freebusy.ui.FreebusyTimelineBodyContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.freebusy.timelinebody.contextmenu
	 * Insertion point for adding items to the contextmenu that is triggered when right-clicking on the body of the timeline.
	 * @param {Zarafa.common.freebusy.ui.FreebusyTimelineBodyContextMenu} contextmenu This contextmenu
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
			items : container.populateInsertionPoint('context.freebusy.timelinebody.contextmenu', this)
		});

		Zarafa.common.freebusy.ui.FreebusyTimelineBodyContextMenu.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.freebusytimelinebodycontextmenu', Zarafa.common.freebusy.ui.FreebusyTimelineBodyContextMenu);
