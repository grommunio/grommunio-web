Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickMailWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a mail quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickMailWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * @cfg {Boolean} Enable the HTML editor
	 */
	useHtml : false,

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
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border : false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items : [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						autoHeight: true,
						items: [{
							xtype: 'label',
							width: 100,
							text: _('To') + ':'
						},{
							xtype: 'zarafa.recipientfield',
							ref: '../toRecipientField',
							flex: 1,
							height: 30,
							defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO
						}]			
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'label',
							width: 100,
							text: _('Subject') + ':'
						},{
							xtype: 'textfield',
							flex: 1,
							name: 'subject',
							value: undefined,
							listeners: {
								change : this.onChange,
								scope : this
							}
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName : 'html_body',
						plaintextName : 'body',
						hideLabel: true,
						flex: 1,
						useHtml : config.useHtml,
						defaultValue: '',
						listeners: {
							change : this.onBodyChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Send'),
				handler : this.onSend,
				scope : this
			},{
				text : _('Discard'),
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickMailWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.wrap.record.set(field.name, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange : function(field, newValue, oldValue)
	{
		this.wrap.record.beginEdit();
		if (field instanceof Ext.form.HtmlEditor) {
			this.wrap.record.set('isHTML', true);
		} else {
			this.wrap.record.set('isHTML', false);
		}
		this.wrap.record.set(field.name, newValue);
		this.wrap.record.endEdit();
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('drafts');
		var context = container.getContextByName('mail');
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
		if (contentReset) {
			this.wrap.formPanel.toRecipientField.setRecipientStore(record.getSubStore('recipients'));
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
		this.onBodyChange(this.wrap.editorField, this.wrap.editorField.getValue());
		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Send' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#sendRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSend : function()
	{
		this.wrap.sendRecord();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Disacrd' button.
	 * This will call {@link #reset} to clear the contents.
	 * @private
	 */
	onDiscard : function()
	{
		this.reset();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quickmail',
		displayName : _('Quick Mail'),
		iconPath : 'plugins/quickitems/resources/images/quickmail.png',
		widgetConstructor : Zarafa.widgets.quickitems.QuickMailWidget
	}));
});
