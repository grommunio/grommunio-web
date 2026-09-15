/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.export');

/**
 * @class Grommunio.common.export.ExportItemContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.exportitemcontextmenu
 *
 * The ExportContactContextMenu is the context menu that is shown as submenu
 * of the {@link Grommunio.core.ui.menu.ConditionalMenu ConditionalMenu}.
 */
Grommunio.common.export.ExportItemContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records: [],

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.exportitemcontextmenu',
			cls: 'k-categories',
			items: [{
				xtype: 'grommunio.conditionalitem',
				text: _('ICS'),
				iconCls: 'icon_saveaseml',
				hideOnDisabled: false,
				beforeShow: this.onExportMenuBeforeShow,
				handler: this.onContextItemICS,
				scope: this
			}]
		});

		Grommunio.common.export.ExportItemContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the user selects the 'ICS'
	 * item in the context menu. This will request to download selected calendar item
	 * as file (RFC2445-formatted ics stream) with ics extension.
	 * @private
	 */
	onContextItemICS: function ()
	{
		Grommunio.common.Actions.openSaveEmlDialog(this.records, true);
	},

	/**
	 * Event handler which determines if menu items should be disable or not.
	 * It will disable respective menu item if record is not appointment.
	 *
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Grommunio.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onExportMenuBeforeShow: function (item, records)
	{
		item.setDisabled(!Ext.isEmpty(records) && records.some(function(record) {
				return !record.isMessageClass('IPM.appointment');
			})
		);
	}
});

Ext.reg('grommunio.exportitemcontextmenu', Grommunio.common.export.ExportItemContextMenu);
