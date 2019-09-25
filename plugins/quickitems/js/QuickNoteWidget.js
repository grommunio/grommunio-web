Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickNoteWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a Sticky note quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickNoteWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * The Color CSS class which currently has been applied to the Text area.
	 * @property
	 * @type String
	 */
	currentColorCls : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg : {
				recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite : true
				}),
				layout : 'fit',
				items : [{
					xtype : 'form',
					ref : 'formPanel',
					layout : 'fit',
					items : [{
						xtype : 'textarea',
						ref : '../editorField',
						name : 'body',
						listeners: {
							change : this.onChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Save'),
				cls : 'zarafa-action',
				style: 'padding-bottom: 5px',
				handler : this.onSave,
				scope : this
			},{
				text : _('Discard'),
				style: 'padding-bottom: 5px',
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickNoteWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('note');
		var context = container.getContextByName('note');
		var model = context.getModel();

		return model.createRecord(folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : function(record, contentReset)
	{
		this.wrap.formPanel.getForm().loadRecord(record);

		if (contentReset || record.isModifiedSinceLastUpdate('icon_index')) {
			var iconIndex = record.get('icon_index');
			var textCls;

			switch (iconIndex) {
				case Zarafa.core.mapi.IconIndex['note_blue']:
					textCls = 'stickynote_dialog_blue';
					break;
				case Zarafa.core.mapi.IconIndex['note_green']:
					textCls = 'stickynote_dialog_green';
					break;
				case Zarafa.core.mapi.IconIndex['note_pink']:
					textCls= 'stickynote_dialog_pink';
					break;
				case Zarafa.core.mapi.IconIndex['note_yellow']:
				default:
					textCls = 'stickynote_dialog_yellow';
					break;
				case Zarafa.core.mapi.IconIndex['note_white']:
					textCls = 'stickynote_dialog_white';
					break;
			}

			this.wrap.editorField.removeClass(this.currentColorCls);
			this.currentColorCls = textCls;
			this.wrap.editorField.addClass(this.currentColorCls);
		}
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.record.generateSubject();
		record.endEdit();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quicknote',
		displayName : _('Quick Note'),
		widgetConstructor : Zarafa.widgets.quickitems.QuickNoteWidget
	}));
});
