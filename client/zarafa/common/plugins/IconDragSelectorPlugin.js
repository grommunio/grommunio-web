Ext.namespace('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.IconDragSelectorPlugin
 * @extends Object
 * @ptype zarafa.icondragselectorplugin
 *
 * Copied from Ext.ux.IconDragSelector, as that class is non-extentible
 * and contains some issues regarding drag & drop of items in combination
 * with a dragselection.
 *
 * This class will draw a Drag Selection block when dragging the mouse
 * over a {@link Ext.DataView}.
 */
Zarafa.common.plugins.IconDragSelectorPlugin = Ext.extend(Object, {
	/**
	 * The component which has been {@link #init initialized} on
	 * this plugin.
	 * @property
	 * @type Ext.DataView
	 */
	view : undefined,

	/**
	 * Array of {@link Ext.lib.Region} objects which belong to each {@link Ext.DataView#all}.
	 * of the {@link #view}.
	 * @property
	 * @type Array
	 */
	itemRegions : undefined,

	/**
	 * The {@link Ext.lib.Region} of the {@link #view}.
	 * @property
	 * @type Ext.lib.Region
	 */
	bodyRegion : undefined,

	/**
	 * The proxy element which marks the selected area
	 * @property
	 * @type Ext.Element
	 */
	proxy : undefined,

	/**
	 * The Drag Tracker
	 * @property
	 * @type Ext.dd.DragTracker
	 */
	tracker : undefined,

	/**
	 * The Region which is currently contains the
	 * dragselecion.
	 * @property
	 * @type Ext.lib.Region
	 */
	dragRegion : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);

		Zarafa.common.plugins.IconDragSelectorPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Ext.DataView view} to which this plugin has been hooked.
	 * @param {Ext.DataView} view The component on which the plugin is installed
	 */
	init : function(view)
	{
		this.view = view;

		this.view.on('render', this.onRender, this);
	},

	/**
	 * Initialize the {@link #itemRegions} and {@link #bodyRegion}. By calling
	 * {@link Ext.Element#getRegion} for all involved elements.
	 * @private
	 */
	fillRegions : function()
	{
		this.itemRegions = [];

		this.view.all.each(function(el) {
			this.itemRegions.push(el.getRegion());
		}, this);

		this.bodyRegion = this.view.el.getRegion();
	},

	/**
	 * Event handler which is called when the user {@link Ext.DataView#containerclick clicks}
	 * on the {@link #view}
	 * @return {Boolean} false To cancel the event
	 * @private
	 */
	cancelClick : function()
	{
		return false;
	},

	/**
	 * Event handler for the {@link Ext.dd.DragTracker#onBeforeStart DragTracker}.
	 * @param {Ext.EventObject} e The event object
	 * @return {Boolean} False when the event must be ignored
	 * @private
	 */
	onBeforeStart : function(e)
	{
		return this.view.getEl().contains(e.target) && !Ext.dd.DragDropMgr.dragCurrent; // FIXME
	},

	/**
	 * Event handler for the {@link Ext.dd.DragTracker#onStart DragTracker}.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
  	onStart : function(e)
	{
		this.view.on('containerclick', this.cancelClick, this, { single : true });
		if (!this.proxy) {
			this.proxy = this.view.el.createChild({
				cls:'x-view-selector'
			});
		} else {
			if (this.proxy.dom.parentNode !== this.view.el.dom) {
				this.view.el.dom.appendChild(this.proxy.dom);
			}
			this.proxy.setDisplayed('block');
		}

		this.fillRegions();
		this.view.clearSelections();
	},

	/**
	 * Event handler for the {@link Ext.dd.DragTracker#onDrag DragTracker}.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onDrag : function(e)
	{
		var startXY = this.tracker.startXY;
		var xy = this.tracker.getXY();

		var x = Math.min(startXY[0], xy[0]);
		var y = Math.min(startXY[1], xy[1]);
		var w = Math.abs(startXY[0] - xy[0]);
		var h = Math.abs(startXY[1] - xy[1]);

		this.dragRegion.left = x;
		this.dragRegion.top = y;
		this.dragRegion.right = x+w;
		this.dragRegion.bottom = y+h;

		this.dragRegion.constrainTo(this.bodyRegion);
		this.proxy.setRegion(this.dragRegion);

		for (var i = 0, len = this.itemRegions.length; i < len; i++) {
			var r = this.itemRegions[i];
			var sel = this.dragRegion.intersect(r);
			if (sel && !r.selected) {
				r.selected = true;
				this.view.select(i, true);
			} else if(!sel && r.selected) {
				r.selected = false;
				this.view.deselect(i);
			}
		}
	},

	/**
	 * Event handler for the {@link Ext.dd.DragTracker#onEnd DragTracker}.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onEnd : function(e)
	{
		if (!Ext.isIE) {
			this.view.un('containerclick', this.cancelClick, this, { single : true });
		}
		if (this.proxy) {
			this.proxy.setDisplayed(false);
		}
	},

	/**
	 * Event handler which is called when the {@link #view} has been rendered.
	 * @param {Ext.DataView} view The view which has been rendered
	 * @private
	 */
	onRender : function(view)
	{
		this.dragRegion = new Ext.lib.Region(0, 0, 0, 0);

		this.tracker = new Ext.dd.DragTracker({
			onBeforeStart: this.onBeforeStart.createDelegate(this),
			onStart: this.onStart.createDelegate(this),
			onDrag: this.onDrag.createDelegate(this),
			onEnd: this.onEnd.createDelegate(this)
		});

		this.tracker.initEl(this.view.getEl());
	}
});

Ext.preg('zarafa.icondragselectorplugin', Zarafa.common.plugins.IconDragSelectorPlugin);
