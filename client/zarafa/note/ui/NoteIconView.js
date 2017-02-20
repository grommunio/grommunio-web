Ext.namespace('Zarafa.note.ui');

/**
 * @class Zarafa.note.ui.NoteIconView
 * @extends Zarafa.common.ui.DraggableDataView
 * @xtype zarafa.noteiconview
 */
Zarafa.note.ui.NoteIconView = Ext.extend(Zarafa.common.ui.DraggableDataView, {
	/**
	 * @cfg {Zarafa.note.NoteContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.note.NoteContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Zarafa.note.NoteContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {object} configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.icondragselectorplugin');

		Ext.applyIf(config, {
			xtype		:'zarafa.noteiconview',
			id : 'note-iconview',
			cls : 'zarafa-note-iconview',
			loadingText : _('Loading notes') + '...',
			deferEmptyText: false,
			emptyText	: '<div class="emptytext">' + _('There are no items to show in this list') + '</div>',
			overClass	:'zarafa-note-iconview-over',
			tpl			: this.initTemplate(),
			multiSelect	: true,
			selectedClass:'zarafa-note-iconview-selected',
			itemSelector:'div.zarafa-note-iconview-thumb',
			enableDrag : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.note.ui.NoteIconView.superclass.constructor.call(this, config);

		this.initEvents();
	},

	/*
	 * Initialize html template by seting color icon and note subject
	 * @private
	 */
	initTemplate : function()
	{
		return new Ext.XTemplate(
			'<div style="height: 100%; width: 100%; overflow: auto;">',
				'<tpl for=".">',
					'<div class="zarafa-note-iconview-thumb">',
						'<div class="zarafa-note-iconview-icon {icon_index:this.getTheme}"></div>',
						'<div class="zarafa-note-iconview-subject">{subject:this.encodeSubject}</div>',
					'</div>',
				'</tpl>',
			'</div>',
			{
				getTheme : function(iconIndex)
				{
					switch (iconIndex) {
						case 768:
							return 'icon_note_blue_large';
						case 769:
							return 'icon_note_green_large';
						case 770:
							return 'icon_note_pink_large';
						case 771:
							return 'icon_note_yellow_large';
						case 772:
							return 'icon_note_white_large';
						default:
							return 'icon_note_yellow_large';
					}
				},
				encodeSubject : function(subject)
				{
					// the subject of notes is already 'ellipsed' but since the 2015 redesign
					// this subject is too large to fit (because of the increased font-size)
					// so we make it a little shorter here.
					return Ext.util.Format.ellipsis(Ext.util.Format.htmlEncode(subject), 20);
				}
			}
		);
	},

	/**
	 * Returns {@link Zarafa.note.ui.NoteMainPanel NoteMainPanel} object which instantiated all the views
	 * @return {Zarafa.note.ui.NoteMainPanel} note main panel
	 */
	getMainPanel : function()
	{
		return this.ownerCt;
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents : function()
	{
		this.on({
			'contextmenu': this.onNoteIconContextMenu,
			'dblclick': this.onIconDblClick,
			'selectionchange': this.onSelectionChange,
			scope : this
		});
	},

	/*
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.DataView} dataview dataview object
	 * @param {Number} rowIndex	index of row
	 * @param {node} target html node
	 * @param {Ext.event} eventObj eventObj object of the event
	 * @private
	 */
	onNoteIconContextMenu: function(dataview, index, node, eventObj)
	{
		// check row is already selected or not, if its not selected then select it first
		if (!dataview.isSelected(node)) {
			dataview.select(node);
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(dataview.getSelectedRecords(), { position : eventObj.getXY() });
	},

	/**
	 * Display open dialog on mouse double click
	 * @param {object} dataview object
	 * @param {Number} integer index number of selected record
	 * @param {node} target html node
	 * @param {object} event object
	 * @private
	 */
	onIconDblClick:function(dataview,index,node,event)
	{
		Zarafa.note.Actions.openNoteContent(this.getStore().getAt(index));
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.note.ui.NoteIconView NoteIconView}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.note.NoteContextModel contextmodel} about the change.
	 *
	 * @param {Zarafa.note.ui.NoteIconView} dataView The view object.
	 * @param {HTMLElement[]} selection Array of selected nodes.
	 * @private
	 */
	onSelectionChange : function(dataView, selections)
	{
		this.model.setSelectedRecords(dataView.getSelectedRecords());
	}
});
//register xtype noteiconview
Ext.reg('zarafa.noteiconview',Zarafa.note.ui.NoteIconView);
