Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactAddressPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.contactaddresspanel
 */
Zarafa.contact.dialogs.ContactAddressPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Zarafa.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser : null,
	/**
	 * @cfg {String} property property that will be modified
	 */
	property : '',
	/**
	 * @cfg {Object} parsedData if data is already parsed then it can be passed here,
	 * so no need to prase same data again
	 */
	parsedData : null,
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.contactaddresspanel',
			border: false,
			frame : true,
			padding : 5,
			items: this.createFormItems(config.property)
		});

		Zarafa.contact.dialogs.ContactAddressPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the form in which the address specifications can be written
	 * @param {String} propertyPrefix prefix of the properties that should be used to get values from record.
	 * @return {Object} Configuration object for the form
	 */
	createFormItems : function(propertyPrefix)
	{
		return [{
			xtype : 'textarea',
			anchor : '100%',
			fieldLabel : _('Street'),
			name : propertyPrefix + '_street'
		},{
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('City'),
			name : propertyPrefix + '_city'
		},{
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('State/Province'),
			name : propertyPrefix + '_state'
		},{
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('Zip/Postal code'),
			name : propertyPrefix + '_postal_code'
		},{
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('Country/Region'),
			name : propertyPrefix + '_country'
		},{
			xtype : 'checkbox',
			boxLabel : _('Show this again when address is incomplete or unclear.'),
			ref : 'settingCheckField',
			hideLabel : true,
			checked : container.getSettingsModel().get('zarafa/v1/contexts/contact/show_address_dialog')
		}];
	},

	/**
	 * Load record into form
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (!Ext.isDefined(record)) {
			return;
		}

		// If no parsed Data is provided, we must check if the parsed data can be found in the record
		var convertToProps = true;
		if (Ext.isEmpty(this.parsedData)) {
			var keys = this.getForm().getValues();
			for (var key in keys) {
				if (!Ext.isEmpty(record.get(key))) {
					this.parsedData = Ext.apply(this.parsedData || {}, record.data);
					// We don't need to convert to props
					convertToProps = false;
					break;
				}
			}

			// If the parsed data was not found in the record, check if the parseable string
			// can be found in the record instead.
			if (convertToProps && !Ext.isEmpty(record.get(this.property))) {
				var newParsedData = this.parser.parseInfo('address', record.get(this.property));
				this.parsedData = Ext.apply(this.parsedData || {}, newParsedData);
			}
		}


		// If the parsedData was constructed using the parser, apply property as prefix to every key in
		// parsed data so form will be able to add data in fields
		if (convertToProps) {
			Ext.iterate(this.parsedData, function(key, value) {
				this.parsedData[this.property + '_' + key] = value;
				delete this.parsedData[key];
			}, this);
		}

		var form = this.getForm();
		form.setValues(this.parsedData);

		// remove data after it has been put in the form fields, so consecutive requests
		// will use data from record
		this.parsedData = null;
	},

	/**
	 * Update record from form
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		var form = this.getForm();

		if (this.settingCheckField.isDirty()) {
			container.getSettingsModel().set('zarafa/v1/contexts/contact/show_address_dialog', this.settingCheckField.getValue());
		}

		record.beginEdit();

		if (Ext.isDefined(this.parser)) {
			var formValues = form.getValues();

			// remove property as prefix from values so parser can combine data and set it in record
			Ext.iterate(formValues, function(key, value) {
				formValues[key.substr(this.property.length + 1)] = value;
				delete formValues[key];
			}, this);

			record.set(this.property, this.parser.combineInfo('address', formValues));
		}

		form.updateRecord(record);

		record.endEdit();
	}
});

Ext.reg('zarafa.contactaddresspanel', Zarafa.contact.dialogs.ContactAddressPanel);
