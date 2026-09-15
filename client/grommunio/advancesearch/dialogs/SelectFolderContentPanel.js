Ext.namespace('Grommunio.advancesearch.dialogs');

/**
 * @class Grommunio.advancesearch.dialogs.SelectFolderContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.selectfoldercontentpanel
 *
 * This will display a {@link Grommunio.core.ui.ContentPanel contentpanel}
 * for select {@link Grommunio.core.data.IPFRecord folder} on which search gets performed.
 */
Grommunio.advancesearch.dialogs.SelectFolderContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.selectfoldercontentpanel',
			layout: 'fit',
			title: _('Select Folder'),
			width: 300,
			height: 350,
			items: [{
				xtype: 'grommunio.selectfolderpanel',
				model: config.model,
				searchFolderCombo: config.searchFolderCombo
			}]
		});

		Grommunio.advancesearch.dialogs.SelectFolderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.selectfoldercontentpanel', Grommunio.advancesearch.dialogs.SelectFolderContentPanel);
