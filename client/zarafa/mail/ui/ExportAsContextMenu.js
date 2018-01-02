Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.ExportAsContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.exportascontextmenu
 *
 * The ExportAsContextMenu is the context menu that is shown as submenu
 * of the {@link Zarafa.mail.ui.MailGridContextMenu MailGridContextMenu}.
 */
Zarafa.mail.ui.ExportAsContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records: [],

	/**
	 * The {@link Zarafa.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
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
			xtype: 'zarafa.exportascontextmenu',
			cls: 'k-categories',
			items: [{
				text: _('EML file(s)'),
				iconCls: 'icon_saveaseml',
				handler: this.onContextItemEml,
				scope: this
			}, {
				text: _('ZIP file'),
				hideOnDisabled: false,
				iconCls: 'icon_saveemlaszip',
				beforeShow: this.onZipMenuItemBeforeShow,
				handler: this.onContextItemEmlZip,
				scope: this
			}]
		});

		Zarafa.mail.ui.ExportAsContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which determines if menu items should be disable or not.
	 * It will check if records are more than the configured upper limit of
	 * total messages allowed to be included in single ZIP archive.
	 * it changes the display text of menu item by postfixing the maximum limit information.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
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
	 * as file (RFC822-formatted e-mail stream) with eml extension.
	 * @private
	 */
	onContextItemEml: function ()
	{
		Zarafa.common.Actions.openSaveEmlDialog(this.records);
	},

	/**
	 * Event handler which is called when the user selects the 'Download as ZIP'
	 * item in the context menu. This will request to download selected message
	 * as file (RFC822-formatted e-mail stream) with eml extension included in a ZIP archive.
	 * @private
	 */
	onContextItemEmlZip: function ()
	{
		Zarafa.common.Actions.openSaveEmlDialog(this.records, true);
	}
});

Ext.reg('zarafa.exportascontextmenu', Zarafa.mail.ui.ExportAsContextMenu);
