Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesWordsEditPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.ruleswordseditpanel
 *
 * Panel to edit the {@link Zarafa.common.rules.data.ConditionFlags#SUBJECT_WORDS} condition
 * for a {@link Zarafa.common.rules.data.RulesRecord Rule}.
 */
Zarafa.common.rules.dialogs.RulesWordsEditPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Ext.data.Store} store The store which contains the words on which
	 * is being filtered.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.ruleswordseditpanel',
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
			padding : 5,
			items : [{
				xtype : 'zarafa.compositefield',
				items : [{
					xtype : 'button',
					ref : '../editWordBtn',
					text : _('Edit'),
					width : 70,
					disabled : true,
					handler : this.onWordEdit,
					scope : this
				},{
					xtype : 'spacer',
					width : 5
				},{
					xtype : 'button',
					ref : '../deleteWordBtn',
					text : _('Delete'),
					width : 70,
					disabled : true,
					handler : this.onWordDelete,
					scope : this
				}]
			},{
				xtype : 'spacer',
				height : 5
			},{
				xtype : 'zarafa.compositefield',
				items : [{
					xtype : 'textfield',
					ref : '../wordField',
					hideLabel : true,
					flex : 1,
					listeners : {
						'specialkey' : this.onInputSpecialKey,
						'scope' : this
					}
				},{
					xtype : 'button',
					autoWidth : true,
					iconCls : 'zarafa-rules-add',
					handler : this.onWordAdd,
					scope : this
				}]
			},{
				xtype : 'spacer',
				height : 5
			},{
				xtype : 'grid',
				ref : 'gridPanel',
				flex : 1,
				border : true,
				enableHdMenu : false,
				enableColumnMove : false,
				store : config.store,
				viewConfig : {
					headersDisabled : true,
					forceFit: true,
					autoExpandColumn: true,
					markDirty : false,
					scrollOffset: 0
				},
				colModel : new Ext.grid.ColumnModel({
					columns: [{
						dataIndex: 'words',
						sortable: false,
						renderer : Ext.util.Format.htmlEncode
					}]
				}),
				sm : new Ext.grid.RowSelectionModel({
					singleSelect : true,
					listeners : {
						'selectionchange' : this.onSelectionChange,
						'scope' : this
					}			
				})
			}]
		});

		Zarafa.common.rules.dialogs.RulesWordsEditPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the user pressed the {@link Ext.EventObject#ENTER ENTER} key.
	 * This will call {@link #onWordAdd}.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onInputSpecialKey : function(field, e)
	{
		if (e.getKey() == e.ENTER) {
			this.onWordAdd();
		}
	},

	/**
	 * Event handler which is fired when the 'Add' button has been clicked. This
	 * will read the content of the input field, and add it to the {@link #store}.
	 * After that the wordField is cleared, and the focus is reapplied to the
	 * input field.
	 * @return {Boolean} False when user tries to add another word.
	 * @private
	 */
	onWordAdd : function()
	{
		var value = this.wordField.getValue().trim();
		if (!Ext.isEmpty(value)) {
			this.store.add(new Ext.data.Record({ words : value }));
			this.wordField.reset();
		}
		this.wordField.focus();
	},

	/**
	 * Event handler which is fired when the 'Edit' button has been clicked. This
	 * will obtain the currently selected record, remove it from the {@link #store}
	 * and place the contents into the input field for further editing.
	 * @private
	 */
	onWordEdit : function()
	{
		var record = this.gridPanel.getSelectionModel().getSelected();
		if (record) {
			this.store.remove(record);
			this.wordField.setValue(record.get('words'));
			this.wordField.focus();
		}
	},

	/**
	 * Event handler which is fired when the 'Delete' button has been clicked. This
	 * will remove the selected record from the {@link #store}.
	 * @private
	 */
	onWordDelete : function()
	{
		var record = this.gridPanel.getSelectionModel().getSelected();
		if (record) {
			this.store.remove(record);
		}
	},

	/**
	 * Event handler which is fired when the {@link Ext.grid.RowSelectionModel} fires the
	 * {@link Ext.grid.RowSelectionModel#selectionchange 'selectionchange'} event. This will
	 * update the "Edit" and "Delete" buttons.
	 * @param {Ext.grid.RowSelectionModel} selModel The selection model which fired the event
	 * @private
	 */
	onSelectionChange : function(selModel)
	{
		var hasSelection = selModel.hasSelection();
		this.editWordBtn.setDisabled(!hasSelection);
		this.deleteWordBtn.setDisabled(!hasSelection);
	}
});

Ext.reg('zarafa.ruleswordseditpanel', Zarafa.common.rules.dialogs.RulesWordsEditPanel);
