/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/ui/grid/Renderers.js
 */
Ext.namespace('Grommunio.task.attachitem');

/**
 * @class Grommunio.task.attachitem.AttachTaskColumnModel
 * @extends Grommunio.common.ui.grid.ColumnModel
 *
 * The {@link Grommunio.task.attachitem.AttachTaskColumnModel AttachTaskColumnModel} is the column model containing
 * sets of {@link Ext.grid.Column columns} for task folders.
 * This column model will be used with {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Grommunio.task.attachitem.AttachTaskColumnModel = Ext.extend(Grommunio.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
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

		Grommunio.task.attachitem.AttachTaskColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * task folder into {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns: function()
	{
		return[{
			dataIndex: 'icon_index',
			headerCls: 'grommunio-icon-column',
			header: '<p class=\'icon_index\'>&nbsp;</p>',
			width: 24,
			fixed: true,
			tooltip: _('Sort by: Icon'),
			renderer: Grommunio.common.ui.grid.Renderers.icon
		}, {
			dataIndex: 'importance',
			headerCls: 'grommunio-icon-column',
			header: '<p class=\'icon_importance\'>&nbsp;</p>',
			width: 24,
			fixed: true,
			tooltip: _('Sort by: Priority'),
			renderer: Grommunio.common.ui.grid.Renderers.importance
		}, {
			header: '<p class=\'icon_paperclip\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'hasattach',
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.attachment,
			tooltip: _('Sort by: Attachment')
		}, {
			dataIndex: 'subject',
			header: _('Subject'),
			tooltip: _('Sort by: Subject'),
			renderer: Grommunio.common.ui.grid.Renderers.subject
		}, {
			header: _('Status'),
			dataIndex: 'status',
			width: 160,
			renderer: Grommunio.common.ui.grid.Renderers.taskstatus,
			tooltip: _('Sort by: Status')
		}, {
			dataIndex: 'duedate',
			header: _('Due Date'),
			tooltip: _('Sort by: Due Date'),
			renderer: Grommunio.common.ui.grid.Renderers.utcdate
		}, {
			dataIndex: 'percent_complete',
			header: _('% Completed'),
			width: 75,
			tooltip: _('Sort by: Percent Completed'),
			renderer: Grommunio.common.ui.grid.Renderers.percentage
		}, {
			dataIndex: 'categories',
			header: _('Categories'),
			tooltip: _('Sort by: Categories'),
			renderer: Grommunio.common.ui.grid.Renderers.text
		}];
	}
});
