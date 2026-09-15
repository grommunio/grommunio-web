Ext.namespace('Grommunio.note.ui');

/**
 * @class Grommunio.note.ui.NoteIconView
 * @extends Grommunio.common.ui.DraggableDataView
 * @xtype grommunio.noteiconview
 */
Grommunio.note.ui.NoteIconView = Ext.extend(Grommunio.common.ui.DraggableDataView, {
	/**
	 * @cfg {Grommunio.note.NoteContext} context The context to which this panel belongs
	 */
	context: undefined,

	/**
	 * The {@link Grommunio.note.NoteContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Grommunio.note.NoteContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {object} configuration object
	 */
	constructor: function(config)
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
		config.plugins.push('grommunio.icondragselectorplugin');

		Ext.applyIf(config, {
			xtype		:'grommunio.noteiconview',
			id: 'note-iconview',
			cls: 'grommunio-note-iconview',
			loadingText: _('Loading notes') + '...',
			deferEmptyText: false,
			emptyText	: '<div class="emptytext">' + _('There are no items to show in this list') + '</div>',
			overClass	:'grommunio-note-iconview-over',
			tpl			: this.initTemplate(),
			multiSelect	: true,
			selectedClass:'grommunio-note-iconview-selected',
			itemSelector:'div.grommunio-note-iconview-thumb',
			enableDrag: true,
			ddGroup: 'dd.mapiitem'
		});

		Grommunio.note.ui.NoteIconView.superclass.constructor.call(this, config);

		this.initEvents();
	},

	/*
	 * Initialize html template by setting color icon and note subject
	 * @private
	 */
	initTemplate: function()
	{
		return new Ext.XTemplate(
			'<div style="height: 100%; width: 100%; overflow: auto;">',
				'<tpl for=".">',
					'<div class="grommunio-note-iconview-thumb">',
						'<div class="grommunio-note-iconview-icon {icon_index:this.getTheme}"></div>',
						'<div class="grommunio-note-iconview-subject">{subject:this.encodeSubject}</div>',
					'</div>',
				'</tpl>',
			'</div>',
			{
				getTheme: function(iconIndex)
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
				encodeSubject: function(subject)
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
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents: function()
	{
		this.on({
			'contextmenu': this.onNodeContextMenu,
			'dblclick': this.onIconDblClick,
			'selectionchange': this.onSelectionChange,
			'afterrender': this.onAfterRender,
			scope: this
		});

	},

	/**
	 * Event handler called when note icon view rendered properly.
	 */
	onAfterRender: function()
	{
		this.getEl().on({
			'mouseenter': this.onMouseEnter,
			'mouseleave': this.onMouseLeave,
			scope: this
		});
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
		Grommunio.note.Actions.openNoteContent(this.getStore().getAt(index));
	},

	/**
	 * Event handler which is triggered when the {@link Grommunio.note.ui.NoteIconView NoteIconView}
	 * {@link Grommunio.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Grommunio.note.NoteContextModel contextmodel} about the change.
	 *
	 * @param {Grommunio.note.ui.NoteIconView} dataView The view object.
	 * @param {HTMLElement[]} selection Array of selected nodes.
	 * @private
	 */
	onSelectionChange: function(dataView, selections)
	{
		this.model.setSelectedRecords(dataView.getSelectedRecords());
	}
});
//register xtype noteiconview
Ext.reg('grommunio.noteiconview',Grommunio.note.ui.NoteIconView);
