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
			tooltip : _('Sort by: From')
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
			renderer : Zarafa.common.ui.grid.Renderers.text,
			hidden: true,
			tooltip : _('Sort by: Categories')
		},{
			header : _('Received'),
			dataIndex : 'message_delivery_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-received'}], true),
			tooltip : _('Sort by: Received')
		},{
			header : _('Sent'),
			dataIndex : 'client_submit_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-sent'}], true),
			tooltip : _('Sort by: Sent')
		},{
			header : _('Modified'),
			dataIndex : 'last_modification_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-modified'}], true),
			hidden: true,
			tooltip : _('Sort by: Modified')
		},{
			header : _('Size'),
			dataIndex : 'message_size',
			width : 80,
			renderer : Zarafa.common.ui.grid.Renderers.size,
			tooltip : _('Sort by: Size')
		},{
			id : 'column_flag',
			header : '<p class="icon_mail_flag">&nbsp;<span class="title">' + _('Flag Status') + '</span></p>',
			headerCls: 'zarafa-icon-column icon',
			dataIndex : 'flag_status',
			width : 24,
			renderer : Zarafa.common.ui.grid.Renderers.flag,
			fixed : true,
			tooltip : _('Sort by: Flag Status'),
			preventRowSelection : true
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
			tooltip : _('Sort by: From')
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
			tooltip : _('Sort by: Received')
		},{
			header : _('Sent'),
			dataIndex : 'client_submit_time',
			width : 160,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-sent'}], true),
			tooltip : _('Sort by: Sent')
		},{
			header : _('Modified'),
			dataIndex : 'last_modification_time',
			width : 160,
			sortable : true,
			// Setting the renderer with createDelegate to be able to pass a meta object to the renderer.
			// This way we can add a css-class to the element (used by Selenium tests)
			renderer : Zarafa.common.ui.grid.Renderers.datetime.createDelegate(null, [{css: 'mail-modified'}], true),
			tooltip : _('Sort by: Modified')
		},{
			header : _('Size'),
			dataIndex : 'message_size',
			width : 80,
			hidden: true,
			renderer : Zarafa.common.ui.grid.Renderers.size,
			tooltip : _('Sort by: Size')
		},{
			header : '<p class="icon_mail_flag">&nbsp;<span class="title">' + _('Flag Status') + '</span></p>',
			headerCls: 'zarafa-icon-column icon',
			dataIndex : 'flag_status',
			width : 24,
			renderer : Zarafa.common.ui.grid.Renderers.flag,
			fixed : true,
			tooltip : _('Sort by: Flag Status'),
			preventRowSelection : true
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
	}
});
