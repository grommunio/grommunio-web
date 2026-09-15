/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/common/ui/grid/Renderers.js
 */
Ext.namespace('Grommunio.note.ui');

/**
 * @class Grommunio.note.ui.NoteGridColumnModel
 * @extends Grommunio.common.ui.grid.ColumnModel
 */
Grommunio.note.ui.NoteGridColumnModel = Ext.extend(Grommunio.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns: this.createColumns(),
			defaults: {
				sortable: true
			}
		});

		Grommunio.note.ui.NoteGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns: function()
	{
		return [{
			dataIndex	: 'icon_index',
			headerCls	: 'grommunio-icon-column',
			header		: '<p class="icon_index">&nbsp;<span class="title">Icon</span></p>',
			tooltip		: _('Sort by: Icon'),
			width		: 24,
			fixed		: true,
			renderer	: Grommunio.common.ui.grid.Renderers.icon
		}, {
			dataIndex	: 'subject',
			header		: _('Subject'),
			width		: 400,
			tooltip		: _('Sort by: Subject'),
			renderer	: Grommunio.common.ui.grid.Renderers.subject
		}, {
			dataIndex	: 'creation_time',
			header		: _('Created'),
			tooltip		: _('Sort by: Created'),
			width		: 160,
			renderer	: Grommunio.common.ui.grid.Renderers.datetime
		}, {
			dataIndex	: 'categories',
			id			: 'categories',
			header		: _('Categories'),
			width		: 160,
			tooltip		: _('Sort by: Categories'),
			renderer	: Grommunio.common.ui.grid.Renderers.categories
		}, {
			dataIndex	: 'color',
			header		: _('Color'),
			width		: 160,
			tooltip		: _('Sort by: Color'),
			renderer	: Grommunio.common.ui.grid.Renderers.colorTextValue,
			hidden		: true
		}];
	}
});
