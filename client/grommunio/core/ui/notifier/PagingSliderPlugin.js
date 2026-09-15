/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.ui.notifier');

/**
 * @class Grommunio.core.ui.notifier.PagingSliderPlugin
 * @extends Grommunio.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Grommunio.core.ui.notifier.NotifyPlugin NotifyPlugin} which works by sliding
 * the {@link Grommunio.common.ui.PagingToolbar PagingToolbar} or live scroll loading information
 * at a certain position into the screen.
 *
 * This class is intended as Base implementation by any notifier which want to implement
 * some sort of sliding of {@link Grommunio.common.ui.PagingToolbar PagingToolbar} or live scroll
 * loading information at a certain position. This class defines the various locations and
 * will ensure that different sliders will properly stack at those locations.
 */
Grommunio.core.ui.notifier.PagingSliderPlugin = Ext.extend(Grommunio.core.ui.notifier.NotifyPlugin, {

	/**
	 * The {@link Grommunio.common.ui.PagingToolbar PagingToolbar} which is used
	 * to show currently loaded pages in grid.
	 * @property
	 * @type Object
	 */
	pagingToolbar: undefined,

	/**
	 * The {@link Grommunio.core.ContextModel} which is obtained from
	 * the {@link Grommunio.core.Context}.
	 *
	 * @property
	 * @type Grommunio.core.ContextModel
	 */
	model: undefined,

	/**
	 * The parentEl to which the notifier should be restricted
	 * @property
	 * @type Object
	 */
	parentEl: undefined,

	/**
	 * Timer which is used to slide out slider after specified time.
	 * @property
	 * @type Number
	 */
	timer: undefined,

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
	sliderContainerPosition: 'b',

	/**
	 * @cfg {Char} slideInDirection the animation slideIn direction for notification
	 */
	slideInDirection: 'b',

	/**
	 * @cfg {Char} slideOutDirection the animation slideOut direction for notification
	 */
	slideOutDirection: 'b',

	/**
	 * @cfg {Array} sliderOffsets The [x, y] offsets with which the slider is aligned
	 * to its {@link #parentEl}. The vertical one keeps it clear of the bottom edge,
	 * which in a full height grid is also the bottom of the window.
	 */
	sliderOffsets: [-8, -12],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = Ext.applyIf(config || {}, {
			sliderCls: 'k-slider',
			sliderContainerPosition: 'b',
			slideInDirection: 'b',
			slideOutDirection: 'b',
			sliderOffsets: [-8, -12]
		});

		Grommunio.core.ui.notifier.PagingSliderPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * Notify the user with a {@link Grommunio.common.ui.PagingToolbar PagingToolbar}.
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - parentEl: Which is the container to which the notifier should be restricted
	 * - destroy: Don't create new message, but destroy previous one
	 * - model: {@link Grommunio.core.ContextModel model} of the current context.
	 * - update: true to realign the slider.
	 * - slider: The slider container.
	 * @return {Ext.Element} The slider element which was created
	 */
	notify: function(category, title, message, config)
	{
		Ext.apply(this, config);
		if (config.destroy) {
			this.setSliderTimeOut();
		} else if (config.update) {
			this.alignSlider(this.slider);
		} else {
			clearTimeout(this.timer);
			this.slider = this.getSlider();
			if (!this.pagingEnabled) {
				this.setSliderTimeOut();
			} else if (Ext.isDefined(this.model)){
				// This check we need to add because sometimes
				// grid does not have model info or we don't need to update the
				// pagination slide info on folder change.
				this.model.on('folderchange', this.onFolderChange, this);
			}
		}
		return this.slider;
	},

	/**
	 * Event handler clear the timeout of slider.
	 */
	clearSliderTimeOut: function()
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
			slider.ghost(this.slideOutDirection, {remove: true});
		}, this.sliderDuration, this.slider);
	},

	/**
	 * Event handler triggered when folder was changed in hierarchy. It will
	 * make {@link Grommunio.common.ui.PagingToolbar#cursor cursor} to 0 which reset
	 * the pagination tool bar page counter.
	 */
	onFolderChange: function()
	{
		if (Ext.isDefined(this.pagingToolbar)) {
			this.pagingToolbar.cursor = 0;
		}
	},

	/**
	 * Create {@link Grommunio.common.ui.PagingToolbar PagingToolbar} object in slider.
	 * @param {Ext.Element} slider The element in which {@link Grommunio.common.ui.PagingToolbar PagingToolbar}
	 * should be rendered.
	 */
	createPagingToolbar: function(slider)
	{
		var cursor = !Ext.isEmpty(this.pagingToolbar) ? this.pagingToolbar.cursor : 0;
		this.pagingToolbar = Ext.create({
			xtype: 'grommunio.paging',
			renderTo: slider.dom,
			pageSize: container.getSettingsModel().get('grommunio/v1/main/page_size'),
			store: this.getStore(),
			cursor: cursor
		});
	},

	/**
	 * Function which prepare the slide element.
	 *
	 * @return {Ext.Element} slider The element which show current loaded items in grid.
	 */
	getSlider: function()
	{
		var sliderCfg = {
			id: this.parentEl.id + '-' + this.sliderCls,
			cls: this.sliderCls
		};

		if (!this.pagingEnabled) {
			var store = this.getStore();
			sliderCfg.html = this.getUpdatedPaginationText(store);
		}

		var element = Ext.get(sliderCfg.id);
		if (!element) {
			element = Ext.DomHelper.insertFirst(this.parentEl, sliderCfg, true);

			if (this.pagingEnabled) {
				this.createPagingToolbar(element);
			} else {
				element.on({
					'mouseenter': this.clearSliderTimeOut,
					'mouseleave': this.setSliderTimeOut,
					scope: this
				});
				store.on('load', this.onStoreLoad, this);
			}
			this.alignSlider(element);
			element = element.slideIn(this.slideInDirection);
		} else if (!this.pagingEnabled) {
			element.dom.innerHTML = sliderCfg.html;
		}
		return element;
	},

	/**
	 * Places the slider against the {@link #parentEl}, lifted off its edge by
	 * the {@link #sliderOffsets}.
	 *
	 * @param {Ext.Element} slider The slider to place
	 */
	alignSlider: function(slider)
	{
		var position = this.sliderContainerPosition + '-' + this.sliderContainerPosition;

		slider.alignTo(this.parentEl, position, this.sliderOffsets);
	},

	/**
	 * Event handler triggered when store is load. it also update the
	 * pagination text for the livescroll slider.
	 *
	 * @param {Grommunio.core.data.ListModuleStore} store The store which
	 * fire the load event.
	 */
	onStoreLoad: function(store)
	{
		this.slider.dom.innerHTML = this.getUpdatedPaginationText(store);
	},

	/**
	 * Helper function which gives the updated pagination text for the livescroll slider.
	 * @param {Grommunio.core.data.ListModuleStore} store The store which used to update
	 * pagination text.
	 * @returns {String} return pagination text which shows in livescroll slider.
	 */
	getUpdatedPaginationText: function (store)
	{
		var sliderText = String.format(_('Loaded {0} of {1}'), store.getStoreLength(), store.getTotalCount());
		return String.format('<div>{0}</div>', sliderText);
	},

	/**
	 * Function is used to get the store from either store config or
	 * from give model.
	 *
	 * @returns {Ext.data.store} store The data store attached with pagination plugin.
	 */
	getStore: function()
	{
		return this.store || this.model.getStore();
	}
});
