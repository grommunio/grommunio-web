Ext.ns('Zarafa.common.searchfield.ui');

/**
 * @class Zarafa.common.searchfield.ui.SearchFieldContainer
 * @extends Ext.Container
 * @xtype zarafa.searchfieldcontainer
 *
 * This class can be used to construct a search field container which holds
 * {@link Zarafa.common.searchfield.ui.SearchTextField SearchTextField},
 * {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo} and
 * {@link Ext.Button SearchButton}.
 */
Zarafa.common.searchfield.ui.SearchFieldContainer = Ext.extend(Ext.Container, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(config, {
			xtype : 'zarafa.searchfieldcontainer',
			cls : 'search_container',
			items :[{
				xtype : 'zarafa.searchtextfield',
				searchContainer : this
			},{
				xtype : 'zarafa.searchfoldercombo',
				model : config.model
			},{
				xtype : 'button',
				ref : 'searchBtn',
				iconCls : 'icon_search',
				scope : this
			}]
		});

		Zarafa.common.searchfield.ui.SearchFieldContainer.superclass.constructor.call(this, config);
		this.searchTextField.mon(this.searchBtn, 'click', this.searchTextField.onTriggerClick, this.searchTextField);
	}
});
Ext.reg('zarafa.searchfieldcontainer', Zarafa.common.searchfield.ui.SearchFieldContainer);
