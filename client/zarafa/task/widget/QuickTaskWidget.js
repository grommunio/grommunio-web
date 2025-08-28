Ext.namespace('Zarafa.task.widgets');

/**
 * @class Zarafa.task.widgets.QuickTaskWidget
 * @extends Zarafa.core.ui.widget.AbstractQuickItemWidget
 *
 * Widget for creating a task quickly with a minimum set of
 * input fields
 */
Zarafa.task.widgets.QuickTaskWidget = Ext.extend(Zarafa.core.ui.widget.AbstractQuickItemWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg: {
				recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite: true
				}),
				layout: 'fit',
				items: [{
					xtype: 'form',
					ref: '../formPanel',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border: false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items: [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'textfield',
							flex: 1,
							name: 'subject',
							emptyText: _('Subject') + ':',
							listeners: {
								change: this.onChange,
								scope: this
							}
						}]
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
						},{
							xtype: 'datefield',
							ref: '../dueDateField',
							emptyText: _('End date') + ': ' + _('none'),
							flex: 1,
							name: 'commonend',
							utcname: 'duedate',
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
							format: _('d/m/Y'),
							minValue: new Date(),
							listeners: {
								change: this.onDueDateChange,
								scope: this
							}
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: 'editorField',
						htmlName: 'html_body',
						plaintextName: 'body',
						hideLabel: true,
						flex: 1,
						useHtml: true,
						defaultValue: '',
						listeners: {
							change: this.onBodyChange,
							scope: this
						}
					}]
				}]
			},
			buttons: [{
				text: _('Save'),
				cls: 'zarafa-action',
				style: 'padding-bottom: 5px',
				handler: this.onSave,
				scope: this
			},{
				text: _('Discard'),
				style: 'padding-bottom: 5px',
				handler: this.onDiscard,
				scope: this
			}]
		});

		Zarafa.task.widgets.QuickTaskWidget.superclass.constructor.call(this, config);
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
	onDueDateChange: function(field, newValue, oldValue)
	{
		if (Ext.isDate(newValue)) {
			this.record.set(field.name, newValue.clone());
			this.record.set(field.utcname, newValue.fromUTC());
		} else {
			this.record.set(field.name, null);
			this.record.set(field.utcname, null);
		}
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord: function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('task');
		var context = container.getContextByName('task');
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
	update: function(record, contentReset)
	{
		this.formPanel.getForm().loadRecord(record);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord: function(record)
	{
		record.beginEdit();
		this.formPanel.getForm().updateRecord(record);
		this.onDueDateChange(this.formPanel.dueDateField, this.formPanel.dueDateField.getValue());
		this.onBodyChange(this.formPanel.editorField, this.formPanel.editorField.getValue());
		record.endEdit();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name: 'quicktask',
		iconCls: 'icon_widget_new_task',
		displayName: _('Quick Task'),
		widgetConstructor: Zarafa.task.widgets.QuickTaskWidget
	}));
});
