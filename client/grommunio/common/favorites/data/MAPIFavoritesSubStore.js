/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.favorites.data');

/**
 * @class Grommunio.common.favorites.data.MAPIFavoritesSubStore
 * @extends Grommunio.hierarchy.data.IPFSubStore
 *
 * {@link Grommunio.hierarchy.data.MAPIFavoritesSubStore} holds {@link Grommunio.hierarchy.data.FavoritesFolderRecord} as records,
 * which defines favorites folders of all opened stores(own, shared, public)
 */
Grommunio.common.favorites.data.MAPIFavoritesSubStore = Ext.extend(Grommunio.hierarchy.data.IPFSubStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Grommunio.common.favorites.data.MAPIFavoritesSubStore.superclass.constructor.call(this, config);
	}
});
