Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactPhonePanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.contactphonepanel
 */
Zarafa.contact.dialogs.ContactPhonePanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Zarafa.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser : null,
	/**
	 * @cfg {Zarafa.contact.dialogs.parsedNameRecord} parsedData if data is already parsed then it can be passed here,
	 * so no need to prase same data again
	 */
	parsedData : null,
	/**
	 * @cfg {String} property property that will be modified
	 */
	property : null,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.contactphonepanel',
			border : false,
			frame : true,
			padding : 5,
			items: this.createFormItems()
		});

		Zarafa.contact.dialogs.ContactPhonePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the form in which the phone specifications can be written
	 * @return {Object} Configuration object for the form
	 */
	createFormItems : function()
	{
		return [{
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('Country/Region code'),
			name : 'country_code'
		}, {
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('City/Area code'),
			name : 'city_code'
		}, {
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('Local number'),
			name : 'local_number'
		}, {
			xtype : 'textfield',
			anchor : '100%',
			fieldLabel : _('Extension'),
			name : 'extension'
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

		if (Ext.isEmpty(this.parsedData) && !Ext.isEmpty(record.get(this.property))) {
			var newParsedData = this.parser.parseInfo('phone', record.get(this.property));
			this.parsedData = Ext.apply(this.parsedData || {}, newParsedData);
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

		record.beginEdit();

		/*
		 * set combined property first otherwise form.updateRecord will fire update event
		 * which will overwrite old values on new values.
		 */
		if (Ext.isDefined(this.parser)) {
			record.set(this.property, this.parser.combineInfo('phone', form.getValues()));
		}

		form.updateRecord(record);

		record.endEdit();
	}
});

Ext.reg('zarafa.contactphonepanel', Zarafa.contact.dialogs.ContactPhonePanel);
