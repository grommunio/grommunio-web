/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core');

/**
 * @class Grommunio.core.URLActionMgr
 * @extends Object
 *
 * The {@link Grommunio.core.URLActionMgr URLActionMgr} singleton. This singleton will be
 * used to execute actions that are passed in URL, such as mailto action
 * @singleton
 */
Grommunio.core.URLActionMgr = Ext.extend(Ext.util.Observable, {
	/**
	 * The list of registered {@link Grommunio.core.URLAction action handlers}.
	 * Multiple action handlers can be registered for a single url action.
	 * @property
	 * @type Object
	 * @private
	 */
	mappings: undefined,

	/**
	 * @constructor
	 */
	constructor: function()
	{
		this.mappings = {};
	},

	/**
	 * Registers the url action configuration to the specified action.
	 * This will make sure if already a handler is registered for a particular action
	 * then another handler is appended, so both handlers will be executed.
	 *
	 * @param {String} action The name of the URL action to register on.
	 * @param {Object} handlerConfig The config containing handler info for action.
	 * In this object handler is a required key.
	 */
	register: function(action, handlerConfig)
	{
		if(!this.mappings[action]){
			this.mappings[action] = [];
		}

		// Register/Merge action configuration options to mappings array.
		this.mappings[action] = this.mappings[action].concat(handlerConfig);
	},

	/**
	 * Function will be called to execute any URL action, function will find proper handler
	 * based on action and will call handlers which are registered for the action.
	 *
	 * @param {Object} data The data containing action and action data.
	 */
	execute: function(data)
	{
		Ext.iterate(data, function(action, actionData) {
			// check if we have any handlers registered for this action
			var handlers = this.mappings[action];

			if(handlers) {
				Ext.each(handlers, function(handler) {
					// call handler to execute url action
					handler.handler.call(handler.scope || this, action, actionData, handler);
				});
			}
		}, this);
	}
});

Grommunio.core.URLActionMgr = new Grommunio.core.URLActionMgr();
