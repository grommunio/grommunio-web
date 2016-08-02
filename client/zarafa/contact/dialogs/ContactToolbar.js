Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactToolbar
 * @extends Zarafa.core.ui.ContentPanelToolbar
 * @xtype zarafa.contacttoolbar
 */
Zarafa.contact.dialogs.ContactToolbar = Ext.extend(Zarafa.core.ui.ContentPanelToolbar, {
	// Insertion points for this class
	/**
	 * @insert context.contact.contactcontentpanel.toolbar.actions
	 * Insertion point for the Actions buttons in the Contact Toolbar
	 * @param {Zarafa.contact.dialogs.ContactToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.contact.contactcontentpanel.toolbar.options
	 * Insertion point for the Options buttons in the Contact Toolbar
	 * @param {Zarafa.contact.dialogs.ContactToolbar} toolbar This toolbar
	 */

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			insertionPointBase: 'context.contact.contactcontentpanel',
			actionItems: this.createActionButtons(),
			optionItems: this.createOptionButtons()
		});

		Zarafa.contact.dialogs.ContactToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Create all buttons which should be added by default the the 'Action' Buttons
	 * This contains the buttons to save the message or delete it.
	 *
	 * @return {Array} The {@link Ext.Button Button} elements which should be
	 * added in the Options section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createActionButtons : function()
	{
		return [{
			xtype : 'button',
			ref : 'saveCloseBtn',
			text : _('Save'),
			overflowText : _('Save & Close'),
			tooltip : {
				title : _('Save & Close'),
				text : _('Save contact and close dialog') + ' (Ctrl + S)'
			},
			cls : 'zarafa-action',
			iconCls : 'buttons-icon_save_white',
			handler : this.onSave,
			scope : this
		}, {
			xtype : 'button',
			ref : 'deleteBtn',
			overflowText : _('Delete'),
			tooltip : {
				title : _('Delete contact'),
				text : _('Delete this contact.')
			},
			iconCls : 'icon_delete',
			handler : this.onDelete,
			scope : this
		}, {
			xtype : 'zarafa.attachmentbutton',
			ref : 'addAttachment',
			plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
			overflowText : _('Add Attachment'),
			tooltip : {
				title : _('Add Attachment'),
				text : _('Add attachments to this contact.')
			},
			iconCls : 'icon_attachment',
			// Add a listener to the component added event to set use the correct update function when the toolbar overflows
			// (i.e. is too wide for the panel) and Ext moves the button to a menuitem.
			listeners : {
				added : this.onAttachmentButtonAdded,
				scope : this
			}
		},{
			xtype : 'button',
			overflowText : _('Print'),
			tooltip : {
				title : _('Print'),
				text : _('Print this contact')
			},
			iconCls : 'icon_print',
			handler : this.onPrint,
			scope : this
		}];
	},
	
	/**
	 * Event listener for the added event of the {@link Zarafa.common.attachment.ui.AttachmentButton attachmentButton}
	 * Adds the update function to the item when Ext converts the button to a menu item
	 * (which happens when the toolbar overflows, i.e. is too wide for the containing panel)
	 * 
	 * @param {Ext.Component} item The item that was added. This can be a {@link Zarafa.common.attachment.ui.AttachmentButton}
	 * or a {@link Ext.menu.Item}
	 */
	onAttachmentButtonAdded : function(item)
	{
		if ( item.isXType('menuitem') ){
			// Set the update function to the update function of the original button
			// otherwise the Ext.Component.update function would be called by the recordcomponentupdaterplugin
			item.update = Zarafa.common.attachment.ui.AttachmentButton.prototype.update.createDelegate(this.addAttachment);
		}
	},

	/**
	 * Create all buttons which should be added by default the the 'Options' Buttons.
	 * This contains the buttons to change categories and private property.
	 *
	 * @return {Array} The {@link Ext.Button Button} elements which should be
	 * added in the Options section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createOptionButtons : function()
	{
		return [{
			xtype : 'button',
			overflowText : _('Categories'),
			tooltip : {
				title : _('Categories'),
				text : _('Open the categories dialog.')
			},
			iconCls : 'icon_categories',
			handler : this.onCategories,
			scope : this
		}, {
			xtype : 'button',
			overflowText : _('Private'),
			tooltip : {
				title : _('Private'),
				text : _('Mark this contact as private.')
			},
			iconCls : 'icon_private',
			ref : 'setPrivate',
			enableToggle : true,
			toggleHandler : this.onPrivateGroupToggle,
			scope : this
		}];
	},

	/**
	 * Event handler which is called when the user pressed the 'Save' button.
	 * This will save the {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @private
	 */
	onSave : function()
	{
		this.dialog.saveRecord();
	},

	/**
	 * Event handler which is called when the user pressed the 'Delete' button.
	 * This will delete the {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @private
	 */
	onDelete : function()
	{
		this.dialog.deleteRecord();
	},
	/**
	 * Event handler which is called when the user pressed the 'Print' button.
	 * This will print the {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @private
	 */
	onPrint : function()
	{
		Zarafa.common.Actions.openPrintDialog(this.record);
	},

	/**
	 * Event handler which is called when the user pressed the 'Categories' button.
	 * This will open the {@link Zarafa.common.categories.dialogs.CategoriesContentPanel CategoriesContentPanel}.
	 * @private
	 */
	onCategories : function()
	{
		Zarafa.common.Actions.openCategoriesContent(this.record, {autoSave : false});
	},

	/**
	 * Event handler which is called when the PrivateGroup button
	 * has been toggled. If this is the case 'private' is updated.
	 *
	 * @param {Ext.Button} button The button which was toggled
	 * @private
	 */
	onPrivateGroupToggle : function(button)
	{
		this.record.set('private', button.pressed);
		if (button.pressed === true) {
			this.record.set('sensitivity', Zarafa.core.mapi.Sensitivity['PRIVATE']);
		} else {
			this.record.set('sensitivity', Zarafa.core.mapi.Sensitivity['NONE']);
		}
	},

	/**
	 * Updates the toolbar by updating the Toolbar buttons based on the settings
	 * from the {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;

		if(record.isSubMessage()) {
			// hide all buttons which is used to save changes
			this.deleteBtn.setVisible(false);
			this.setPrivate.setVisible(false);
			this.saveCloseBtn.setVisible(false);
			this.addAttachment.setVisible(false);
		} else {
			this.deleteBtn.setVisible(true);
			this.setPrivate.setVisible(true);
			this.saveCloseBtn.setVisible(true);
			this.addAttachment.setVisible(true);

			// Only enable Disabled button when it is not a phantom
			this.deleteBtn.setDisabled(record.phantom === true);

			if (contentReset === true || record.isModifiedSinceLastUpdate('private')) {
				this.setPrivate.toggle(record.get('private'), true);
			}
		}

		this.doLayout();
	}
});

Ext.reg('zarafa.contacttoolbar', Zarafa.contact.dialogs.ContactToolbar);
