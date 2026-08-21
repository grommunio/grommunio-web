Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DraggableDataView
 * @extends Ext.DataView
 * @xtype zarafa.draggabledataview
 */
Zarafa.common.ui.DraggableDataView = Ext.extend(Ext.DataView, {
	/**
	 * @cfg {String} ddGroup The DD group this DataView belongs to. Defaults to 'DataDD' if not specified.
	 */
	ddGroup: undefined,

	/**
	 * @cfg {Boolean} enableDragDrop Enables dragging of the selected utems of the DataView. Defaults to false.
	 */
	enableDragDrop: false,

	/**
	 * @cfg {Boolean} enableDrop true to enable just drag
	 */
	enableDrop: false,

	/**
	 * The dropZone used by this tree if drop is enabled (see {@link #enableDrop})
	 * @property
	 * @type Ext.dd.DropZone
	 */
	dropZone: undefined,

	/**
	 * @cfg {Object} dropConfig Custom config to pass to the {@link Ext.dd.DropZone} instance
	 */
	dropConfig: undefined,

	/**
	 * @cfg {Boolean} enableDrop true to enable just drag
	 */
	enableDrag: false,

	/**
	 * The dragZone used by this tree if drag is enabled (see {@link #enableDrag})
	 * @property
	 * @type Ext.dd.DragZone
	 */
	dragZone: undefined,

	/**
	 * @cfg {Object} dragConfig Custom config to pass to the {@link Ext.dd.DragZone} instance
	 */
	dragConfig: undefined,

	/**
	 * We are creating this element as div element, to render template within this element.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	templateEl: undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push({
			ptype: 'zarafa.enablefocusplugin'
		});

		Zarafa.common.ui.DraggableDataView.superclass.constructor.call(this, config);
	},

	/**
	 * Called during rendering of the DataView. When {@link #enableDD Drag & Drop} has
	 * been enabled. This will initialize the {@link #dropZone} and {@link #dragZone}
	 * to enable drag & drop for this view.
	 * @private
	 */
	onRender: function()
	{
		Zarafa.common.ui.DraggableDataView.superclass.onRender.apply(this, arguments);

		/*
		 * We are using 'zarafa.enablefocusplugin' plugin with this view, the plugin adds
		 * anchor element within component's {@link #el element}, Dataview also renders its
		 * template inside {@link #el element}. So whenever data is changed, dataview
		 * recreates the {@link #el element} so anchor tag added by the plugin will be removed,
		 * so here we are creating new templateEl inside {@link #el element} as a child in which
		 * data view will render its template.
		 */
		var element = this.getEl();
		this.templateEl = element.createChild({ tag: this.autoEl });

		if ((this.enableDragDrop || this.enableDrop) && !this.dropZone) {
			this.dropZone = new Ext.dd.DropZone(this.getEl(), this.dropConfig || {
				ddGroup: this.ddGroup || 'DataDD'
			});
		}

		// Initialize a special DragZone which has support for dragging MAPIRecord objects
		// from a DataView into the hierarchy.
		if ((this.enableDragDrop || this.enableDrag) && !this.dragZone) {
			this.dragZone = new Zarafa.common.ui.DataDragZone(this, this.dragConfig || {
				ddGroup: this.ddGroup || 'DataDD'
			});
		}
	},

	/**
	 * Called when the data-view has been rendered.
	 * This activate the keymap on the element of this component after the normal operations of
	 * afterRender have been completed.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.common.ui.DraggableDataView.superclass.afterRender.apply(this, arguments);
		// This will activate keymaps for mapID 'view.mapimessage'
		Zarafa.core.KeyMapMgr.activate(this, 'view.mapimessage');

		// Keyboard requests never reach the template element the view listens on.
		this.mon(this.getEl(), 'contextmenu', this.onKeyboardContextMenu, this);
	},

	/**
	 * Event handler which is triggered when the user opens the context menu on a node.
	 *
	 * @param {Zarafa.common.ui.DraggableDataView} dataView This view
	 * @param {Number} index The index of the node
	 * @param {HTMLElement} node The node on which the context menu was requested
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onNodeContextMenu: function(dataView, index, node, event)
	{
		this.openContextMenuForNode(index, node, event);
	},

	/**
	 * Open the context menu for the given node.
	 *
	 * @param {Number} index The index of the node
	 * @param {HTMLElement} node The node to open the context menu for
	 * @param {Ext.EventObject} event The event which requested the context menu
	 * @return {Ext.menu.Menu} The context menu which was opened
	 * @protected
	 */
	openContextMenuForNode: function(index, node, event)
	{
		if (!this.isSelected(node)) {
			this.select(node);
		}

		return Zarafa.core.data.UIFactory.openDefaultContextMenu(this.getSelectedRecords(), { position: event.getXY() });
	},

	/**
	 * Event handler for the 'contextmenu' event on the {@link #el element}. The context
	 * menu key (and Shift + F10) fire the event on the off-screen focus element of the
	 * {@link Zarafa.core.plugins.EnableFocusPlugin plugin} instead of on a node. Such a
	 * request is handled on the node which was selected last.
	 *
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onKeyboardContextMenu: function(event)
	{
		if (!Zarafa.core.data.UIFactory.isKeyboardContextMenu(event)) {
			return;
		}

		// 'last' is false when the view has no selection.
		var index = this.last;
		var node = Ext.isNumber(index) ? this.getNode(index) : null;
		if (!node) {
			return;
		}

		event.stopEvent();

		// The keyboard provides no position and the focus element is off-screen.
		var menuEvent = new Ext.EventObjectImpl(event);
		var xy = Ext.fly(node).getXY();
		menuEvent.xy = [xy[0] + 8, xy[1] + 16];

		var menu = this.openContextMenuForNode(index, node, menuEvent);
		var plugin = this.enableFocusPlugin;
		Zarafa.core.data.UIFactory.initKeyboardMenuNavigation(menu, plugin ? plugin.focusEl : undefined);
	},

	/**
	 * Override the method {@link Ext.DataView#getTemplateTarget} to change target element
	 * for template to render, we have create new templateEl otherwise when template is
	 * rendered it will remove our focus {@link #focusEl element}.
	 * @private
	 */
	getTemplateTarget: function()
	{
		if(this.templateEl) {
			return this.templateEl;
		} else {
			return Zarafa.common.ui.DraggableDataView.superclass.getTemplateTarget.apply(this);
		}
	},

	/**
	 * Called to get grid's drag proxy text.
	 * This will use 'ngettext' to return a properly formatted plural sentence.
	 * @return {String} The text
	 */
	getDragDropText: function()
	{
		var count = this.getSelectionCount();
		return String.format(ngettext('{0} selected item', '{0} selected items', count), count);
	},

	/**
	 * Event handler which triggered when mouse enter/over the {@link Ext.DataView}.
	 * It will also shows the notification/slider at bottom-center of {@link Ext.DataView}.
	 * which contains the {@link Zarafa.common.ui.PagingToolbar PagingToolbar}.
	 * @param {Ext.EventObjectImpl} EventObjImpl Event object
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} eventObj The raw event object
	 * @param {Ext.Element} parentCt The element on which paging slider should show.
	 */
	onMouseEnter: function(EventObjImpl, node, eventObj ,parentCt)
	{
		container.getNotifier().notify('pagination.paging', undefined, undefined,{
			parentEl: !Ext.isEmpty(parentCt) ? parentCt : this.getEl(),
			model: this.model,
			store: this.store
		});
	},

	/**
	 * Event handler which triggered when mouse leaves the {@link Ext.DataView}
	 * It will destroy the slider from bottom-center of {@link Ext.DataView}.
	 */
	onMouseLeave: function()
	{
		container.getNotifier().notify('pagination.paging', undefined, undefined,{
			destroy: true
		});
	}
});

Ext.reg('zarafa.draggabledataview', Zarafa.common.ui.DraggableDataView);
