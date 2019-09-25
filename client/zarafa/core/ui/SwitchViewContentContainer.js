Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.SwitchViewContentContainer
 * @extends Ext.Container
 * @xtype zarafa.switchviewcontentcontainer
 *
 * This class represents an {@link Ext.Panel panel} which contains multiple views which
 * can be enabled/disabled at any time by the user. Using lazy loading each view will only
 * be allocated when the user switches to the given view for the first time.
 */
Zarafa.core.ui.SwitchViewContentContainer = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Object[]} lazyItems List of {@link Ext.Containers containers} which
	 * act as view for this {@link Ext.Container container}. This array consists of configuration
	 * objects which will be allocated when the user switches to the given view for the
	 * first time.
	 * All items added to this list must always contain the 'id' property,
	 * used in switchView. Without this property it is not possible to switch
	 * to this view.
	 */
	lazyItems : undefined,

	/**
	 * @cfg {Boolean} autoClean If true this container will automatically remove
	 * and delete the previously selected {@link Ext.Container container} when switching
	 * to a new active {@link Ext.Container container}.
	 */
	autoClean : true,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// Always ensure that at least 1 item is non-lazy
		if (Ext.isEmpty(config.items) && !Ext.isEmpty(config.lazyItems)) {
			config.items = [ config.lazyItems[0] ];
		}
		// Ensure that the non-lazy item is marked as active
		if (Ext.isEmpty(config.activeItem)) {
			config.activeItem = config.items[0].id;
		}

		Ext.applyIf(config, {
			autoDestroy: true
		});

		this.addEvents(
			/**
			 * @event switchview
			 * Fires when the active view is being changed
			 * @param {Ext.Container} this The {@link Zarafa.core.ui.SwitchViewContentContainer switchcontainer}.
			 * @param {Ext.Container} newView The new {@link Ext.Container view} which is shown
			 * @param {Ext.Container} oldView The old {@link Ext.Container view} which was shown
			 */
			'switchview'			
		);

		Zarafa.core.ui.SwitchViewContentContainer.superclass.constructor.call(this, config);
	},

	/**
	 * Called by Extjs when the container is being {@link #doLayout layed out}. This will obtain
	 * the {@link Ext.layout.CardLayout#activeItem} and {@link Ext.Panel#doLayout update the layout}
	 * on that component as well.
	 * @private
	 */
	onLayout : function()
	{
		Zarafa.core.ui.SwitchViewContentContainer.superclass.onLayout.apply(this, arguments);

		// If the activeItem contains a layout, it should be layed out as well
		var item = this.getActiveItem();
		if (Ext.isFunction(item.doLayout)) {
			item.doLayout();
		}
	},

	/**
	 * This function will be used to switch between different views.
	 * It will attempt to find the view within this panel, if found,
	 * then the layout manager will be updated with the new view.
	 * @param {String} viewId id of the view that should be shown
	 */
	switchView : function(viewId)
	{
		var oldView = this.getActiveItem();
		var newView = this.findById(viewId);

		if (!Ext.isDefined(newView) || oldView == newView) {
			return;
		}

		// Check if the layout has been created yet, if not
		// then we store the activeItem inside the current
		// panel so it can be applied to the layout when it
		// is being created. 
		var layout = this.getLayout();
		if (!Ext.isFunction(layout.setActiveItem)) {
			this.activeItem = viewId;
		} else {
			layout.setActiveItem(viewId);
		}

		this.fireEvent('switchview', this, newView, oldView);

		// TODO: We should enable some timeout mechanism which
		// removes and deletes the oldView after a particular timeout.
		// This should increase performance when switching between 2
		// views often.
		if (this.autoClean === true && oldView && oldView != this.getActiveItem()) {
			this.remove(oldView);
			delete oldView;
		}
	},

	/**
	 * This function returns the currently active item
	 * @return {Ext.Component} The active item
	 */
	getActiveItem : function()
	{
		var layout = this.getLayout();
		if (!Ext.isFunction(layout.setActiveItem)) {
			return this.activeItem;
		} else {
			return layout.activeItem;
		}
	},

	/**
	 * Find a component under this container at any level by id.
	 * This extension will read all lazy items as well, if the required id, is
	 * one of the lazy items, then the item will be created and added to the panel.
	 * @param {String} id
	 * @return Ext.Component
	 */
	findById : function(id)
	{
		var retval = Zarafa.core.ui.SwitchViewContentContainer.superclass.findById.call(this, id);
		if (!retval) {
			retval = this.findBy(function(item) { return item.id === id; });
			if (!Ext.isEmpty(retval)) {
				retval = retval[0];
			}
		}

		return retval;
	},

	/**
	 * Find a component under this container at any level by a custom function.
	 * If the passed function returns true, the component will be included in the results.
	 * The passed function is called with the arguments (component, this container).
	 *
	 * This function will not only search through {@link #items} but also through {@link #lazyItems}.
	 *
	 * @param {Function} fn The function to call
	 * @param {Object} scope (optional)
	 * @return {Array} Array of Ext.Components
	 */
	findBy : function(fn, scope)
	{
		var retval = Zarafa.core.ui.SwitchViewContentContainer.superclass.findBy.apply(this, arguments);

		if (Ext.isDefined(this.lazyItems)) {
			for (var i = 0; i < this.lazyItems.length; i++) {
				var item = this.lazyItems[i];

				if (fn.call(scope || item, item, this) === true) {
					/*
					 * Make an exact clone of the lazyItems entry. When we pass the config
					 * object to the Component constructor, we must consider the fact that
					 * this would be a reference. What we pass here, might be modified by
					 * the constructor. However we do not want those changes to be saved
					 * back into our lazyItems object, since that might cause problems
					 * when we instantiate the lazyItem for the second time.
					 */
					item = Ext.create(Ext.apply({}, item));
					this.add(item);
					retval.push(item);
				}
			}
		}

		return retval;
	}
});

Ext.reg('zarafa.switchviewcontentcontainer', Zarafa.core.ui.SwitchViewContentContainer);
