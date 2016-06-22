Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactDetailTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.contactdetailtab
 *
 * This class is used to create layout of details tab panel.
 */
Zarafa.contact.dialogs.ContactDetailTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.contactdetailtab',
			cls : 'zarafa-contactdetailtab',
			title : _('Details'),
			autoScroll : true,
			labelWidth : 120,
			labelAlign : 'left',
			defaults : {
				columnWidth : 0.5,
				height : 120,
				border : false,
				header : false,
				xtype : 'fieldset'
			},
			items : [
				this.createOfficeFieldset(),
				this.createOfficeFieldset2(),
				this.createNameFieldset(),
				this.createDateFieldset()
			]
		});

		Zarafa.contact.dialogs.ContactDetailTab.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the office fieldset for details tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createOfficeFieldset : function()
	{
		return {
			defaultType : 'textfield',
			defaults : {
				anchor : '100%'
			},
			items : [{
				fieldLabel : _('Department'),
				name : 'department_name',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				fieldLabel : _('Office location'),
				name : 'office_location',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				fieldLabel : _('Profession'),
				name : 'profession',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}]
		};
	},

	/**
	 * Creates the office fieldset for details tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createOfficeFieldset2 : function()
	{
		return {
			defaultType : 'textfield',
			defaults : {
				anchor : '100%'
			},
			items : [{
				fieldLabel : _('Manager\'s name'),
				name : 'manager_name',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				fieldLabel : _('Assistant\'s name'),
				name : 'assistant',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}]
		};
	},

	/**
	 * Creates the name fieldset for details tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createNameFieldset : function()
	{
		var tplString = '<tpl for="."><div class="x-combo-list-item">{displayText:htmlEncodeDefaultValue(Zarafa.contact.data.config.NBSP)}</div></tpl>';

		return {
			defaultType : 'textfield',
			defaults : {
				anchor : '100%'
			},
			items : [{
				fieldLabel : _('Nickname'),
				name : 'nickname',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				xtype : 'combo',
				fieldLabel : _('Title'),
				editable : false,
				name : 'display_name_prefix',
				mode : 'local',
				triggerAction : 'all',
				store : {
					xtype : 'arraystore',
					fields : ['displayText'],
					data : Zarafa.contact.data.config.Prefix
				},
				tpl : new Ext.XTemplate(tplString, {
					compiled : true		// compile immediately
				}),
				displayField : 'displayText',
				valueField : 'displayText',
				listeners : {
					scope : this,
					change : this.onNameChange
				}
			}, {
				xtype : 'combo',
				fieldLabel : _('Suffix'),
				editable : false,
				name : 'generation',
				mode : 'local',
				triggerAction : 'all',
				store : {
					xtype : 'arraystore',
					fields : ['displayText'],
					data : Zarafa.contact.data.config.Suffix
				},
				tpl : new Ext.XTemplate(tplString, {
					compiled : true		// compile immediately
				}),
				displayField : 'displayText',
				valueField : 'displayText',
				listeners : {
					scope : this,
					change : this.onNameChange
				}
			}]
		};
	},

	/**
	 * Creates the date fieldset for details tab of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createDateFieldset : function()
	{
		return {
			defaultType : 'textfield',
			defaults : {
				anchor : '100%'
			},
			items : [{
				fieldLabel : _('Spouse/Partner'),
				name : 'spouse_name',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				xtype : 'datefield',
				fieldLabel : _('Birthday'),
				ref : '../birthdayField',
				name : 'birthday',
				// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
				format : ('d/m/Y'),
				listeners : {
					scope : this,
					change : this.onDateChange
				}
			}, {
				xtype : 'datefield',
				fieldLabel : _('Anniversary'),
				ref : '../anniversaryField',
				name : 'wedding_anniversary',
				// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
				format : ('d/m/Y'),
				listeners : {
					scope : this,
					change : this.onDateChange
				}
			}]
		};
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (Ext.isEmpty(record)) {
			return;
		}

		this.record = record;

		this.getForm().loadRecord(record);
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		record.beginEdit();

		// Update birthday properties, You have 3 different states for the values:
		// 1) null (usually comes from the record, when the date wasn't provided)
		// 2) empty string (usually comes from the UI when no date was typed in)
		// 3) timestamp
		// To check if it is different, we must check if either the old value, or
		// new value is a date (while the other isn't), or if they are both dates
		// and the dates refer to a different time.
		var newBirthDay = this.birthdayField.getValue();
		var oldBirthDay = record.get(this.birthdayField.getName());
		if (Ext.isDate(newBirthDay) !== Ext.isDate(oldBirthDay) || (Ext.isDate(newBirthDay) && newBirthDay !== oldBirthDay)) {
			this.onDateChange(this.birthdayField, newBirthDay, oldBirthDay);
		}

		// Update anniversary properties
		// Same logic for values applies here as for the birthday described above.
		var newAnniversary = this.anniversaryField.getValue();
		var oldAnniversary = record.get(this.anniversaryField.getName());
		if (Ext.isDate(newAnniversary) !== Ext.isDate(oldAnniversary) || (Ext.isDate(newAnniversary) && newAnniversary !== oldAnniversary)) {
			this.onDateChange(this.anniversaryField, newAnniversary, oldAnniversary);
		}

		// Load all properties from the UI
		this.getForm().updateRecord(record);

		// Regenerate the display name
		if (record.isModifiedSinceLastUpdate('display_name_prefix') ||
		    record.isModifiedSinceLastUpdate('given_name') ||
		    record.isModifiedSinceLastUpdate('middle_name') ||
		    record.isModifiedSinceLastUpdate('surname') ||
		    record.isModifiedSinceLastUpdate('generation')) {
			this.generateDisplayName();
		}

		record.endEdit();
	},

	/**
	 * Event handler for the {@link Ext.form.Field fields} which are fired
	 * when the contents of the field has been changed. This will apply
	 * the value directly into the record.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.beginEdit();
			this.record.set(field.getName(), newValue);
			this.record.endEdit();
		}
	},

	/**
	 * Event handler for the {@link Ext.form.ComboBox comboboxes} for configuring
	 * the prefix or postfix of the display name of the user. This will set some
	 * additional properties (like regeneration the display_name).
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {String} newValue The new value
	 * @param {String} oldValue THe original value
	 * @private
	 */
	onNameChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.beginEdit();

			this.record.set(field.getName(), newValue);
			this.generateDisplayName();

			this.record.endEdit();
		}
	},

	/**
	 * Event handler for the {@link Ext.form.DateField datefields} for configuring the
	 * birthday and anniversary. This will set some additional properties to ensure the
	 * corresponding calendar appointment will be updated as well.
	 * @param {Ext.form.DateField} field The field which fired the event
	 * @param {Date} newValue The new date
	 * @param {Data} oldValue The original date
	 * @private
	 */
	onDateChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.beginEdit();

			if (Ext.isEmpty(newValue)) {
				this.record.set(field.getName(), null);
			} else {
				this.record.set(field.getName(), newValue);
			}

			// send entryid to server if anything is changed
			if (field.getName() == 'birthday') {
				this.record.set('birthday_eventid', this.record.get('birthday_eventid'), true);
			} else {
				this.record.set('anniversary_eventid', this.record.get('anniversary_eventid'), true);
			}

			this.record.set('subject', this.record.get('subject'), true);
			this.record.updateTimezoneInformation();

			this.record.endEdit();
		}
	},

	/**
	 * Regenerate the display_name of the user. This should be called when
	 * one of the name properties of the user has been changed.
	 * @private
	 */
	generateDisplayName : function()
	{
		var record = this.record;

		// Regenerate display name value
		var nameValues = {
			'display_name_prefix' : record.get('display_name_prefix'),
			'given_name' : record.get('given_name'),
			'middle_name' : record.get('middle_name'),
			'surname' : record.get('surname'),
			'generation' : record.get('generation')
		};

		// update record
		record.set('display_name', this.getContactParser().combineInfo('name', nameValues));
	},

	/**
	 * Function will return {@link Zarafa.contact.data.ContactDetailsParser ContactDetailsParser} that is a parser object to parse contact details
	 * @return {Zarafa.contact.data.ContactDetailsParser} contact details parser
	 * @private
	 */
	getContactParser : function()
	{
		return this.dialog.contactParser;
	}
});

Ext.reg('zarafa.contactdetailtab', Zarafa.contact.dialogs.ContactDetailTab);
