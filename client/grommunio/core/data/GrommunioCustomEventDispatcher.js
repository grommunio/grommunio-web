/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.GrommunioCustomEventDispatcher
 * @extends Ext.util.Observable
 * @singleton
 *
 * This singleton can be used to register events that have to be available in the whole Webapp.
 */
Grommunio.core.data.GrommunioCustomEventDispatcher = Ext.extend(Ext.util.Observable, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config) {
		// Call our superclass constructor to complete construction process.
		Grommunio.core.data.GrommunioCustomEventDispatcher.superclass.constructor.call(this, config);
	}
});

// make it a singleton
Grommunio.core.data.GrommunioCustomEventDispatcher = new Grommunio.core.data.GrommunioCustomEventDispatcher();
