Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickContactWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a contact quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickContactWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * The parser object which will be used to parse and combine different parts of name, address, phone number.
	 * @property
	 * @type Zarafa.contact.data.ContactDetailsParser
	 */
	contactParser : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!config.contactParser) {
			var parserType = container.getSharedComponent(Zarafa.core.data.SharedComponentType['contact.detailsparser']);
			if (parserType) {
				config.contactParser = new parserType();
			}
		}

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
						height: 30,
						items : [{
							xtype : 'textfield',
							flex : 1,
							name : 'display_name',
							emptyText : _('Full Name') + ':',
							ref : '../../fullnameField',
							listeners : {
								scope : this,
								change : this.onFullNameChange
							}
						}]
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						height: 33,
						items : [{
							xtype : 'splitbutton',
							width: 100,
							text : _('Mobile') + ':',
							handler : this.onPhoneButtonClick,
							scope: this,
							menu : this.initPhoneButtonMenu('cellular_telephone_number')
						},{
							xtype : 'textfield',
							ref : '../../telephoneField',
							flex: 1,
							name : 'telephone_number',
							property : 'cellular_telephone_number',
							listeners : {
								scope : this,
								change : this.onTelephoneNumberChange
							}
						}]
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items : [{
							xtype : 'textfield',
							flex: 1,
							emptyText: _('Email') + ':',
							ref : '../../mailAddressField',
							name : 'email_address_1',
							height: 30,
							listeners : {
								scope : this,
								change : this.onChange
							}
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName : 'html_body',
						plaintextName : 'body',
						hideLabel: true,
						flex: 1,
						useHtml : false,
						defaultValue: '',
						listeners: {
							change : this.onBodyChange,
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

		Zarafa.widgets.quickitems.QuickContactWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize button menu config object for the telephone buttons.
	 * group config option is used to group all checkbox items into a single select radio button group
	 * and its name should be unique across all instances of menu button
	 * @param {String} property will be used to show default selection
	 * @private
	 */
	initPhoneButtonMenu : function(property)
	{
		return {
			xtype : 'menu',
			listeners : {
				click : this.onMenuItemSelection,
				scope : this
			},
			defaults : {
				xtype : 'menucheckitem',
				group : 'phone_number'
			},
			items : [{
				text : _('Business'),
				property : 'business_telephone_number',
				checked : property == 'business_telephone_number'
			},{
				text : _('Company'),
				property : 'company_telephone_number',
				checked : property == 'company_telephone_number'
			},{
				text : _('Home'),
				property : 'home_telephone_number',
				checked : property == 'home_telephone_number'
			},{
				text : _('Mobile'),
				property : 'cellular_telephone_number',
				checked : property == 'cellular_telephone_number'
			},{
				text : _('Other'),
				property : 'other_telephone_number',
				checked : property == 'other_telephone_number'
			}]
		};
	},

	/**
	 * Function will be called whenever selection of address or telephone number
	 * will be changed, this function will change text of button and also change value
	 * of the corresponding textfield.
	 * @param {Ext.menu.Menu} Menu button manu
	 * @param {Ext.menu.CheckItem} CheckItem menu item that is selected
	 * @param {Ext.EventObject} EventObjectt event object
	 * @private
	 */
	onMenuItemSelection : function(menu, menuItem, eventObj)
	{
		if (!Ext.isEmpty(menuItem)) {
			var compositeField = menu.findParentByType('zarafa.compositefield');
			var buttonField = compositeField.findByType('splitbutton')[0];
			var textField = compositeField.findByType('textfield')[0];

			if(!Ext.isEmpty(buttonField) && !Ext.isEmpty(textField)) {
				// update text of button
				buttonField.setText(menuItem.initialConfig.text);

				// update corresponding textfield with new value
				textField.setValue(this.record.get(menuItem.property));
				textField.property = menuItem.property;
			}
		}
	},

	/**
	 * Function that will be called when one of the phone buttons is clicked,
	 * this function is used as wrapper to discard arguments passed with the handler
	 * and it will call function that will open the {@link Zarafa.contact.dialogs.ContactPhoneContentPanel ContactPhoneContentPanel}.
	 * @param {Ext.SplitButton} buttonEl split button element which was clicked.
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 * @private
	 */
	onPhoneButtonClick : function(buttonEl, eventObj)
	{
		this.showDetailedPhoneContent(buttonEl.ownerCt.findByType('textfield')[0].property);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
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
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onTelephoneNumberChange : function(field, value)
	{
		this.wrap.record.set(field.property, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onFullNameChange : function(field, newValue)
	{
		var parsedData = this.contactParser.parseInfo('name', newValue);

		// sync properties
		this.wrap.record.set('display_name', newValue);
		this.wrap.record.set('display_name_prefix', parsedData['display_name_prefix']);
		this.wrap.record.set('given_name', parsedData['given_name']);
		this.wrap.record.set('middle_name', parsedData['middle_name']);
		this.wrap.record.set('surname', parsedData['surname']);
		this.wrap.record.set('generation', parsedData['generation']);

		// check for incomplete data and show detailed name dialog
		if(parsedData['incomplete_info'] === true) {
			var settingValue = container.getSettingsModel().get('zarafa/v1/contexts/contact/show_name_dialog');
			if(settingValue == true && !Ext.isEmpty(newValue)) {
				// show detailed dialog for full name
				this.showDetailedNameContent(parsedData);
			}
		}
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
	 * Function will open detailed name dialog to enter incomplete information
	 * @param {Object} parsedData if string is already parsed into object then we can pass
	 * that object here in componentConfig so parsing will not be done twice
	 * @private
	 */
	showDetailedNameContent : function(parsedData)
	{
		Zarafa.contact.Actions.openDetailedNameContent(this.wrap.record, { parser : this.contactParser, parsedData : parsedData });
	},

	/**
	 * Function will open detailed phone dialog to enter incomplete information
	 * @param {String} property property that will be modified
	 * @private
	 */
	showDetailedPhoneContent : function(property)
	{
		Zarafa.contact.Actions.openDetailedPhoneContent(this.wrap.record, { parser : this.contactParser, property : property });
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('contact');
		var context = container.getContextByName('contact');
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
		this.wrap.telephoneField.setValue(record.get(this.wrap.telephoneField.property));
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
		this.onFullNameChange(this.wrap.fullnameField, this.wrap.fullnameField.getValue());

		record.updateSubject();
		record.updateAddressbookProps();

		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Save' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#saveRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSave : function()
	{
		this.wrap.saveRecord();
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
		name : 'quickcontact',
		displayName : _('Quick Contact'),
		widgetConstructor : Zarafa.widgets.quickitems.QuickContactWidget
	}));
});
