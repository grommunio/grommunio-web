/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.CounterProposalGrid
 * @extends Ext.grid.GridPanel
 * @xtype grommunio.counterproposalgrid
 *
 * This view is used to list all proposed time from the attendees in appointments dialog
 */
Grommunio.calendar.dialogs.CounterProposalGrid = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'grommunio.counterproposalgrid',
			store: new Ext.data.JsonStore({
				root: 'proposals',
				fields: ['startdate', 'duedate', 'duration', 'display_name']
			}),
			autoHeight: true,
			maxHeight: 300,
			viewConfig: {
				forceFit: true
			},
			columns: this.initColumnModel(),
			selModel: this.initSelectionModel()
		});

		Grommunio.calendar.dialogs.CounterProposalGrid.superclass.constructor.call(this, config);
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.GridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return [{
			dataIndex: 'startdate',
			header: _('Proposed Date and Time'),
			sortable: true,
			renderer: Grommunio.common.ui.grid.Renderers.datetime
		},{
			dataIndex: 'duration',
			header: _('Duration'),
			sortable: true,
			renderer: Grommunio.common.ui.grid.Renderers.duration
		},{
			dataIndex: 'display_name',
			header: _('Proposed By'),
			sortable: true,
			renderer: Grommunio.common.ui.grid.Renderers.text
		}
		//@TODO:this column should show whether the proposed time is conflicting with any other organizer appointment
		/*,{
			dataIndex: 'conflict',
			header: _('Attendees'),
			sortable: true
		}*/
		];
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect: true
		});
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.calendar.dialogs.CounterProposalGrid.superclass.initEvents.call(this);

		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
		this.on('viewready', this.onViewReady, this);
	},

	/**
	 * Update the {@link Ext.grid.GridPanel Panel} with the given {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * Also it will build the proposed time information data of attendees
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		// we need opened record to get recipient store
		if(!record.isOpened()) {
			return;
		}

		/*
		 * if record is not changed then don't do any processing
		 * this check is added because we need to do below processing only when
		 * this function is called first time after record is opened
		 */
		if (this.record === record) {
			return;
		}

		this.record = record;

		// check if we need to populate this grid
		if (record.isMeetingOrganized() && record.get('counter_proposal')) {
			var recipientStore = record.getSubStore('recipients');
			var items = {
				proposals: []
			};

			for (var i = 0, len = recipientStore.getCount(); i < len; i++) {
				var recipient = recipientStore.getAt(i);

				if(recipient.isMeetingOrganizer()) {
					var duration = record.get('duration') ? record.get('duration') : Date.diff(Date.MINUTE, record.get('duedate'), record.get('startdate'));
					var organizer = {
						'display_name': _('Current Meeting Time'),
						'startdate': record.get('startdate'),
						'duedate': record.get('duedate'),
						'duration': duration
					};

					items.proposals.push(organizer);
				} else if(recipient.get('proposednewtime') === true) {
					var duration = Date.diff(Date.MINUTE, recipient.get('proposednewtime_end'), recipient.get('proposednewtime_start'));
					var item = {
						'display_name': recipient.get('display_name'),
						'startdate': recipient.get('proposednewtime_start'),
						'duedate': recipient.get('proposednewtime_end'),
						'duration': duration
					};

					items.proposals.push(item);
				}
			}

			this.store.loadData(items);

			if (contentReset) {
				// Select first row in proposal grid.
				this.getSelectionModel().selectFirstRow();
			}

			// now we have populated the data in grid so make it visible
			this.setVisible(true);
		}
	},

	/**
	 * Event handler which is fired when the {@link #getView view} is ready.
	 * Depending on the rendering/layouting order this might be called either before
	 * or after {@link #update} and should hence attempt to reselect what was marked
	 * as selected by {@link #update}.
	 * @private
	 */
	onViewReady: function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Event handler which is triggered when the {@link Grommunio.calendar.ui.CounterProposalGrid grid}
	 * {@link Grommunio.core.data.IPMRecord record} selection is changed. This will inform
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function(selectionModel)
	{
		var selections = selectionModel.getSelections();

		if (!Ext.isEmpty(selections) && selections.length == 1) {
			this.record.beginEdit();
			var startDate = selections[0].get('startdate');
			var dueDate = selections[0].get('duedate');

			this.record.set('startdate', startDate);
			this.record.set('duedate', dueDate);
			this.record.set('commonstart', startDate);
			this.record.set('commonend', dueDate);
			this.record.set('duration', (dueDate - startDate) / (60 * 1000));

			// If the first row is selected, counter_proposal remains true,
			// because the user hasn't selected a proposal and we must continue
			// showing the proposal grid in the future. When the user selected
			// a proposal we no longer need to show the proposals.
			this.record.set('counter_proposal', selectionModel.isSelected(0));
			this.record.endEdit();
		}
	}
});

Ext.reg('grommunio.counterproposalgrid', Grommunio.calendar.dialogs.CounterProposalGrid);
