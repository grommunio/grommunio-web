Ext.ns('Zarafa.common.searchfield.ui');

/**
 * @class Zarafa.common.searchfield.ui.SearchFieldContainer
 * @extends Ext.Container
 * @xtype zarafa.searchfieldcontainer
 *
 * Container for the modernized search field. Holds the
 * {@link Zarafa.common.searchfield.ui.SearchTextField SearchTextField} and a hidden
 * {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
 * (used internally for folder scope management).
 */
Zarafa.common.searchfield.ui.SearchFieldContainer = Ext.extend(Ext.Container, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(config, {
			xtype: 'zarafa.searchfieldcontainer',
			cls: 'k-search-container',
			items:[{
				xtype: 'zarafa.searchtextfield',
				searchContainer: this
			},{
				xtype: 'zarafa.searchfoldercombo',
				model: config.model,
				searchFieldContainer: this,
				hidden: true,
				width: 0
			}]
		});

		Zarafa.common.searchfield.ui.SearchFieldContainer.superclass.constructor.call(this, config);
	}
});
Ext.reg('zarafa.searchfieldcontainer', Zarafa.common.searchfield.ui.SearchFieldContainer);
