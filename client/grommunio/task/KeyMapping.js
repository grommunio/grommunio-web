/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/KeyMapMgr.js
 */
Ext.namespace('Grommunio.task');

/**
 * @class Grommunio.task.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Task Context.
 * @singleton
 */
Grommunio.task.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newItemKeys = [{
			key: Ext.EventObject.K,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewTask,
			scope: this,
			settingsCfg: {
				description: _('New task'),
				category: _('Creating an item')
			}
		}];

		Grommunio.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Grommunio.core.KeyMap KeyMap} when the user wants to
	 * create a new task.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewTask: function(key, event, component)
	{
		Grommunio.task.Actions.openCreateTaskContent(container.getContextByName('task').getModel());
	}

});

Grommunio.task.KeyMapping = new Grommunio.task.KeyMapping();
