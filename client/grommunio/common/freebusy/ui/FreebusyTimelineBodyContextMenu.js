Ext.namespace('Grommunio.common.freebusy.ui');

/**
 * @class Grommunio.common.freebusy.ui.FreebusyTimelineBodyContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.freebusytimelinebodycontextmenu
 */
Grommunio.common.freebusy.ui.FreebusyTimelineBodyContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.freebusy.timelinebody.contextmenu
	 * Insertion point for adding items to the contextmenu that is triggered when right-clicking on the body of the timeline.
	 * @param {Grommunio.common.freebusy.ui.FreebusyTimelineBodyContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Grommunio.common.freebusy.data.FreebusyModel} model The model which holds all freebusy information.
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: container.populateInsertionPoint('context.freebusy.timelinebody.contextmenu', this)
		});

		Grommunio.common.freebusy.ui.FreebusyTimelineBodyContextMenu.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.freebusytimelinebodycontextmenu', Grommunio.common.freebusy.ui.FreebusyTimelineBodyContextMenu);
