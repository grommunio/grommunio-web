/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.ui');

/**
 * @class Grommunio.mail.ui.ExportAsContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.exportascontextmenu
 *
 * The ExportAsContextMenu is the context menu that is shown as submenu
 * of the {@link Grommunio.mail.ui.MailGridContextMenu MailGridContextMenu}.
 */
Grommunio.mail.ui.ExportAsContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records: [],

	/**
	 * The {@link Grommunio.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Grommunio.mail.MailContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.exportascontextmenu',
			cls: 'k-categories',
			items: [{
				text: _('EML file(s)'),
				iconCls: 'icon_download',
				handler: this.onContextItemEml,
				scope: this
			}, {
				text: _('ZIP file'),
				hideOnDisabled: false,
				iconCls: 'icon_download_zip',
				beforeShow: this.onZipMenuItemBeforeShow,
				handler: this.onContextItemEmlZip,
				scope: this
			}]
		});

		Grommunio.mail.ui.ExportAsContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which determines if menu items should be disable or not.
	 * It will check if records are more than the configured upper limit of
	 * total messages allowed to be included in single ZIP archive.
	 * it changes the display text of menu item by postfixing the maximum limit information.
	 *
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Grommunio.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onZipMenuItemBeforeShow: function (item, records)
	{
		var serverConfig = container.getServerConfig();
		var maxFiles = serverConfig.getMaxEmlFilesInZIP();

		if (records.length > maxFiles) {
			item.setText(item.text + ' ( ' + _('max. ') + maxFiles + ' )');
			item.disable();
		}
	},

	/**
	 * Event handler which is called when the user selects the 'Download as files'
	 * item in the context menu. This will request to download selected message
	 * as file (RFC822-formatted email stream) with eml extension.
	 * @private
	 */
	onContextItemEml: function ()
	{
		Grommunio.common.Actions.openSaveEmlDialog(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'Download as ZIP'
	 * item in the context menu. This will request to download selected message
	 * as file (RFC822-formatted email stream) with eml extension included in a ZIP archive.
	 * @private
	 */
	onContextItemEmlZip: function ()
	{
		Grommunio.common.Actions.openSaveEmlDialog(this.records, true);
	}
});

Ext.reg('grommunio.exportascontextmenu', Grommunio.mail.ui.ExportAsContextMenu);
