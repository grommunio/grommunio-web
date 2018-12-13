/*
 * #dependsFile client/zarafa/hierarchy/data/SharedFolderTypes.js
 */
Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.SharedFolderContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.sharedfoldercontentpanel
 */
Zarafa.hierarchy.dialogs.SharedFolderContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.hierarchy.data.SharedFolderTypes} defaultSelectedFolderType Default selected folder in combolist.
	 */
	defaultSelectedFolderType : Zarafa.hierarchy.data.SharedFolderTypes['ALL'],

	/**
	 * @cfg {Zarafa.core.data.IPMRecipientStore} store The store in which the user is stored which
	 * will contain the user whose store we wish to open.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!config.store) {
			config.store = new Zarafa.core.data.IPMRecipientStore({
				allowResolvingToLocalContacts: false,
				allowResolvingToGABGroups: false
			});
		}

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.sharedfoldercontentpanel',
			layout: 'fit',
			title: _('Open Shared Folders'),
			width: 330,
			height: 250,
			items: [{
				xtype: 'zarafa.sharedfolderpanel',
				ref: 'sharedFolderPanel',
				store: config.store,
				defaultSelectedFolderType: config.defaultSelectedFolderType || this.defaultSelectedFolderType,
				buttons: [{
					text: _('Open'),
					handler: this.onOpen,
					scope: this
				},{ 
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.hierarchy.dialogs.SharedFolderContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 *
	 * This will apply the current categories to all {@link Zarafa.core.data.IPMRecord records}
	 * and will close the panel.
	 * @private
	 */
	onOpen : function()
	{
		if (this.store && this.store.getCount() > 0) {
			var recipient = this.store.getAt(0);

			// If the recipient has not yet been resolved, then we should
			// wait until the store has correctly resolved the user.
			if (!recipient.isResolved() && !recipient.attemptedToResolve()) {
				this.mon(this.store, 'resolved', this.onOpen, this, { single: true }); 
				return;
			}

			// Check if we have a valid user which has a store. When this is not the case
			// just show an error message and keep the panel open to allow the user
			// a second chance of entering a valid user.
			if (!recipient.isResolved()) {
				Ext.MessageBox.show({
					title: _('Unresolved user'),
					msg: String.format(_('Username \'{0}\' could not be resolved.'), recipient.get('display_name')),
					buttons: Ext.MessageBox.OK
				});
				return;
			} else if (recipient.get('display_type') !== Zarafa.core.mapi.DisplayType.DT_MAILUSER) {
				Ext.MessageBox.show({
					title: _('Invalid user'),
					msg: String.format(_('Username \'{0}\' is not a valid user.'), recipient.get('display_name')),
					buttons: Ext.MessageBox.OK
				});
				return;
			} else if (recipient.get('email_address') === container.getUser().getEmailAddress()) {
				Ext.MessageBox.show({
					title: _('Own store'),
					msg: _('It is not possible to open your own store twice.'),
					buttons: Ext.MessageBox.OK
				});
				return;
			}

			var name = recipient.get('email_address');
			var options = this.sharedFolderPanel.getFolderOptions();

			// Check if we are able to open the Shared Store, if not
			// it has already been opened.
			var opened = container.getHierarchyStore().open(name, options['type'], options['subfolders']);
			if (!opened) {
				Ext.MessageBox.show({
					title: _('Folder already open'),
					msg: _('This shared folder is already open.'),
					buttons: Ext.MessageBox.OK
				});
			} else {
				this.close();
			}
		} else {
			Ext.MessageBox.show({
				title: _('No user'),
				msg: _('You must specify a user'),
				buttons: Ext.MessageBox.OK
			});
		}
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 *
	 * This will close the panel without saving
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	}
});

Ext.reg('zarafa.sharedfoldercontentpanel', Zarafa.hierarchy.dialogs.SharedFolderContentPanel);
