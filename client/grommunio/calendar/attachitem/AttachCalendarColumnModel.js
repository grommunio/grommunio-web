/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/ui/grid/Renderers.js
 */
Ext.namespace('Grommunio.calendar.attachitem');

/**
 * @class Grommunio.calendar.attachitem.AttachCalendarColumnModel
 * @extends Grommunio.common.ui.grid.ColumnModel
 *
 * The {@link Grommunio.calendar.attachitem.AttachCalendarColumnModel AttachCalendarColumnModel} is the column model containing
 * sets of {@link Ext.grid.Column columns} for calendar folders.
 * This column model will be used with {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Grommunio.calendar.attachitem.AttachCalendarColumnModel = Ext.extend(Grommunio.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns: this.getColumns(),
			defaults: {
				sortable: true
			}
		});

		Grommunio.calendar.attachitem.AttachCalendarColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * calendar folder into {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns: function()
	{
		return [{
			header: '<p class=\'icon_index\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'icon_index',
			tooltip: _('Sort by: Icon'),
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.icon
		}, {
			header: '<p class=\'icon_paperclip\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'hasattach',
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.attachment,
			tooltip: _('Sort by: Attachment')
		}, {
			header: '<p class=\'icon_recurrence\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'recurring',
			tooltip: _('Sort by: Recurring'),
			width: 24,
			renderer: Grommunio.common.ui.grid.Renderers.recurrence,
			fixed: true
		}, {
			header: _('Subject'),
			dataIndex: 'subject',
			tooltip: _('Sort by: Subject'),
			renderer: Grommunio.common.ui.grid.Renderers.subject
		}, {
			header: _('Start Date'),
			dataIndex: 'startdate',
			tooltip: _('Sort by: Start Date'),
			width: 180,
			renderer: Grommunio.common.ui.grid.Renderers.datetime
		}, {
			header: _('End Date'),
			dataIndex: 'duedate',
			tooltip: _('Sort by: End Date'),
			width: 180,
			renderer: Grommunio.common.ui.grid.Renderers.datetime
		}];
	}
});
