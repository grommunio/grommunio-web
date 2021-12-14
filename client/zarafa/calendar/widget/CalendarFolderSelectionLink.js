Ext.namespace('Zarafa.calendar.widget');

/**
 * @class Zarafa.calendar.widget.CalendarFolderSelectionLink
 * @extends Ext.BoxComponent
 * @xtype zarafa.calendarfolderselectionlink
 *
 * This will show the currently selected {@link #folder} to the user, and allows
 * the user to select the desired folder to view appointments from.
 */
Zarafa.calendar.widget.CalendarFolderSelectionLink = Ext.extend(Ext.BoxComponent, {
	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	emptyText:_('Select one...'),

	/**
	 * The folder which was selected by the user
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 */
	folder: undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config,{
			xtype: 'zarafa.calendarfolderselectionlink',
			border: false,
			autoScroll:true,
			anchor: '100%',
			tpl: new Ext.XTemplate(
				'<div class="k-folder-link">' +
					'<tpl if="!Ext.isEmpty(values.display_name)">' +
						'&quot;{display_name:htmlEncode}&quot;' +
					'</tpl>' +
					'<tpl if="Ext.isEmpty(values.display_name)">' +
						'&quot;' + _('Unnamed folder') + '&quot;' +
					'</tpl>' +
				'</div>',
				{
					compiled: true
				}
			)
		});

		Zarafa.calendar.widget.CalendarFolderSelectionLink.superclass.constructor.call(this, config);
	},

	/**
	 * This function is called after the component has been rendered.
	 * This will update {@link Zarafa.widgets.folderwidgets.CalendarFolderSelectionLink} with selected folder
	 * and will register {@link #onClick} event handler.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.calendar.widget.CalendarFolderSelectionLink.superclass.afterRender.apply(this, arguments);

		this.update();
		this.mon(this.getEl(), 'click', this.onClick, this);
	},

	/**
	 * Called when user clicks on a {@link Zarafa.widgets.folderwidgets.CalendarFolderSelectionLink}
	 * It opens hierarchy folder selection dialog containing all calendar folders.
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} evt The mouse event
 	 * @protected
	 */
	onClick: function(dataView, index, node, evt)
	{
		var defaultCalendar = container.getHierarchyStore().getDefaultFolder('calendar');
		var folder = Ext.isEmpty(this.folder) ? defaultCalendar : this.folder;
		Zarafa.hierarchy.Actions.openFolderSelectionContent({
			folder: folder,
			hideTodoList: true,
			IPMFilter: 'IPF.Appointment',
			callback: this.update,
			scope: this,
			modal: true
		});
	},

	/**
	 * Update the contents of this dataview, this will apply the {@link #tpl} for
	 * the {@link #folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to show
	 */
	update: function(folder)
	{
		// Avoid 'folderupdate' for the first time when this component loads.
		if (folder) {
			this.folder = folder;
			this.fireEvent('folderupdate', folder);
		} else {
			folder = this.folder;
		}

 		var data = folder ? folder.data : { display_name: this.emptyText };
		Zarafa.calendar.widget.CalendarFolderSelectionLink.superclass.update.call(this, this.tpl.apply(data));
	}
});

Ext.reg('zarafa.calendarfolderselectionlink', Zarafa.calendar.widget.CalendarFolderSelectionLink);
