/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.checknames.dialogs');

/**
 * @class Grommunio.common.checknames.dialogs.CheckNamesPanel
 * @extends Ext.Panel
 * @xtype grommunio.checknamespanel
 */
Grommunio.common.checknames.dialogs.CheckNamesPanel = Ext.extend(Ext.Panel, {
	/**
	 * The listView which is used to display all possible names.
	 * @property
	 * @type Ext.list.ListView
	 */
	checkNamesList: undefined,

	/**
	 * @cfg {Ext.data.JsonStore} store The store containing all suggestions
	 */
	store: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		// Prepare the suggestion store
		if (!Ext.isDefined(config.store)) {
			config.store = new Ext.data.JsonStore({
				autoDestroy: true,
				idProperty: 'smtp_address',
				fields: Grommunio.core.data.IPMRecipientResolveRecord,
				data: []
			});
		}

		Ext.applyIf(config, {
			xtype: 'grommunio.checknamespanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			header: true,
			items: [{
				xtype: 'displayfield',
				value: _('Select an address to use') + ':',
				hideLabel: true
			},{
				xtype: 'grid',
				ref: 'checkNamesList',
				flex: 1,
				store: config.store,
				viewConfig: {
					forceFit: true
				},
				tabindex: 0,
				columns: [{
					dataIndex: 'display_name',
					header: _('Name'),
					renderer: Ext.util.Format.htmlEncode
				},{
					dataIndex: 'smtp_address',
					header: _('Email'),
					renderer: Ext.util.Format.htmlEncode
				}],
				listeners: {
					scope: this,
					afterrender: function(grid) { grid.getEl().dom.setAttribute('tabindex', 0); },
					viewready: this.onViewReady,
					dblclick: this.onDblClick
				},
				selModel: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				cls: 'grommunio-checknames-dialog-filelist'
			}]
		});

		Grommunio.common.checknames.dialogs.CheckNamesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Load an {@link Grommunio.core.data.IPMRecipientRecord} and
	 * {@link Grommunio.core.data.IPMRecipientResolveRecord ChecknamesRecord} data into this panel.
	 *
	 * @param {Grommunio.core.data.IPMRecipientRecord} record The record for which the checknames dialog is shown
	 * @param {Array} data The {@link Grommunio.core.data.IPMRecipientResolveRecord ChecknamesRecord suggestions}
	 * which exist for the given record.
	 */
	update: function(record, data)
	{
		this.setTitle(String.format(_('More than one \'{0}\' found.'), Ext.util.Format.htmlEncode(record.get('display_name'))));
		this.store.add(data || []);
	},

	/**
	 * Enable focus navigation to the grid using the Tab key.
	 */
	focusGrid: function() {
		if (this.checkNamesList && this.checkNamesList.getEl()) {
			this.checkNamesList.getEl().focus();
		}
	},

	/**
	 * Event handler which is fired when the gridPanel is ready. This will automatically
	 * select the first row in the grid.
	 * @private
	 */
	onViewReady: function()
	{
		this.checkNamesList.getSelectionModel().selectFirstRow();
	},

	/**
	 * Update an {@link Grommunio.core.data.IPMRecipientRecord} with the selected
	 * {@link Grommunio.core.data.IPMRecipientResolveRecord record} from the {@link #checkNamesList}.
	 *
	 * @param Grommunio.core.data.IPMRecipientRecord} record The record which must be updated
	 * @return {Boolean} False if the record could not be updated.
	 */
	updateRecord: function(record)
	{
		var selection = this.checkNamesList.getSelectionModel().getSelected();

		if (Ext.isEmpty(selection)) {
			Ext.Msg.alert(_('Alert'), _('Please select a recipient'));
			return false;
		} else {
			record.applyResolveRecord(selection);
		}
	},

	/**
	 * Event handler which is fired when a row inside the {@link #checkNamesList}
	 * has been double-clicked.
	 * @private
	 */
	onDblClick: function()
	{
		this.dialog.onOk();
	},

	onFocus: function() { this.focusGrid(); }
});

Ext.reg('grommunio.checknamespanel', Grommunio.common.checknames.dialogs.CheckNamesPanel);
