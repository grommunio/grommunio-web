Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 */
Zarafa.task.ui.TaskGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns : this.createColumns(),
			defaults : {
				sortable : true
			}
		});

		Zarafa.task.ui.TaskGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns : function()
	{
		return[{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column icon',
			header : '<p class="icon_index">&nbsp;</p>',
			width : 25,
			tooltip : _('Sort by: Icon'),
			fixed : true,
			hideable : false,
			renderer : Zarafa.common.ui.grid.Renderers.icon,
			editor : {
					xtype : 'displayfield',
					style : 'height: 17px;',
					//overwriting this to customize the value to be displayed in editor
					setValue : function(value){
						this.addClass(Zarafa.core.mapi.IconIndex.getClassName(value));
					}
			}
		},{
			dataIndex : 'importance',
			headerCls: 'zarafa-icon-column importance',
			header : '<p class="icon_importance">&nbsp;</p>',
			width : 24,
			tooltip : _('Sort by: Priority'),
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.importance,
			editor: {
				xtype :'iconcombo',
				store : {
						xtype: 'jsonstore',
						fields: ['iconCls','name', 'value'],
						data : Zarafa.common.data.ImportanceFlags.flags
					},
				triggerAction : 'all',
				mode : 'local',
				valueField : 'value',
				displayField : 'name',
				iconClsField: 'iconCls'
			}
		},{
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_attachment">&nbsp;</p>',
			dataIndex : 'hasattach',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			fixed : true,
			tooltip : _('Sort by: Attachment')
		},{
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_recurring">&nbsp;</p>',
			dataIndex: 'recurring',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.recurrence,
			fixed: true
		},{
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_reminder">&nbsp;</p>',
			dataIndex : 'reminder',
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.reminder,
			fixed: true,
			hidden: true
		},{
			header : _('Reminder Time'),
			dataIndex: 'flagdueby',
			width: 160,
			renderer : Zarafa.common.ui.grid.Renderers.datetime,
			tooltip : _('Sort by: Reminder Time'),
			hidden: true
		}, {
			xtype : 'checkcolumn',
			dataIndex : 'complete',
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_complete">&nbsp;</p>',
			width : 25,
			fixed : true,
			// override renderer so we can hide strikethough line displayed in empty cell, when task is complete
			renderer : this.completeColumnRenderer.createDelegate(this),
			tooltip : _('Sort by: Complete'),
			editor: {
				xtype : 'checkbox',
				style : 'margin-left: 10px;'
			},
			// override processEvent so we can save the change in the record
			processEvent : Ext.ux.grid.CheckColumn.prototype.processEvent.createSequence(this.onCompleteColumnProcessEvent)
		}, {
			id : 'subject',
			dataIndex : 'subject',
			header : _('Subject'),
			tooltip : _('Sort by: Subject'),
			renderer : Zarafa.common.ui.grid.Renderers.subject,
			editor: {
				xtype: 'textfield'
			}
		},{
			dataIndex : 'startdate',
			header : _('Start Date'),
			tooltip : _('Sort by: Start Date'),
			renderer : Zarafa.common.ui.grid.Renderers.utcdate,
			editor: {
				xtype : 'datefield',
				emptyText : _('None')
			}
		},{
			dataIndex : 'duedate',
			header : _('Due Date'),
			tooltip : _('Sort by: Due Date'),
			renderer : Zarafa.common.ui.grid.Renderers.utcdate,
			editor: {
				xtype : 'datefield',
				emptyText : _('None')
			}
		},{
			dataIndex : 'owner',
			header : _('Owner'),
			tooltip : _('Sort by: Owner'),
			renderer : Zarafa.common.ui.grid.Renderers.text,
			editor: {
				xtype: 'textfield',
				disabled : true
			}
		},{
			dataIndex : 'categories',
			header : _('Categories'),
			tooltip : _('Sort by: Categories'),
			renderer : Zarafa.common.ui.grid.Renderers.text,
			editor: {
				allowBlank : true,
				xtype : 'lovcombo',
				separator : ';',
				hideOnSelect : false,
				store : {
					xtype : 'zarafa.categoriesstore'
				},
				mode : 'local',
				triggerAction :'all',
				displayField : 'category',
				valueField : 'category'
			}
		},{
			dataIndex : 'percent_complete',
			header : _('% Completed'),
			width : 75,
			tooltip : _('Sort by: Percent Completed'),
			renderer : Zarafa.common.ui.grid.Renderers.percentage,
			editor: {
				xtype : 'zarafa.spinnerfield',
				minValue: 0,
				defaultValue:0,
				incrementValue : 0.25,
				maxValue: 1,
				plugins: ['zarafa.percentspinner']
			}
		},{
			header: _('Sensitivity'),
			dataIndex: 'sensitivity',
			width: 160,
			renderer: Zarafa.common.ui.grid.Renderers.sensitivity,
			hidden: true
		},{
			header: _('Company'),
			tooltip : _('Sort by: Company'),
			dataIndex: 'companies',
			hidden: true,
			renderer: Zarafa.common.ui.grid.Renderers.text
		},{
			header : _('Modified'),
			dataIndex : 'last_modification_time',
			width : 160,
			renderer : Zarafa.common.ui.grid.Renderers.datetime,
			hidden: true,
			tooltip : _('Sort by: Modified')
		},{
			header : _('Date Completed'),
			dataIndex : 'date_completed',
			width : 160,
			renderer : Zarafa.common.ui.grid.Renderers.date,
			hidden: true,
			tooltip : _('Sort by: Date Completed')
		},{
			header: _('Status'),
			dataIndex: 'status',
			width: 160,
			hidden: true,
			renderer: Zarafa.common.ui.grid.Renderers.taskstatus,
			tooltip : _('Sort by: Status')
		},{
			header: _('Total Work'),
			dataIndex: 'totalwork',
			width: 160,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.durationHours,
			tooltip : _('Sort by: Total Work')
		},{
			header: _('Actual Work'),
			dataIndex: 'actualwork',
			width: 160,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.durationHours,
			tooltip : _('Sort by: Actual Work')
		},{
			header : _('Organizer'),
			dataIndex : 'sent_representing_name',
			width : 100,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.name,
			tooltip : _('Sort by: Organizer')
		},{
			header : _('Assigned To'),
			dataIndex : 'display_to',
			width : 100,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.name,
			tooltip : _('Sort by: Assignee')
		},{
			header : _('Mileage'),
			dataIndex : 'mileage',
			width : 100,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.text,
			tooltip : _('Sort by: Mileage')
		},{
			header : _('Billing Information'),
			dataIndex : 'billing_information',
			width : 100,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.text,
			tooltip : _('Sort by: Billing Information')
		},{
			header : _('Size'),
			dataIndex : 'message_size',
			width : 80,
			renderer : Zarafa.common.ui.grid.Renderers.size,
			hidden: true,
			tooltip : _('Sort by: Size')
		}];
	},

	/**
	 * Override from the {@link Ext.ux.grid.CheckColumn#renderer} function
	 * to add 'zarafa-grid-empty-cell' css class to grid cell. This will hide strikethrough line that will appear
	 * when task is marked as complete.
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 * @private
	 */
	completeColumnRenderer : function(value, p, record)
	{
		p.css += ' zarafa-grid-empty-cell';

		return Ext.ux.grid.CheckColumn.prototype.renderer.apply(this, arguments);
	},

	/**
	 * Sequence of the {@link Ext.ux.grid.CheckColumn#processEvent} function
	 * this will toggle the completed state of the task and directly save this
	 * to the server.
	 * @param {String} name name of the event which triggered this function
	 * @param {Ext.EventObject} e event object
	 * @param {Zarafa.common.ui.grid.GridPanel} grid grid panel which holds this {@link Zarafa.common.ui.grid.ColumnModel ColumnModel}
	 * @param {Number} rowIndex index of the row which is toggled
	 * @param {Number} colIndex index of the column which is toggled
	 * @private
	 */
	onCompleteColumnProcessEvent : function(name, e, grid, rowIndex, colIndex)
	{
		if (name === 'mousedown') {
			var record = grid.store.getAt(rowIndex);

			record.beginEdit();

			if (record.get('complete')) {
				record.set('percent_complete', 1);
				record.set('status', Zarafa.core.mapi.TaskStatus.COMPLETE);
				record.set('date_completed', new Date());
			} else {
				record.set('status', Zarafa.core.mapi.TaskStatus.NOT_STARTED);
				record.set('percent_complete', 0);
				record.set('date_completed', null);
			}

			record.endEdit();

			// save changes
			record.save();
		}
	}
});
