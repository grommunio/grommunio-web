/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.UIFactory
 * @extends Object
 * @singleton
 *
 *
 * The UI Factory is responsible for opening {@link Grommunio.core.ui.ContentPanel panels} in {@link Grommunio.core.data.UIFactoryLayer layers}.
 * The UI Factory decides the type of layer, based on cascading rules.
 * Types of layers are registered via {@link #registerLayer}.
 * First the type of layer is taken from settings, and then from a config object passed when creating the panel.
 */
Grommunio.core.data.UIFactory = {

	/**
	 * The array of {@link #registerLayer registered} {@link Grommunio.core.data.UIFactoryLayer layers}.
	 * @property
	 * @type Array
	 * @private
	 */
	layers: [],

	/**
	 * Register a layer a layer to the {@Link #layers} array.
	 * @param {Grommunio.core.data.UIFactoryLayer} layer The layer to register
	 */
	registerLayer: function(layer)
	{
		var index = layer.index || 0;

		if (this.layers.length > 0) {
			for (var i = 0, len = this.layers.length; i < len; i++) {
				if (this.layers[i].index > index) {
					this.layers.splice(i, 0, layer);
					return;
				}
			}

		}

		this.layers.push(layer);
	},

	/**
	 * Method to determine the {@link Grommunio.core.data.UIFactoryLayer layer} to use
	 *
	 * @param {Object} config Configuration object
	 * @param {Grommunio.core.data.MAPIRecord} record The record(s) loaded in the component
	 * @return {Grommunio.core.data.UIFactoryLayer} The Layer in which to place a component
	 */
	getPreferredLayer: function(config, record)
	{
		var layers = this.layers;

		// By default the bottom layout is the default,
		// this might be overridden from the settings.
		var layerIndex = 0;

		// First, we must check the special situations which are provided
		// by the configuration object.
		if (config) {
			// The first case checks if a manager was configured, if so the layer
			// which utilizes this manager get preference for the layer in which
			// the component is going to be installed.
			if (config.manager) {
				for (var i = 0, len = layers.length; i < len; i++) {
					if (config.manager === layers[i].manager) {
						layerIndex = i;
						break;
					}
				}
			}

			// The second case is if the new component has the 'modal' property,
			// not all layers accept this, so starting from the layerIndex,
			// we have to search upwards to find the layer which allows the
			// 'modal' property to be set.
			if (config.modal === true) {
				for (var i = layerIndex, len = layers.length; i < len; i++) {
					if (layers[i].allowModal === true) {
						layerIndex = i;
					}
				}
			}
		}

		// The settings might have a different idea on the layer in which
		// the component must be placed. Request the 'type' which should be the
		// layer in which components should be placed.
		var baseContentLayer;
		if(config && config.layerType) {
			baseContentLayer = config.layerType;
		} else {
			// Currently the support of popout feature is restricted to mail context only.
			// So, honor the configured value of base_content_layer settings for mail context only.
			if (Ext.isDefined(record) && record !== null && Ext.isFunction(record.isMessageClass) && record.isMessageClass(['IPM.Note', 'IPM.Schedule.Meeting', 'REPORT.IPM', 'REPORT.IPM.Note'], true)) {
				baseContentLayer = container.getSettingsModel().get('grommunio/v1/main/base_content_layer');
			}
		}

		// Go for popout only if supported.
		if (Grommunio.supportsPopOut() && !Ext.isEmpty(baseContentLayer) && layerIndex === 0 && !(config && config.searchText)) {
			for (var i = 0, len = layers.length; i < len; i++) {
				if (layers[i].type === baseContentLayer) {
					layerIndex = i;
					break;
				}
			}
		}

		return layers[layerIndex];
	},

	/**
	 * Open a {@link Ext.Component component} in a chosen layer.
	 *
	 * @param {Number} componentType A component type taken from the enumeration {@link Grommunio.core.data.SharedComponentType}
	 * @param {Grommunio.core.data.MAPIRecord} record The record(s) loaded in the component
	 * @param {Object} config Configuration object
	 */
	openLayerComponent: function(componentType, records, config)
	{
		var ComponentConstructor = container.getSharedComponent(componentType, records);
		if (ComponentConstructor) {
			if (ComponentConstructor.prototype instanceof Ext.Component) {
				var layer = this.getPreferredLayer(config, records);

				// FIXME: This shouldn't be here, the caller should have
				// applied the record and closable information.
				config = Ext.applyIf(config || {}, {
					record: records,
					closable: true,
					plugins: []
				});
				config.plugins = config.plugins.concat(layer.plugins);

				layer.create(ComponentConstructor, config);
			} else {
				ComponentConstructor.doOpen(records);
			}
		}
	},

	/**
	 * Will open the view action for the passed record.
	 * @param {Grommunio.core.data.MAPIRecord|Grommunio.core.data.MAPIRecord[]} records
	 * The record/records which will be loaded in dialog.
	 * @param {Object} config configuration object.
	 */
	openViewRecord: function(records, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['common.view'];
		this.openLayerComponent(componentType, records, config);
	},

	/**
	 * Will open the create action for the passed record.
	 * @param {Grommunio.core.data.MAPIRecord|Grommunio.core.data.MAPIRecord[]} records
	 * The record/records which will be loaded in dialog.
	 * @param {Object} config configuration object.
	 */
	openCreateRecord: function(records, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['common.create'];
		this.openLayerComponent(componentType, records, config);
	},

	/**
	 * Will open a contextmenu for the passed record/records
	 * This method uses the default componentType for context menus and calls {@link #openContextMenu} with it.
	 * @param {Grommunio.core.data.MAPIRecord|Grommunio.core.data.MAPIRecord[]} records
	 * The record/records for which the contextmenu should be shown
	 * @param {Object} position The X and Y coordinate where the contextmenu was requested
	 * @param {Object} configuration object which should be applied to the contextmenu.
	 * @return {Ext.menu.Menu} The contextmenu which was opened, or undefined when
	 * no contextmenu is registered for the given records.
	 */
	openDefaultContextMenu: function(records, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['common.contextmenu'];
		return this.openContextMenu(componentType, records, config);
	},

	/**
	 * Open a context menu with supplied componentType
	 *
	 * @param {Number} componentType Shared component type taken from {@link Grommunio.core.data.SharedComponentType}
	 * @param {Grommunio.core.data.MAPIRecord|Grommunio.core.data.MAPIRecord[]} records The record(s) for which the contextmenu will be shown
	 * @param {Object} config Configuration object
	 * @return {Ext.menu.Menu} The contextmenu which was opened, or undefined when
	 * no contextmenu is registered for the given componentType and records.
	 */
	openContextMenu: function(componentType, records, config)
	{
		var ComponentConstructor = container.getSharedComponent(componentType, records);
		if (!ComponentConstructor) {
			return;
		}

		config = config || {};

		var menu = new ComponentConstructor(Ext.applyIf(config, {records: records }));
		menu.showAt(config.position);

		return menu;
	},

	/**
	 * Check if the given 'contextmenu' event was requested with the keyboard, which
	 * reports no mouse button and targets the focused element.
	 *
	 * @param {Ext.EventObject} event The event to check
	 * @return {Boolean} True when the contextmenu was requested with the keyboard
	 */
	isKeyboardContextMenu: function(event)
	{
		if (event.button === 2) {
			return false;
		}

		return event.getTarget() === document.activeElement;
	},

	/**
	 * Prepare a contextmenu which was opened with the keyboard. Activate the first
	 * item for the arrow keys and give the focus back to the given element when the
	 * menu is dismissed, unless something else took it meanwhile, e.g. a dialog which
	 * was opened by the item that was clicked.
	 *
	 * @param {Ext.menu.Menu} menu The contextmenu which was opened
	 * @param {Ext.Element} focusEl The element which must be focused again
	 */
	initKeyboardMenuNavigation: function(menu, focusEl)
	{
		if (!(menu instanceof Ext.menu.Menu) || menu.hidden) {
			return;
		}

		// By itself the menu only activates an item on the first arrow key.
		menu.tryActivate(0, 1);

		if (!focusEl) {
			return;
		}

		menu.on('hide', function() {
			var restoreFocus = function() {
				var active = document.activeElement;
				if (active && active !== document.body && (!menu.el || !menu.el.contains(active))) {
					return;
				}

				if (focusEl.dom && Ext.getBody().contains(focusEl)) {
					focusEl.focus();
				}
			};

			// Leave time for the action of a clicked item to claim the focus.
			restoreFocus.defer(100);
		}, this, { single: true });
	},

	/**
	 * Open a hover card with supplied componentType
	 *
	 * @param {Grommunio.core.data.MAPIRecord|Grommunio.core.data.MAPIRecord[]} records The record(s) for which the hover card will be shown
	 * @param {Object} config Configuration object
	 */
	openHoverCard: function (records, config)
	{
		// Close all existing hover card
		Ext.WindowMgr.getBy(function (win) {
			if (win instanceof Grommunio.common.recipientfield.ui.RecipientHoverCardView) {
				win.hide();
			}
		}, this);
		var componentType = Grommunio.core.data.SharedComponentType['common.hovercard'];
		this.openContextMenu(componentType, records, config);
	}
};
