/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.SearchFields
 * Search fields for search bar
 * @singleton
 */
Grommunio.task.data.SearchFields = [{
	name: _('All text fields'),
	value: 'subject body owner companies'
}, {
	name: _('Subject'),
	value: 'subject'
}, {
	name: _('Categories'),
	value: 'categories'
}, {
	name: _('Body'),
	value: 'body'
}, {
	name: _('Owner'),
	value: 'owner'
}, {
	name: _('Companies'),
	value: 'companies'
}, {
	name: _('Due Date'),
	value: 'duedate'
}, {
	name: _('Start Date'),
	value: 'startdate'
}];
