/*
 * #dependsFile client/zarafa/core/ui/Toolbar.js
 */
Ext.namespace("Zarafa.core.ui");

/**
 * @class Zarafa.core.ui.ContentPanelToolbar
 * @extends Zarafa.core.ui.Toolbar
 * @xtype zarafa.contentpaneltoolbar
 */
Zarafa.core.ui.ContentPanelToolbar = Ext.extend(Zarafa.core.ui.Toolbar, {
	/**
	 * @cfg {String} insertionPointBase The base string for Insertion points in
	 * this panel. (i.e. context.mail.showmailcontentpanel). This base name is
	 * used for accessing the insertion points which are defined for the content panel
	 * toolbar. Used insertion points are:
	 *	[insertionPointBase].toolbar.actions
	 *	[insertionPointBase].toolbar.options
	 */
	insertionPointBase: undefined,
	/**
	 * @cfg {Array} actionItems The array of {@link Ext.Component} elements which should be added to the actions {@link Ext.Button buttons} of the
	 * {@link Zarafa.core.ui.Toolbar}. These elements can be extended by the main.dialog.[dialog].toolbar.actions insertion point.
	 */
	actionItems: [],
	/**
	 * @cfg {Array} actionItems The array of {@link Ext.Component} elements which should be added to the options {@link Ext.Button buttons} of the
	 * {@link Zarafa.core.ui.Toolbar}. These elements can be extended by the main.dialog.[dialog].toolbar.options insertion point.
	 */
	optionItems: [],
	/**
	 * @cfg {Array} rightAlignedItems The array of {@link Ext.Component} elements which should be added to the options {@link Ext.Button buttons} of the
	 * {@link Zarafa.core.ui.Toolbar}. These elements can be extended by the main.dialog.[dialog].toolbar.options.right insertion point.
	 */
	rightAlignedItems : [],
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		Ext.apply(this, config, {
			// Override from Ext.Component
			xtype: 'zarafa.contentpaneltoolbar',
			cls : 'zarafa-dialogtoolbar'
		});

		// Declare events.
		this.addEvents(
			/**
			 * @event window_before_pop
			 * Fires before a window is popped in or out of the browser window.
			 * @param {Ext.data.Record} record The record which is currently used in the window
			 */
			'window_before_pop'
		);

		Zarafa.core.ui.ContentPanelToolbar.superclass.constructor.call(this, config);

		this.initButtonGroups();
	},

	/**
	 * Add default button groups to toolbar.
	 * @private
	 */
	initButtonGroups : function()
	{
		var namespace = this.insertionPointBase + '.toolbar';

		// Initialize the items list with all buttons which were registered through insertion points.
		this.addItems(this.actionItems, namespace + '.actions');
		this.addItems(this.optionItems, namespace + '.options');

		// It will render all rightAlignedItems to the Right side in toolbar
		if(!Ext.isEmpty(this.rightAlignedItems)) {
			this.rightAlignedItems = ["->"].concat(this.rightAlignedItems);
			this.addItems(this.rightAlignedItems, namespace + '.options.right');
		}
	}
});

Ext.reg('zarafa.contentpaneltoolbar', Zarafa.core.ui.ContentPanelToolbar);
