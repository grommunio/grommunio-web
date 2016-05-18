Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.MailWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that shows the unread mail.
 */
Zarafa.widgets.folderwidgets.MailWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.mail.MailStore();

		// The store already has the default sort info, but we
		// must apply it still. (Bug in the ListModuleStore?).
		store.setDefaultSort(store.defaultSortInfo.field, store.defaultSortInfo.direction);

		// Create a restriction, we only want unread mails, so mails which
		// do not have the MSGFLAG_READ flag on the PR_MESSAGE_FLAGS
		store.setRestriction({
			'search' : Zarafa.core.data.RestrictionFactory.dataResBitmask(
				'0x00E070003', /* PR_MESSAGE_FLAGS */
				Zarafa.core.mapi.Restrictions.BMR_EQZ,
				Zarafa.core.mapi.MessageFlags.MSGFLAG_READ
			)
		});

		Ext.applyIf(config, {
			height : 200,
			autoScroll: true,
			layout: 'fit',
			folderType : 'inbox',
			store : store,
			items : [{
				xtype: 'zarafa.gridpanel',
				id: 'unread-mail-widget',
				store: store,
				border: true,
				loadMask : {
					msg : _('Loading mail') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No unread mail.') + '</div>',
					forceFit: true,

					// Enable the row body in which we can render
					// the subject of the mail and some icons
					// for the attachment and importance.
					enableRowBody : true,
					rowSelectorDepth : 15,
					getRowClass : this.viewConfigGetRowClass
				},
				colModel : new Ext.grid.ColumnModel({
					columns: [{
						header: _('From'),
						dataIndex: 'sent_representing_name',
						menuDisabled : true,
						renderer: Ext.util.Format.htmlEncode
					},{
						header: _('Received'),
						dataIndex: 'message_delivery_time',
						editable: false,
						menuDisabled : true,
						renderer : Zarafa.common.ui.grid.Renderers.datetime
					}]
				}),
				listeners: {
					'rowcontextmenu' : this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.MailWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Update the filter. This will filter the records using
	 * {@link Zarafa.core.data.IPMRecord#isRead}.
	 * @private
	 */
        updateFilter : function()
	{
		this.store.filterBy(function(record) {
			return !record.isRead();
		}, this);
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Read/Unread style to the entire row. Optionally it will
	 * enable the row body containing the subject and icons for attachment
	 * and priority.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass : function(record, rowIndex, rowParams, store)
	{
		var cssClass = (record.isRead() ? 'mail_read' : 'mail_unread');

		var meta = {}; // Metadata object for Zarafa.common.ui.grid.Renderers.
		var value = ''; // The value which must be rendered
		rowParams.body = '<table cellspacing="0" cellpadding="0" border="0" style="width: 100%;">';
		rowParams.body += '<tr>';

		// Render the subject
		meta = {};
		value = Zarafa.common.ui.grid.Renderers.subject(record.get('subject'), meta, record);
		rowParams.body += String.format('<td style="width: 100%"><div class="grid_compact grid_compact_left grid_compact_subject_cell {0}" style="height: 24px;">{1}</div></td>', meta.css, value);

		// Render the attachment icon (always aligned to the right)
		meta = {};
		value = Zarafa.common.ui.grid.Renderers.attachment(record.get('hasattach'), meta, record);
		rowParams.body += String.format('<td style="width: 24px"><div class="grid_compact {0}" style="height: 24px; width: 24px;">{1}</div></td>', meta.css, value);

		// Render the importance icon (always aligned to the right)
		meta = {};
		value = Zarafa.common.ui.grid.Renderers.importance(record.get('importance'), meta, record);
		rowParams.body += String.format('<td style="width: 24px"><div class="grid_compact {0}" style="height: 24px; width: 24px;">{1}</div></td>', meta.css, value);

		rowParams.body += '</tr></table>';
		return 'x-grid3-row-expanded ' + cssClass;
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
			}
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : event.getXY(), model : model });
	},

	/**
	 * Called when the user double-clicks on a mail.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		Zarafa.core.data.UIFactory.openViewRecord(grid.getSelectionModel().getSelected());
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'mail',
		displayName : _('Unread Mail'),
		iconPath : 'plugins/folderwidgets/resources/images/mail.png',
		widgetConstructor : Zarafa.widgets.folderwidgets.MailWidget
	}));
});
