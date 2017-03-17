Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.Actions
 * Advance search actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.advancesearch.Actions = {
	/**
	 * Open a {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel} for
	 * select the {@link Zarafa.core.data.IPFRecord folder} on which search get's performs.
	 *
	 * @param {Object} config (optional) Configuration object to create the ContentPanel
	 */
	openSelectSearchFolderDialog : function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['search.dialog.selectfolder'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], config);
	}
};
