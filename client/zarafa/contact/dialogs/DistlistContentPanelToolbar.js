Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.DistlistContentPanelToolbar
 * @extends Zarafa.core.ui.ContentPanelToolbar
 * @xtype zarafa.distlistcontentpaneltoolbar
 */
Zarafa.contact.dialogs.DistlistContentPanelToolbar = Ext.extend(Zarafa.core.ui.ContentPanelToolbar, {
	// Insertion points for this class
	/**
	 * @insert context.contact.distlistcontentpanel.toolbar.actions
	 * Insertion point for the Actions buttons in the Contact Content Panel Toolbar
	 * @param {Zarafa.contact.dialogs.DistlistContentPanelToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.contact.distlistcontentpanel.toolbar.options
	 * Insertion point for the Options buttons in the Contact ContentPanel Toolbar
	 * @param {Zarafa.contact.dialogs.DistlistContentPanelToolbar} toolbar This toolbar
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
			insertionPointBase: 'context.contact.distlistcontentpanel',
			actionItems: this.createActionButtons(),
			optionItems: this.createOptionButtons()
		});

		Zarafa.contact.dialogs.DistlistContentPanelToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Create all buttons which should be added by default the the 'Action' buttons.
	 * This contains the buttons to save the message or delete it.
	 *
	 * @return {Array} The {@link Ext.Button Buttons} elements which should be
	 * added in the Action section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createActionButtons : function()
	{
		return [{
			xtype : 'button',
			text : _('Save')+' & '+_('Close'),
			overflowText : _('Save')+' & '+_('Close'),
			tooltip: _('Save')+' & '+_('Close') + ' (Ctrl + S)',
			cls : 'zarafa-action',
			iconCls : 'buttons-icon_save_white',
			handler : this.onSave,
			scope : this,
			ref : 'saveCloseBtn'
		}, {
			xtype : 'button',
			ref : 'deleteBtn',
			overflowText : _('Delete'),
			tooltip : _('Delete'),
			iconCls : 'icon_delete',
			handler : this.onDelete,
			scope : this
		}, {
			xtype : 'button',
			overflowText : _('Print'),
			tooltip : _('Print') + ' (Ctrl + P)',
			iconCls : 'icon_print',
			handler : this.onPrint,
			scope : this
		}];
	},

	/**
	 * Create all buttons which should be added by default the the 'Options' buttons.
	 * This contains the buttons to change categories and private property.
	 *
	 * @return {Array} The {@link Ext.Button Buttons} elements which should be
	 * added in the Options section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createOptionButtons : function()
	{
		return [{
			xtype : 'button',
			overflowText : _('Categories'),
			tooltip : {
				text : _('Open the categories dialog')
			},
			iconCls : 'icon_categories',
			handler : this.onCategories,
			scope : this
		}, {
			xtype : 'button',
			overflowText : _('Private'),
			tooltip : {
				text : _('Mark this Distribution list as private')
			},
			iconCls : 'icon_private',
			ref : 'setPrivate',
			toggleGroup : 'privateGroup',
			handler : this.onPrivateGroupToggle,
			scope : this
		}];
	},

	/**
	 * Event handler which is called when the user pressed the 'Save' button.
	 * This will save the {@link Zarafa.core.data.IPMRecord IPMRecord} and
	 * will close {@link Zarafa.contact.dialogs.DistlistContentPanel DistlistEditContentPanel}.
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

		if (button.pressed) {
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
		} else {
			this.deleteBtn.setVisible(true);
			this.setPrivate.setVisible(true);
			this.saveCloseBtn.setVisible(true);

			// Only enable Disabled button when it is not a phantom
			this.deleteBtn.setDisabled(record.phantom === true);

			if (contentReset === true || record.isModified('private')) {
				this.setPrivate.toggle(record.get('private'), true);
			}
		}
	}
});

Ext.reg('zarafa.distlistcontentpaneltoolbar', Zarafa.contact.dialogs.DistlistContentPanelToolbar);
