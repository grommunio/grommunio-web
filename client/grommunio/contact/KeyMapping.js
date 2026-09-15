/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/KeyMapMgr.js
 */
Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Contact Context.
 * @singleton
 */
Grommunio.contact.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newItemKeys = [{
			key: Ext.EventObject.C,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewContact,
			scope: this,
			settingsCfg: {
				description: _('New contact'),
				category: _('Creating an item')
			}
		},{
			key: Ext.EventObject.D,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewDistributionList,
			scope: this,
			settingsCfg: {
				description: _('New distribution list'),
				category: _('Creating an item')
			}
		}];

		Grommunio.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to
	 * create a new contact.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewContact: function(key, event, component)
	{
		Grommunio.contact.Actions.openCreateContactContent(container.getContextByName('contact').getModel());
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to
	 * create a new distribution list.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewDistributionList: function(key, event, component)
	{
		Grommunio.contact.Actions.openCreateDistlistContent(container.getContextByName('contact').getModel());
	}

});

Grommunio.contact.KeyMapping = new Grommunio.contact.KeyMapping();
