Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SelectFolderContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.selectfoldercontentpanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for select {@link Zarafa.core.data.IPFRecord folder} on which search get's perform.
 */
Zarafa.advancesearch.dialogs.SelectFolderContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.selectfoldercontentpanel',
			layout: 'fit',
			title : _('Select Folder'),
			width: 300,
			height: 350,
			items: [{
				xtype: 'zarafa.selectfolderpanel',
				model : config.model,
				searchFolderCombo : config.searchFolderCombo,
				searchToolBoxIncludeSubFolder : config.searchToolBoxIncludeSubFolder
			}]
		});

		Zarafa.advancesearch.dialogs.SelectFolderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.selectfoldercontentpanel', Zarafa.advancesearch.dialogs.SelectFolderContentPanel);
