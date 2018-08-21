/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.mail.ui.MailGridColumnModel MailGridColumnModel}
 * is the default {@link Ext.grid.ColumnModel ColumnModel} containing two
 * different sets of {@link Ext.grid.Column columns}. The first set contains
 * all {@link Ext.grid.Column columns} which should be available in the
 * {@link Zarafa.mail.ui.MailGrid MailGrid} (either hidden by default,
 * or directly visible). For a more compact view, a more compact set is
 * provided. Switching between the two sets can be done using
 * {@link Zarafa.mail.ui.MailGridColumnModel.useCompactView useCompactView}
 * during configuration, or {@link Zarafa.mail.ui.MailGridColumnModel.setCompactView setCompactView}
 * when the {@link Zarafa.mail.ui.MailGridColumnModel MailGridColumnModel} is already active.
 */
Zarafa.mail.ui.MailGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @cfg {Boolean} useCompactView If true the compact column model will be
	 * used by default. Otherwise the default column model will be used which
	 * contains all possible columns.
	 */
	useCompactView : false,
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.defaultColumns = this.createDefaultColumns();
		this.compactColumns = this.createCompactColumns();

		// Insertion point to allow more columns
		var insertColumns = container.populateInsertionPoint('context.mail.griddefaultcolumn', this) || [];
		this.defaultColumns = this.defaultColumns.concat(insertColumns);
		this.compactColumns = this.compactColumns.concat(insertColumns);

		Ext.applyIf(config, {
			columns: this.defaultColumns,
			defaults: {
				sortable: true
			}
		});

		// Switch to compact view if needed
		if (config.useCompactView === true) {
			config.columns = this.compactColumns;
		}

		Zarafa.mail.ui.MailGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createDefaultColumns : function()
	{
		return [{
			header : '<p class="icon_importance">&nbsp;<span class="title">' + _('Importance') + '</span></p>',
			headerCls: 'zarafa-icon-column importance',
			dataIndex : 'importance',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.importance,
			fixed : true,
			tooltip : _('Sort by: Importance')
		},{
			id : 'column_icon',
			header : '<p class="icon_index">&nbsp;<span class="title">' + _('Icon') + '</span></p>',
			headerCls: 'zarafa-icon-column icon',
			dataIndex : 'icon_index',
			width : 24,
			renderer : Zarafa.common.ui.grid.Renderers.icon,
			fixed : true,
			tooltip : _('Sort by: Icon'),
			preventRowSelection : true
		},{
			header : '<p class="icon_attachment">&nbsp;<span class="title">' + _('Attachment') + '</span></p>',
			headerCls: 'zarafa-icon-column attachment',
			dataIndex : 'hasattach',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			fixed : true,
			tooltip : _('Sort by: Attachment')
		},{
			header : _('From'),
			dataIndex : 'sent_representing_name',
			width : 100,
			renderer : Zarafa.common.ui.grid.Renderers.sender,
			tooltip : _('Sort by: From'),
			groupRenderer:this.groupHeaderBySender
		},{
			header : _('To'),
			dataIndex : 'display_to',
			width : 320,
			renderer : Zarafa.common.ui.grid.Renderers.to,
			tooltip : _('Sort by: To')
		},{
			header : _('Subject'),
			dataIndex : 'subject',
			width: 400,
			renderer : Zarafa.common.ui.grid.Renderers.subject,
			tooltip : _('Sort by: Subject')
		},{
			header : _('Categories'),
			dataIndex : 'categories',
			width : 160,
			renderer: Zarafa.common.ui.grid.Renderers.categories,
			tooltip : _('Sort by: Categories')
		},{
			header : _('Received'),
			dataIndex : 'message_delivery_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-received'}], true),
			tooltip : _('Sort by: Received'),
			groupRenderer : this.groupHeaderByDate
		},{
			header : _('Sent'),
			dataIndex : 'client_submit_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-sent'}], true),
			tooltip : _('Sort by: Sent'),
			groupRenderer  : this.groupHeaderByDate
		},{
			header : _('Modified'),
			dataIndex : 'last_modification_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-modified'}], true),
			hidden: true,
			tooltip : _('Sort by: Modified'),
			groupRenderer  : this.groupHeaderByDate
		},{
			header : _('Size'),
			dataIndex : 'message_size',
			width : 80,
			renderer : Zarafa.common.ui.grid.Renderers.size,
			tooltip : _('Sort by: Size'),
			groupRenderer : this.groupHeaderBySize
		},{
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
	 * the compact view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createCompactColumns : function()
	{
		return [{
			header : '<p class="icon_index">&nbsp;<span class="title">' + _('Icon') + '</span></p>',
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column icon',
			width : 24,
			renderer : Zarafa.common.ui.grid.Renderers.icon,
			fixed : true,
			tooltip : _('Sort by: Icon'),
			preventRowSelection : true
		},{
			header : _('From'),
			dataIndex : 'sent_representing_name',
			width : 160,
			renderer : Zarafa.common.ui.grid.Renderers.sender,
			tooltip : _('Sort by: From'),
			groupRenderer:this.groupHeaderBySender
		},{
			header : _('To'),
			dataIndex : 'display_to',
			width : 160,
			renderer : Zarafa.common.ui.grid.Renderers.to,
			tooltip : _('Sort by: To')
		},{
			header : _('Received'),
			dataIndex : 'message_delivery_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-received'}], true),
			tooltip : _('Sort by: Received'),
			groupRenderer : this.groupHeaderByDate
		},{
			header : _('Sent'),
			dataIndex : 'client_submit_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-sent'}], true),
			tooltip : _('Sort by: Sent'),
			groupRenderer : this.groupHeaderByDate
		},{
			header : _('Modified'),
			dataIndex : 'last_modification_time',
			width : 160,
			sortable : true,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-modified'}], true),
			tooltip : _('Sort by: Modified'),
			groupRenderer : this.groupHeaderByDate
		},{
			header : _('Size'),
			dataIndex : 'message_size',
			width : 80,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.size,
			tooltip : _('Sort by: Size'),
			groupRenderer : this.groupHeaderBySize
		},{
			header : '<p class="icon_importance">&nbsp;<span class="title">' + _('Importance') + '</span></p>',
			headerCls: 'zarafa-icon-column importance',
			dataIndex : 'importance',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.importance,
			fixed : true,
			tooltip : _('Sort by: Importance')
		},{
			header : '<p class="icon_attachment">&nbsp;<span class="title">' + _('Attachment') + '</span></p>',
			headerCls: 'zarafa-icon-column attachment',
			dataIndex : 'hasattach',
			width: 24,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			fixed : true,
			tooltip : _('Sort by: Attachment')
		},{
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
	 * This will switch the {@link Zarafa.mail.ui.MailGridColumnModel columnmodel}
	 * configuration to either the compact or extended configuration.
	 *
	 * @param {Boolean} compact True to enable the compact view
	 */
	setCompactView : function(compact)
	{
		if (this.useCompactView !== compact) {
			this.useCompactView = compact;

			if (compact) {
				this.name = 'compact';
				// Extjs will store the this.columns into this.config after it has constructed
				// all the columns. At that point this.columns consists of the configuration objects,
				// while this.columns consists of all the allocated columns.
				this.defaultColumns = this.config;
				this.columns = this.compactColumns;
			} else {
				this.name = 'default';
				this.compactColumns = this.config;
				this.columns = this.defaultColumns;
			}

			this.setConfig(this.columns, false);
		}
	},

	/**
	 * Function which prepare the title for the grouping header based on the given sender name.
	 * @param {String} sender The sender which is used to the header.
	 * @return {String} formatted title for the grouping headers.
	 */
	groupHeaderBySender: function(sender)
	{
		return Ext.isEmpty(sender) ? _('Unknown') : sender;
	},

	/**
	 * Function which prepare the title for the grouping header based on the given date.
	 * @param {Ext.Date} date The date which is used to format the header.
	 * @return {String} formatted title for the grouping headers.
	 */
	groupHeaderByDate: function (date)
	{
		if (!Ext.isDate(date)) {
			return _('Older');
		}

		var recordDate = date.clone().setToNoon();
		var today = new Date().setToNoon();
		if (recordDate.getTime() === today.getTime()) {
			return _('Today');
		}

		if (recordDate.getTime() === today.add(Date.DAY, -1).getTime()) {
			return _('Yesterday');
		}

		// Current week.
		var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');
		var startDateOfCurrentWeek;
		if (today.getDay() < weekStart) {
			startDateOfCurrentWeek = today.getPreviousWeekDay(weekStart);
		} else {
			var day = (today.getDay() - weekStart ) * -1;
			startDateOfCurrentWeek = today.add(Date.DAY, day);
		}

		var lastDateOfCurrentWeek = startDateOfCurrentWeek.add(Date.DAY, 6);
		if (recordDate.between(startDateOfCurrentWeek,lastDateOfCurrentWeek)) {
			return recordDate.format('l');
		}

		// Previews week
		var firstDateOfLastWeek = startDateOfCurrentWeek.add(Date.DAY, -7);
		var lastDateOfLastWeek = firstDateOfLastWeek.add(Date.DAY, 7);
		if (recordDate.between(firstDateOfLastWeek, lastDateOfLastWeek)) {
			return _('Last Week');
		}

		// Previews Two week
		var firstDateOfTwoWeek = firstDateOfLastWeek.add(Date.DAY, -7);
		if (recordDate.between(firstDateOfTwoWeek, firstDateOfLastWeek)) {
			return _('Two Weeks Ago');
		}

		// Previews Third week
		var firstDateOfThirdWeek = firstDateOfTwoWeek.add(Date.DAY, -7);
		if (recordDate.between(firstDateOfThirdWeek, firstDateOfTwoWeek)) {
			return _('Three Weeks Ago');
		}

		// Last Months
		var firstDateOfLastMonth = today.add(Date.MONTH, -1).getFirstDateOfMonth();
		if (recordDate.between(firstDateOfLastMonth, firstDateOfThirdWeek)) {
			return _('Last Month');
		}

		return _('Older');
	},

	/**
	 * Function which prepare the title for the grouping header based on the given size.
	 * @param {Number} size The size of mail which is used to format the header.
	 * @return {String} formatted title for grouping headers.
	 */
	groupHeaderBySize : function (size)
	{
		if (size <= 1024 * 50) {
			return _('Small') + ' - 50kb';
		} else if (size >= 1024 * 50 && size <= 1024 * 500 ) {
			return _('Medium') + ' 50kb - 500kb';
		} else if (size >= 1024 * 500 && size <= 1024 * 5120) {
			return _('Large') + ' 500kb - 5mb';
		} else if (size >= 1024 * 5120 && size <= 1024 * 20480) {
			return _('Very large') + ' 5mb - 20mb';
		} else {
			return _('Huge') + ' + 20mb';
		}
	}
});