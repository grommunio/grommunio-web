/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.note.data');

/**
 * @class Grommunio.note.data.SearchFields
 * Search fields for search bar
 * @singleton
 */
Grommunio.note.data.SearchFields = [{
	name: _('All text fields'),
	value: 'body'
}, {
	name: _('Categories'),
	value: 'categories'
}];
