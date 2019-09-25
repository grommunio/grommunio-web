Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.PagingSliderPlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which works by sliding
 * the {@link Zarafa.common.ui.PagingToolbar PagingToolbar} or live scroll loading information
 * at a certain position into the screen.
 *
 * This class is intended as Base implementation by any notifier which want to implement
 * some sort of sliding of {@link Zarafa.common.ui.PagingToolbar PagingToolbar} or live scroll
 * loading information at a certain position. This class defines the various locations and
 * will ensure that different sliders will properly stack at those locations.
 */
Zarafa.core.ui.notifier.PagingSliderPlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {

	/**
	 * The {@link Zarafa.common.ui.PagingToolbar PagingToolbar} which is used
	 * to show currently loaded pages in grid.
	 * @property
	 * @type Object
	 */
	pagingToolbar : undefined,

	/**
	 * The {@link Zarafa.core.ContextModel} which is obtained from
	 * the {@link Zarafa.core.Context}.
	 *
	 * @property
	 * @type Zarafa.core.ContextModel
	 */
	model : undefined,

	/**
	 * The parentEl to which the notifier should be restricted
	 * @property
	 * @type Object
	 */
	parentEl : undefined,

	/**
	 * Timer which is used to slide out slider after specified time.
	 * @property
	 * @type Number
	 */
	timer : undefined,

	/**
	 * @cfg {String} sliderContainerPosition The position of the container
	 * in which the notifier will be shown. This can be any of the following values:
	 * - 'tl': The top left corner
	 * - 't': The center of the top edge (default)
	 * - 'tr': The top right corner
	 * - 'l': The center of the left edge
	 * - 'c': In the center of the element
	 * - 'r': The center of the right edge
	 * - 'bl': The bottom left corner
	 * - 'b': The center of the bottom edge
	 * - 'br': The bottom right corner
	 */
	sliderContainerPosition : 'b',

	/**
	 * @cfg {Char} slideInDirection the animation slideIn direction for notification
	 */
	slideInDirection : 'b',

	/**
	 * @cfg {Char} slideOutDirection the animation slideOut direction for notification
	 */
	slideOutDirection : 'b',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = Ext.applyIf(config || {}, {
			sliderCls : 'k-slider',
			sliderContainerPosition : 'b',
			slideInDirection : 'b',
			slideOutDirection : 'b'
		});

		Zarafa.core.ui.notifier.PagingSliderPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Notify the user with a {@link Zarafa.common.ui.PagingToolbar PagingToolbar}.
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - parentEl: Which is the container to which the notifier should be restricted
	 * - destroy: Don't create new message, but destroy previous one
	 * - model: {@link Zarafa.core.ContextModel model} of the current context.
	 * - update: true to realign the slider.
	 * - slider: The slider container.
	 * @return {Ext.Element} The slider element which was created
	 */
	notify : function(category, title, message, config)
	{
		Ext.apply(this, config);
		if (config.destroy) {
			this.setSliderTimeOut();
		} else if (config.update) {
			this.slider.alignTo(this.parentEl, this.sliderContainerPosition + '-' + this.sliderContainerPosition, [-8, 0]);
		} else {
			clearTimeout(this.timer);
			this.slider = this.getSlider();
			if (!this.pagingEnabled) {
				this.setSliderTimeOut();
			} else {
				this.model.on('folderchange', this.onFolderChange, this);
			}
		}
		return this.slider;
	},

	/**
	 * Event handler clear the timeout of slider.
	 */
	clearSliderTimeOut : function()
	{
		clearTimeout(this.timer);
	},

	/**
	 * Event handler set the timeout for the slider.
	 */
	setSliderTimeOut: function()
	{
		this.timer = setTimeout(function(slider) {
			if (!Ext.isDefined(slider)) {
				return;
			}
			slider.ghost(this.slideOutDirection, {remove : true});
		}, this.sliderDuration, this.slider);
	},

	/**
	 * Event handler triggered when folder was changed in hierarchy. It will
	 * make {@link Zarafa.common.ui.PagingToolbar#cursor cursor} to 0 which reset
	 * the pagination tool bar page counter.
	 */
	onFolderChange : function()
	{
		if (Ext.isDefined(this.pagingToolbar)) {
			this.pagingToolbar.cursor = 0;
		}
	},

	/**
	 * Create {@link Zarafa.common.ui.PagingToolbar PagingToolbar} object in slider.
	 * @param {Ext.Element} slider The element in which {@link Zarafa.common.ui.PagingToolbar PagingToolbar}
	 * should be rendered.
	 */
	createPagingToolbar : function(slider)
	{
		var cursor = !Ext.isEmpty(this.pagingToolbar) ? this.pagingToolbar.cursor : 0;
		this.pagingToolbar = Ext.create({
			xtype: 'zarafa.paging',
			renderTo : slider.dom,
			pageSize : container.getSettingsModel().get('zarafa/v1/main/page_size'),
			store : this.model.getStore(),
			cursor : cursor
		});
	},

	/**
	 * Function which prepare the slide element.
	 *
	 * @return {Ext.Element} slider The element which show current loaded items in grid.
	 */
	getSlider : function()
	{
		var sliderCfg = {
			id : this.parentEl.id + '-' + this.sliderCls,
			cls : this.sliderCls
		};

		if (!this.pagingEnabled) {
			var store = this.model.getStore();
			sliderCfg.html = this.getUpdatedPaginationText(store);
		}

		var element = Ext.get(sliderCfg.id);
		if (!element) {
			element = Ext.DomHelper.insertFirst(this.parentEl, sliderCfg, true);

			if (this.pagingEnabled) {
				this.createPagingToolbar(element);
			} else {
				element.on({
					'mouseenter' : this.clearSliderTimeOut,
					'mouseleave' : this.setSliderTimeOut,
					scope : this
				});
				store.on('load', this.onStoreLoad, this);
			}
			element.alignTo(this.parentEl, this.sliderContainerPosition + '-' + this.sliderContainerPosition, [-8, 0]);
			element = element.slideIn(this.slideInDirection);
		} else if (!this.pagingEnabled) {
			element.dom.innerHTML = sliderCfg.html;
		}
		return element;
	},

	/**
	 * Event handler triggered when store is load. it also update the
	 * pagination text for the livescroll slider.
	 *
	 * @param {Zarafa.core.data.ListModuleStore} store The store which
	 * fire the load event.
	 */
	onStoreLoad : function(store)
	{
		this.slider.dom.innerHTML = this.getUpdatedPaginationText(store);
	},

	/**
	 * Helper function which gives the updated pagination text for the livescroll slider.
	 * @param {Zarafa.core.data.ListModuleStore} store The store which used to update
	 * pagination text.
	 * @returns {String} return pagination text which shows in livescroll slider.
	 */
	getUpdatedPaginationText : function (store)
	{
		var sliderText = String.format(_('Loaded {0} of {1}'), store.getRange().length, store.getTotalCount());
		return String.format('<div>{0}</div>', sliderText);
	}
});
