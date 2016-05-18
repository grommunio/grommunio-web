Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.ABMultiUserSelectionPanel
 * @extends Ext.Panel
 * @xtype zarafa.abmultiuserselectionpanel
 */
Zarafa.addressbook.ui.ABMultiUserSelectionPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Function} callback the callback function to return to after selecting user from AdressBook.
	 */
	callback : Ext.emptyFn,

	/**
	 * @cfg {Function} convert the convert function which converts an
	 * {@link Zarafa.addressbook.AddressBookRecord user} to the correct type
	 * which can be placed in the {@link #store}.
	 * This function receives the selected AddressBookRecord as first argument,
	 * and optionally passes the {@link Ext.Component} which was generated from the
	 * {@link #selectionCfg} which was used to select the recipient as second argument.
	 */
	convert : Ext.emptyFn,

	/**
	 * @cfg {Function} scope the scope in which the {@link #callback} will be called
	 */
	scope : undefined,

	/**
	 * @cfg {Ext.data.Store} store The store in which all records should be placed.
	 */
	store : undefined,

	/**
	 * @cfg {Array} selectionCfg Array of {@link Zarafa.common.ui.BoxField} configuration
	 * objects which are created below the User list. These will show which users
	 * the user has selected.
	 */
	selectionCfg : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var items = [{
			xtype : 'zarafa.addressbookmainpanel',
			ref : 'abPanel',
			flex : 1,
			hierarchyRestriction : config.hierarchyRestriction,
			listRestriction : config.listRestriction
		}];

		Ext.each(config.selectionCfg, function(cfg) {
			var btn = {
				xtype : 'button',
				text : cfg.fieldLabel,
				//width : 100,
				autoHeight: true,
				handler : this.onSelectionBtnClick,
				scope : this
			};

			items.push({
				xtype: 'zarafa.resizablecompositefield',
				cls: 'zarafa-addressbook-dialog-compositefield',
				hideLabel: true,
				anchor: '100%',
				autoHeight: false,
				items : [ btn, cfg ]
			});
		}, this);

		Ext.applyIf(config, {
			xtype : 'zarafa.abmultiuserselectionpanel',
			layout : {
				type : 'vbox',
				align: 'stretch'
			},
			bodyStyle: 'padding: 5px;',
			items : items,
			buttons: [{
				text: _('Ok'),
				handler: this.onSubmit,
				scope: this
			},{
				text: _('Cancel'),
				handler: this.onCancel,
				scope: this
			}]
		});

		Zarafa.addressbook.ui.ABMultiUserSelectionPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Calls callback function
	 * @return {Boolean} true, if callback was successfull
	 */
	doCallBack : function(){
		var grid = this.abPanel.getGridPanel();
		var sm = grid.getSelectionModel();
		var records = sm.getSelections();

		if (!Ext.isEmpty(records)) {
			Ext.each(records, function(r) {
				this.store.add(this.convert(r));
			}, this);
		}
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.addressbook.ui.ABMultiUserSelectionPanel.superclass.initEvents.apply(this, arguments);

		this.mon(this.abPanel.getGridPanel(), 'rowdblclick', this.onAddressBookRowDblClick, this);
		this.mon(this.abPanel.getGridPanel(), 'rowcontextmenu', this.onAddressBookRowContextMenu, this);
	},

	/**
	 * Event handler which is triggered when the user doubleclicks on a
	 * row within the {@link Ext.grid.GridPanel gridpanel}. This will add
	 * the selected user or group to the {@link Zarafa.core.ui.RecipientField recipientfield}
	 * @private
	 */
	onAddressBookRowDblClick : function()
	{
		this.onSelectionBtnClick();
	},

	/**
	 * Event handler which is triggered when the user rightclicks
	 * on a row in the {@link Ext.grid.GridPanel gridpanel}. This will
	 * open a {@link Zarafa.core.ui.menu.ConditionalMenu contextmenu}
	 * for the selected row.
	 * @param {Ext.grid.GridPanel} grid The grid on which the user clicked
	 * @param {Number} rowIndex the row on which was doubleclicked
	 * @param {Ext.EventObject} event The event information
	 * @private
	 */
	onAddressBookRowContextMenu : function(grid, rowIndex, event)
	{
		var sm = grid.getSelectionModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(sm.getSelections(), {
			position : event.getXY(),
			dialog : this.dialog
		});
	},

	/**
	 * Event handler which is fired when one of the Selection Buttons generated
	 * from the {@link #selectionCfg} was called. This will call {@link #convert}
	 * on the selected record, and then add it to the {@link #store}.
	 * @param {Ext.Button} btn The button which was clicked
	 * @private
	 */
	onSelectionBtnClick : function(btn)
	{
		var field = btn ? btn.ownerCt.get(1) : undefined;
		var grid = this.abPanel.getGridPanel();
		var sm = grid.getSelectionModel();
		var records = sm.getSelections();

		if (Ext.isFunction(this.convert) && !Ext.isEmpty(records)) {
			Ext.each(records, function(r) {
				r = this.convert.call(this.scope || this, r, field);
				if (r) {
					this.store.add(r);
				}
			}, this);
		}
	},

	/**
	 * Event handler which is called when the user presses the "Ok" button.
	 * Function will store changed data in record and close the dialog
	 * @private
	 */
	onSubmit : function()
	{
		if (Ext.isFunction(this.callback)) {
			if (this.callback.call(this.scope || this) !== false) {
				this.dialog.close();
			} else {
				Ext.MessageBox.show({
					title: _('Kopano WebApp'),
					msg: _('You must select one or more users.'),
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.INFO
				});
			}
		}
	},

	/**
	 * Closes {@link Zarafa.core.ui.CreateFolderDialog CreateFolder} dialog
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	}
});

Ext.reg('zarafa.abmultiuserselectionpanel', Zarafa.addressbook.ui.ABMultiUserSelectionPanel);
