/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/ui/grid/Renderers.js
 */
Ext.namespace('Grommunio.note.attachitem');

/**
 * @class Grommunio.note.attachitem.AttachNoteColumnModel
 * @extends Grommunio.common.ui.grid.ColumnModel
 *
 * The {@link Grommunio.note.attachitem.AttachNoteColumnModel AttachNoteColumnModel} is the column model containing
 * sets of {@link Ext.grid.Column columns} for sticky note folders.
 * This column model will be used with {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Grommunio.note.attachitem.AttachNoteColumnModel = Ext.extend(Grommunio.common.ui.grid.ColumnModel, {
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

		Grommunio.note.attachitem.AttachNoteColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * sticky note folder into {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns: function()
	{
		return [{
			dataIndex: 'icon_index',
			headerCls: 'grommunio-icon-column',
			header: '<p class=\'icon_index\'>&nbsp;</p>',
			tooltip: _('Sort by: Icon'),
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.icon
		}, {
			dataIndex: 'subject',
			header: _('Subject'),
			tooltip: _('Sort by: Subject'),
			renderer: Grommunio.common.ui.grid.Renderers.subject
		}];
	}
});
