Ext.namespace('Zarafa.note.dialogs');

/**
 * @class Zarafa.note.dialogs.NoteEditToolbar
 * @extends Zarafa.core.ui.ContentPanelToolbar
 * @xtype zarafa.noteedittoolbar
 *
 * this class is used to create/view note edit panel
 */
Zarafa.note.dialogs.NoteEditToolbar = Ext.extend(Zarafa.core.ui.ContentPanelToolbar, {
	// Insertion points for this class
	/**
	 * @insert context.note.noteeditcontentpanel.toolbar.actions
	 * Insertion point for the Actions buttons in the Note Edit Toolbar
	 * @param {Zarafa.note.dialogs.NoteEditToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.note.noteeditcontentpanel.toolbar.options
	 * Insertion point for the Options buttons in the Note Edit Toolbar
	 * @param {Zarafa.note.dialogs.NoteEditToolbar} toolbar This toolbar
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
			insertionPointBase: 'context.note.noteeditcontentpanel',

			actionItems: this.createActionButtons()
		});

		Zarafa.note.dialogs.NoteEditToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create buttons for top toolbar and it will be
	 * attached to zarafa.contentpaneltoolbar
	 * @return {Array} array consist of buttons for note edit dialog
	 */
	createActionButtons : function()
	{
		return [{
			//Save button
			xtype : 'button',
			ref : 'saveBtn',
			text: _('Save'),
			overflowText : _('Save Note'),
			tooltip: {
				title: _('Save'),
				text: _('Save note') + ' (Ctrl + S)'
			},
			cls : 'zarafa-action',
			iconCls : 'buttons-icon_save_white',
			handler : this.onSaveButton,
			scope : this
		}, {
			//Delete button
			xtype : 'button',
			ref : 'deleteBtn',
			overflowText : _('Delete Note'),
			tooltip: {
				title: _('Delete'),
				text: _('Delete this note')
			},
			cls: 'tb-notes-btn-delete',
			iconCls : 'icon_delete',
			handler : this.onDeleteButton,
			scope : this
		},{
			//Categories button
			xtype : 'button',
			overflowText: _('Set Category'),
			tooltip : {
				title : _('Categories'),
				text : _('Open the categories dialog.')
			},
			cls: 'tb-notes-btn-categories',
			iconCls : 'icon_categories',
			handler : this.onOpenCategories,
			scope : this
		}, {
			xtype : 'button',
			overflowText: _('Print'),
			tooltip: {
				title: _('Print'),
				text: _('Print this note')
			},
			cls: 'tb-notes-btn-print',
			iconCls : 'icon_print',
			handler : this.onPrintRecord,
			scope : this
		}, {
			xtype : 'combo',
			width : 75,
			fieldLabel : _('Color'),
			overflowText : _('Color'),
			ref : 'colorCombo',
			cls: 'tb-notes-combo-color',
			store : {
				xtype : 'arraystore',
				fields: ['icon_index', 'name'],
				data: [ [768, _("Blue")],[769, _("Green")],[770, _("Pink")],[771, _("Yellow")],[772, _("White")]]
			},
			displayField : 'name',
			valueField : 'icon_index',
			mode : 'local',
			editable : false,
			triggerAction : 'all',
			listeners : {
				select : this.onComboSelect,
				scope : this
			},
			plugins: [ 'zarafa.fieldlabeler' ]
		}];
	},

	/**
	 * Event handler when the "Save" button has been pressed.
	 * This will {@link Zarafa.core.data.RecordContentPanel#saveRecord save} the given record.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onSaveButton : function()
	{
		this.dialog.saveRecord();
	},

	/**
	 * Event handler when the "Delete" button has been pressed.
	 * This will {@link Zarafa.core.data.RecordContentPanel#deleteRecord delete} the given record.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onDeleteButton : function()
	{
		this.dialog.deleteRecord();
	},

	/**
	 * Handler for Note dialogbox's toolbar's comboxe's select event
	 * @param {Object} form UI form object
	 * @param {Object} record object. this is not selected record.
	 * @param {Number} selected index of combo box
	 * @private
	 */
	onComboSelect : function(form, record, selectedIndex)
	{
		// set new icon index value for record
		this.record.set('icon_index', record.get('icon_index'));

		var colorIndex = Zarafa.core.mapi.NoteColor.getColorValue(record.get('icon_index'));
		this.record.set('color', colorIndex);
	},

	/**
	 * Handler for the Categories toolbar button
	 * This will call {@link Zarafa.common.Actions#openCategoriesContent}.
	 * @private
	 */
	onOpenCategories : function()
	{
		Zarafa.common.Actions.openCategoriesContent(this.record, {autoSave : false});
	},

	/**
	 * Handler for the Print toolbar buttoon
	 * This will call {@link Zarafa.common.Actions#openPrintDialog}.
	 * @private
	 */
	onPrintRecord : function()
	{
		Zarafa.common.Actions.openPrintDialog(this.record);
	},

	/**
	 * Load record into form
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		this.record = record;

		if(record.isSubMessage()) {
			this.deleteBtn.setVisible(false);
			this.saveBtn.setVisible(false);
		} else {
			this.saveBtn.setVisible(true);

			// Only enable Disabled button when it is not a phantom
			this.deleteBtn.setDisabled(record.phantom === true);
		}

		// set combobox selected value as record's color
		this.colorCombo.setValue(record.get('icon_index'));

		this.doLayout();
	},

	/**
	 * Function to update the record whenever form fields are modified
	 * @param {Zarafa.core.data.IPMRecord} the record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		record.set('icon_index', this.colorCombo.getValue());
	}
});
Ext.reg('zarafa.noteedittoolbar', Zarafa.note.dialogs.NoteEditToolbar);
