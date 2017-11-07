Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 */
Zarafa.task.ui.TaskGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @cfg {Array} simpleColumns The array of {@link Ext.grid.Column column} elements which must be visible within
	 * the simple view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 */
	simpleColumns : [],
	/**
	 * @cfg {Array} simpleColumns The array of {@link Ext.grid.Column column} elements which must be visible within
	 * the detailed view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 */
	 detailedColumns : [],

	/**
	 * @cfg {Zarafa.task.TaskContextModel} model data handling part of context
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.simpleColumns = this.createSimpleColumns();
		this.detailedColumns = this.createDetailedColumns();

		Ext.applyIf(config, {
			columns : this.simpleColumns,
			defaults : {
				sortable : true
			}
		});

		Zarafa.task.ui.TaskGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the simple view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createSimpleColumns : function()
	{
		return[{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column icon',
			header : '<p class="icon_index">&nbsp;</p>',
			width : 25,
			tooltip : _('Sort by: Icon'),
			fixed : true,
			hideable : false,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		}, {
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_reminder">&nbsp;</p>',
			dataIndex : 'reminder',
			tooltip : _('Sort by: Reminder'),
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.reminder,
			fixed: true
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
			// override processEvent so we can save the change in the record
			processEvent : Ext.ux.grid.CheckColumn.prototype.processEvent.createSequence(this.onCompleteColumnProcessEvent)
		}, {
			id : 'subject',
			dataIndex : 'subject',
			header : _('Subject'),
			tooltip : _('Sort by: Subject'),
			renderer : this.columnRenderer
		}, {
			dataIndex : 'duedate',
			header : _('Due Date'),
			tooltip : _('Sort by: Due Date'),
			renderer : this.columnRenderer
		}, {
			header : _('Reminder Time'),
			dataIndex: 'reminder_time',
			width: 160,
			renderer : this.columnRenderer,
			tooltip : _('Sort by: Reminder Time'),
			hidden: true
		}, {
			header : _('Assigned To'),
			dataIndex : 'display_to',
			width : 100,
			renderer : this.columnRenderer,
			tooltip : _('Sort by: Assignee'),
			hidden: true
		}, {
			dataIndex : 'startdate',
			header : _('Start Date'),
			tooltip : _('Sort by: Start Date'),
			renderer : this.columnRenderer,
			hidden: true
		}, {
			dataIndex : 'percent_complete',
			header : _('% Completed'),
			width : 75,
			tooltip : _('Sort by: Percent Completed'),
			renderer : this.columnRenderer,
			hidden: true
		}, {
			dataIndex : 'categories',
			header : _('Categories'),
			tooltip : _('Sort by: Categories'),
			renderer : Zarafa.common.ui.grid.Renderers.categories
		}, {
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_attachment">&nbsp;</p>',
			dataIndex : 'hasattach',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			fixed : true,
			tooltip : _('Sort by: Attachment'),
			hidden: true
		}, {
			dataIndex : 'importance',
			headerCls: 'zarafa-icon-column importance',
			header : '<p class="icon_importance">&nbsp;</p>',
			width : 24,
			tooltip : _('Sort by: Priority'),
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.importance,
			hidden: true
		}, {
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_recurring">&nbsp;</p>',
			dataIndex: 'recurring',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.recurrence,
			fixed: true,
			hidden: true
		}, {
			dataIndex : 'owner',
			header : _('Owner'),
			tooltip : _('Sort by: Owner'),
			renderer : this.columnRenderer,
			hidden: true
		}, {
			header : '<p class="icon_flag">&nbsp;<span class="title">' + _('Flag') + '</span></p>',
			headerCls: 'zarafa-icon-column flag',
			dataIndex : 'flag_due_by',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.flag,
			fixed : true,
			tooltip : _('Sort by: flag')
		}];
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the detailed view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createDetailedColumns : function()
	{
		return[{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column icon',
			header : '<p class="icon_index">&nbsp;</p>',
			width : 25,
			tooltip : _('Sort by: Icon'),
			fixed : true,
			hideable : false,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		}, {
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_reminder">&nbsp;</p>',
			dataIndex : 'reminder',
			tooltip : _('Sort by: Reminder'),
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.reminder,
			fixed: true
		},{
			header : _('Reminder Time'),
			dataIndex: 'reminder_time',
			width: 160,
			renderer : this.columnRenderer,
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
			// override processEvent so we can save the change in the record
			processEvent : Ext.ux.grid.CheckColumn.prototype.processEvent.createSequence(this.onCompleteColumnProcessEvent)
		}, {
			id : 'subject',
			dataIndex : 'subject',
			header : _('Subject'),
			tooltip : _('Sort by: Subject'),
			renderer : this.columnRenderer
		}, {
			header : _('Assigned To'),
			dataIndex : 'display_to',
			width : 100,
			renderer : this.columnRenderer,
			tooltip : _('Sort by: Assignee')
		}, {
			dataIndex : 'startdate',
			header : _('Start Date'),
			tooltip : _('Sort by: Start Date'),
			renderer : this.columnRenderer
		}, {
			dataIndex : 'duedate',
			header : _('Due Date'),
			tooltip : _('Sort by: Due Date'),
			renderer : this.columnRenderer
		},{
			dataIndex : 'percent_complete',
			header : _('% Completed'),
			width : 75,
			tooltip : _('Sort by: Percent Completed'),
			renderer : this.columnRenderer
		}, {
			dataIndex : 'categories',
			header : _('Categories'),
			tooltip : _('Sort by: Categories'),
			renderer : Zarafa.common.ui.grid.Renderers.categories
		}, {
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_attachment">&nbsp;</p>',
			dataIndex : 'hasattach',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			fixed : true,
			tooltip : _('Sort by: Attachment')
		}, {
			dataIndex : 'importance',
			headerCls: 'zarafa-icon-column importance',
			header : '<p class="icon_importance">&nbsp;</p>',
			width : 24,
			tooltip : _('Sort by: Priority'),
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.importance,
			hidden: true
		}, {
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_recurring">&nbsp;</p>',
			dataIndex: 'recurring',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.recurrence,
			fixed: true,
			hidden: true
		}, {
			dataIndex : 'owner',
			header : _('Owner'),
			tooltip : _('Sort by: Owner'),
			renderer : this.columnRenderer,
			hidden: true
		}, {
			header : '<p class="icon_flag">&nbsp;<span class="title">' + _('Flag') + '</span></p>',
			headerCls: 'zarafa-icon-column flag',
			dataIndex : 'flag_due_by',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.flag,
			fixed : true,
			tooltip : _('Sort by: flag')
		}];
	},

	/**
	 * Render the cell based on dataIndex if record is completed
	 * task then strikethrough text of that column.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	columnRenderer : function (value, p, record)
	{
		switch (this.dataIndex) {
			case 'subject':
				value = Zarafa.common.ui.grid.Renderers.subject(value, p, record);
				break;
			case 'display_to':
				// Determine that task has assignee if yes then get the formatted string of assignee name
				if (Ext.isDefined(record.isTaskAssigned) && record.isTaskAssigned()) {
					value = Zarafa.common.ui.grid.Renderers.name(value, p, record);
				} else {
					value = '';
				}
				break;
			case 'startdate':
			case 'duedate':
				value = Zarafa.common.ui.grid.Renderers.utcdate(value, p, record);
				break;
			case 'percent_complete':
				value = Zarafa.common.ui.grid.Renderers.percentage(value, p, record);
				break;
			case 'owner':
				value = Zarafa.common.ui.grid.Renderers.text(value, p, record);
				break;
			case 'reminder_time':
				value = Zarafa.common.ui.grid.Renderers.datetime(value, p, record);
				break;
		}

		if((record.get('complete')
				|| record.get('flag_status') === Zarafa.core.mapi.FlagStatus.completed)
			&& !Ext.isEmpty(value)) {
			p.css += ' k-task-complete';
		}
		return value;
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

		// Value will be undefined as there is no 'complete' property while
		// rendering this column for mail record, using 'flag_status' instead.
		if (!Ext.isDefined(value) && record.get('flag_status') === Zarafa.core.mapi.FlagStatus.completed ) {
			value = true;
		}

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
		if (name !== 'mousedown') {
			return;
		}

		var record = grid.store.getAt(rowIndex);

		// Check if the record is a mail record
		if ( !(record instanceof Zarafa.task.TaskRecord) ) {
			Zarafa.common.flags.Util.updateCategories(record);

			// we need different set of flag properties as this is
			// the mail record we are dealing with.
			var mailFlagProps = {
				flag_icon: 			Zarafa.core.mapi.FlagIcon.clear,
				flag_complete_time:	new Date(),
				flag_request: 		'',
				flag_status: 		Zarafa.core.mapi.FlagStatus.completed,
				reminder:		false,
				task_start_date: 	null,
				task_due_date: 		null
			};

			grid.store.suspendEvents(false);
			record.beginEdit();
			for ( var property in mailFlagProps ){
				record.set(property, mailFlagProps[property]);
			}
			record.endEdit();
			record.save();
			grid.store.resumeEvents();
			return;
		}

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

		if (!record.isNormalTask()) {
			if (!record.isTaskOwner() && !record.isTaskRequest()) {
				Ext.MessageBox.show({
					title: _('Kopano WebApp'),
					msg :_('Please note that assigned task(s) will be overwritten when the assignee makes changes.'),
					icon: Ext.MessageBox.WARNING,
					scope: this,
					buttons: Ext.MessageBox.OK
				});
				record.save();
			} else {
				record.respondToTaskRequest(Zarafa.core.mapi.TaskMode.UPDATE);
			}
		} else {
			// save changes
			record.save();
		}
	},

	/**
	 * This will switch the {@link Zarafa.task.ui.TaskGridColumnModel columnmodel}
	 * configuration to either simple or detailed configuration.
	 *
	 * @param {Boolean} isSimple True to enable the simple view, false otherwise
	 */
	setSimpleView : function(isSimple)
	{
		if (isSimple) {
			this.name = 'simple';
			this.columns = this.simpleColumns;
			this.setConfig(this.simpleColumns, false);
		} else {
			this.name = 'detailed';
			this.columns = this.detailedColumns;
			this.setConfig(this.detailedColumns, false);
		}
	},

	/**
	 * Reconfigures this column model according to selected folder in hierarchy.
	 * if selected folder is other than To-Do list folder then filter out the
	 * percent complete column from column configuration object.
	 *
	 * @param {Object} config The configuration to set on the columnmodel
	 * @param {Boolean} initial True if this is the initial configuration of the columnmodel
	 * @protected
	 */
	setConfig : function(config, initial)
	{
		// If we have model, default folder and which
		// is To-do list folder then don't show
		// percent completed columns.
		if (Ext.isDefined(this.model) &&
			this.model.getDefaultFolder() &&
			this.model.getDefaultFolder().isTodoListFolder()) {
			config = config.filter(function(c) {
				return c.dataIndex !== 'percent_complete';
			});
		}
		Zarafa.task.ui.TaskGridColumnModel.superclass.setConfig.call(this, config, initial);
	}
});
