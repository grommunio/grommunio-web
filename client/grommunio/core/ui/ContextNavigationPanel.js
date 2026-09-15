Ext.namespace('Grommunio.core.ui');
/**
 * @class Grommunio.core.ui.ContextNavigationPanel
 * @extends Ext.Panel
 * @xtype grommunio.contextnavigation
 *
 * ContextNavigationPanel provides custom navigation options to context through {@link Grommunio.hierarchy.ui.HierarchyTreePanel}.
 */
Grommunio.core.ui.ContextNavigationPanel = Ext.extend(Ext.Panel, {
	/**
	 * For this Context this panel will be visible in the {@link Grommunio.core.ui.NavigationPanel NavigationPanel}.
	 * @cfg {Grommunio.core.Context} Related Context
	 */
	context: null,

	/**
	 * @cfg {Boolean} true to avoid to {@link Grommunio.core.ui.NavigationPanel#getAllFoldersPanel show all folders} Panel.
	 * even if {@link Grommunio.core.ui.NavigationPanel#showFolderList showFolderList} config is true
	 */
	restrictToShowAllFolderList: false,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor: function (config) {
		config = config || {};

		// Config options for component itself.
		Ext.applyIf(config, {
			border: false,
			layout: 'fit',
			defaults: {
				border: false,
				autoScroll: false,
				defaults: { cls: 'grommunio-context-navigation-item-body' }
			}
		});

		Grommunio.core.ui.ContextNavigationPanel.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Grommunio.core.Context}
	 */
	getContext: function() {
		return this.context || false;
	}
});

Ext.reg('grommunio.contextnavigation', Grommunio.core.ui.ContextNavigationPanel);
