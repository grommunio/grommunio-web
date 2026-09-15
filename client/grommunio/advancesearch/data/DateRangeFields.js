/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.data');

/**
 * @class Grommunio.advancesearch.data.DateRangeFields
 * Search date range fields for search toolBox
 * @singleton
 */
Grommunio.advancesearch.data.DateRangeFields = [{
    'name': _('Any date'),
    'value': 'all_dates'
}, {
    'name': _('Past week'),
    'value': 'past_week'
}, {
    'name': _('Past 2 weeks'),
    'value': 'past_two_weeks'
}, {
    'name': _('Past month'),
    'value': 'past_month'
}, {
    'name': _('Past 6 month'),
    'value': 'past_six_month'
}, {
    'name': _('Past year'),
    'value': 'past_year'
}, {
    'name': _('Custom date'),
    'value': 'custom_date'
}];
