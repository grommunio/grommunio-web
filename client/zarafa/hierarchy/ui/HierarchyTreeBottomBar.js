Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.HierarchyTreeBottomBar
 * @extends Ext.Container
 * @xtype zarafa.hierarchybottombar
 */
Zarafa.hierarchy.ui.HierarchyTreeBottomBar = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Zarafa.hierarchy.data.SharedFolderTypes} defaultSelectedSharedFolderType The default 
	 * type of Shared Folder that is selected in the dialog that will be opened.
	 */
	defaultSelectedSharedFolderType: null,

	/**
	 * @cfg {String} buttonText The text that should be displayed on the button to open shared folders.
	 */
	buttonText: _('Open Shared Folders'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var buttonText = Ext.util.Format.htmlEncode(config.buttonText || this.buttonText);

		Ext.applyIf(config, {
			cls: 'zarafa-hierarchy-treepanel-bottombar',
			layout:'table',
			defaultSelectedSharedFolderType: Zarafa.hierarchy.data.SharedFolderTypes['ALL'],

			items: [{
				cls: 'zarafa-hierarchy-treepanel-footer-opensharedfolder',
				xtype:'button',
				tooltip : buttonText + ' (Alt + S)',
				text: buttonText + ' + ',
				handler: this.openSharedFolder.createDelegate(this)
			}]
		});

		Zarafa.hierarchy.ui.HierarchyTreeBottomBar.superclass.constructor.call(this, config);
	},

	/**
	 * Called when the button to open Shared Folders is pressed. It will open the dialog to let the 
	 * user decide on what folder to open. This function is called within the scope of the 
	 * {@link Zarafa.hierarchy.ui.HierarchyTreeBottomBar}.
	 * @param {Ext.Button} button, The Button
	 * @param {Ext.EventObject} event The click event
	 */
	openSharedFolder: function(button, event){
		Zarafa.hierarchy.Actions.openSharedFolderContent(this.defaultSelectedSharedFolderType);
	}
});

Ext.reg('zarafa.hierarchytreebottombar', Zarafa.hierarchy.ui.HierarchyTreeBottomBar);
