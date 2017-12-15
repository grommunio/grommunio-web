/*
 * #dependsFile client/zarafa/contact/data/ContactConfig.js
 */
Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.dialogs.ContactGeneralTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.contactgeneraltab
 *
 * This class is used to create layout of general tab panel.
 */
Zarafa.contact.dialogs.ContactGeneralTab = Ext.extend(Ext.form.FormPanel, {

	/**
	 * If contact has photo then this is set to true, false otherwise.
	 * it is used to navigate single click, double click, and context menu(right click) events.
	 * if hasContactPhoto is false it means contact has no contact picture and
	 * it should listen single click event. else it will listen double click 
	 * and context menu events.
	 * @property
	 * @type Boolean
	 */
	hasContactPhoto : false,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		// make sure it is first applied in the config before used
		Ext.applyIf(config, {
			labelWidth : 110,
			labelAlign : 'left'
		});

		Ext.applyIf(config, {
			xtype : 'zarafa.contactgeneraltab',
			cls : 'zarafa-contactgeneraltab',
			title : _('General'),
			autoScroll : true,
			border : false,
			layoutConfig: {
				columns: 2
			},
			defaults : {
				columnWidth : 0.5,
				border : false,
				xtype : 'fieldset'
			},
			items : [
				this.createNameFieldset(config),
				this.createPhotoFieldset(config),
				this.createClear(),
				this.createPhoneFieldset(config),
				this.createEmailFieldset(config),
				this.createClear(),
				this.createAddressFieldset(config),
				this.createAdditionalFieldset(config),
				this.createClear(),
				this.createAttachmentFieldset(config)
			]
		});

		Zarafa.contact.dialogs.ContactGeneralTab.superclass.constructor.call(this, config);
	},
	
	createClear : function()
	{
		return {
			xtype: 'panel',
			cls : 'zarafa-clear',
			columnWidth : 1
		};
	},

	/**
	 * Creates the name fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createNameFieldset : function(config)
	{
		return {
			title : _('Name'),
			defaultType : 'zarafa.compositefield',
			defaults : {
				anchor : '100%'
			},
			items : [{
				hideLabel : true,
				items : [{
					xtype : 'button',
					width : config.labelWidth-1,
					text : _('Full Name') + ':',
					listeners : {
						scope : this,
						click : function() {
							// use wrapper function to discard arguments passed with click handler
							this.showDetailedNameContent();
						}
					}
				},{
					xtype : 'textfield',
					flex : 1,
					name : 'display_name',
					listeners : {
						scope : this,
						change : this.onDisplayNameChange
					}
				}]
			}, {
				xtype : 'textfield',
				flex : 1,
				name : 'company_name',
				fieldLabel : _('Company'),
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				xtype : 'textfield',
				flex : 1,
				name : 'title',
				fieldLabel : _('Job Title'),
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				xtype : 'combo',
				flex : 1,
				name : 'fileas',
				fieldLabel : _('File as'),
				ref : '../fileAsField',
				editable : false,
				mode : 'local',
				triggerAction : 'all',
				lazyInit: false,
				store : {
					xtype : 'arraystore',
					fields : ['displayText'],
					data : []
				},
				displayField : 'displayText',
				valueField : 'displayText',
				listeners : {
					scope : this,
					change : this.onFileasChange
				}
			}]
		};
	},

	/**
	 * Creates the photo fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createPhotoFieldset : function(config)
	{
		return {
			title : _('Photo'),
			layout : {
				type : 'hbox'
			},
			items : {
				xtype : 'box',
				cls : 'contact_photo_box default_contact_photo',
				ctCls: 'contact_photo_box_ct',
				autoEl : {
					tag : 'img',
					src : Ext.BLANK_IMAGE_URL
				},
				ref : '../contactPhotoBox',
				listeners : {
					afterrender : this.onAfterRender,
					scope : this
				}
			}
		};
	},

	/**
	 * Creates the phone fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createPhoneFieldset : function(config)
	{
		return {
			title : _('Phone Numbers'),
			defaultType : 'zarafa.compositefield',
			defaults : {
				hideLabel : true,
				anchor : '100%'
			},
			items : [{
				items : [{
					xtype : 'splitbutton',
					width : config.labelWidth-1,
					text : _('Business') + ':',
					handler : this.handlePhoneButtonClick,
					scope : this,
					menu : this.initPhoneButtonMenu('message_phonenumber_1', 'business_telephone_number')
				},{
					xtype : 'textfield',
					flex: 1,
					ref : "../../phone1",
					name : 'business_telephone_number',
					listeners : {
						scope : this,
						change : this.onFieldChange
					}
				}]
			}, {
				items : [{
					xtype : 'splitbutton',
					width: config.labelWidth-1,
					text : _('Home') + ':',
					handler : this.handlePhoneButtonClick,
					scope : this,
					menu : this.initPhoneButtonMenu('message_phonenumber_2', 'home_telephone_number')
				},{
					xtype : 'textfield',
					flex: 1,
					name : 'home_telephone_number',
					ref : "../../phone2",
					listeners : {
						scope : this,
						change : this.onFieldChange
					}
				}]
			}, {
				items : [{
					xtype : 'splitbutton',
					width: config.labelWidth-1,
					text : _('Business Fax') + ':',
					handler : this.handlePhoneButtonClick,
					scope : this,
					menu : this.initPhoneButtonMenu('message_phonenumber_3', 'business_fax_number')
				},{
					xtype : 'textfield',
					flex: 1,
					name : 'business_fax_number',
					ref : "../../phone3",
					listeners : {
						scope : this,
						change : this.onFieldChange
					}
				}]
			}, {
				items : [{
					xtype : 'splitbutton',
					width: config.labelWidth-1,
					text : _('Mobile') + ':',
					handler : this.handlePhoneButtonClick,
					scope : this,
					menu : this.initPhoneButtonMenu('message_phonenumber_4', 'cellular_telephone_number')
				},{
					xtype : 'textfield',
					flex: 1,
					name : 'cellular_telephone_number',
					ref : "../../phone4",
					listeners : {
						scope : this,
						change : this.onFieldChange
					}
				}]
			}]
		};
	},

	/**
	 * Creates the email fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createEmailFieldset : function(config)
	{
		return {
			title : _('Email'),
			items : [{
				xtype : 'zarafa.compositefield',
				anchor : '100%',
				hideLabel : true,
					items : [{
						xtype : 'splitbutton',
						width: config.labelWidth-1,
						text : _('Email') + ':',
						handler: this.openAddressBook,
						scope : this,
						menu : this.initEmailButtonMenu('message_email_address', 'email_address_1')
					},{
						xtype : 'textfield',
						flex: 1,
						ref : '../../mailAddressField',
						name : 'email_address_1',
						listeners : {
							scope : this,
							change : this.onEmailAddressChange
						}
					}]
			}, {
				xtype : 'textfield',
				flex : 1,
				anchor : '100%',
				name : 'email_address_display_name_1',
				fieldLabel : _('Display name'),
				ref : '../mailDisplayNameField',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}, {
				xtype : 'textfield',
				ref : '../webpageField',
				flex : 1,
				anchor : '100%',
				fieldLabel : _('Webpage'),
				name : 'webpage',
				listeners : {
					scope : this,
					change : this.onWebpageChange
				}
			}, {
				xtype : 'textfield',
				flex : 1,
				anchor : '100%',
				fieldLabel : _('IM Address'),
				name : 'im',
				listeners : {
					scope : this,
					change : this.onFieldChange
				}
			}]
		};
	},

	/**
	 * Creates the address fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createAddressFieldset : function(config)
	{
		return {
			title : _('Addresses'),
			defaultType : 'zarafa.compositefield',
			defaults : {
				hideLabel : true,
				anchor : '100%'
			},
			items : [{
				items : [{
					xtype : 'splitbutton',
					width : config.labelWidth-1,
					text : _('Business') + ':',
					handler : this.handleAddressButtonClick,
					scope : this,
					menu : this.initAddressButtonMenu('business_address', 'business_address')
					// @TODO add checkbox for email address selection
				}, {
					xtype : 'textarea',
					flex : 1,
					name : 'business_address',
					height : 120,
					listeners : {
						scope : this,
						change : this.onAddressChange
					}
				}]
			}]
		};
	},

	/**
	 * Creates the additional fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createAdditionalFieldset : function(config)
	{
		return {
			title : _('Additional information'),
			items : [{
				xtype : 'zarafa.editorfield',
				useHtml : false,
				ref: '../editorField',
				anchor : '100% 100%',
				height : 120,
				listeners : {
					change : this.onBodyChange,
					scope : this
				}
			}]
		};
	},

	/**
	 * Creates the attachment fieldset for general tab of form panel.
	 * @param {Object} config config object of {@Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTab}.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createAttachmentFieldset : function(config)
	{
		return {
			title : _('Attachments'),
			columnWidth : 1,
			border : false,
			defaultType : 'zarafa.resizablecompositefield',
			defaults: {
				hideLabel: true,
				anchor: '100%'
			},
			items : [{
				cls : 'zarafa-contactcreatepanel-field-attachments',
				items : [{
					xtype : 'zarafa.attachmentbutton',
					plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
					width : config.labelWidth-1,
					autoHeight: true,
					text : _('Attachments') + ':'
				},{
					xtype: 'zarafa.attachmentfield',
					plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
					flex: 1,
					hideLabel: true
				}]
			}]
		};
	},

	/**
	 * Function will initialize button menu config object for the telephone buttons.
	 * group config option is used to group all checkbox items into a single select radio button group
	 * and its name should be unique across all instances of menu button
	 * @param {String} textFieldName name of the corresponding textfield
	 * @param {String} property will be used to show default selection
	 * @private
	 */
	initPhoneButtonMenu : function(textFieldName, property)
	{
		return {
			xtype : 'menu',
			listeners : {
				click : this.onMenuItemSelection,
				scope : this
			},
			items : [{
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Assistant'),
				name : 'assistant_telephone_number',
				checked : property === 'assistant_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Business'),
				name : 'business_telephone_number',
				checked : property === 'business_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Business 2'),
				name : 'business2_telephone_number',
				checked : property === 'business2_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Business Fax'),
				name : 'business_fax_number',
				checked : property === 'business_fax_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Callback'),
				name : 'callback_telephone_number',
				checked : property === 'callback_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Car'),
				name : 'car_telephone_number',
				checked : property === 'car_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Company'),
				name : 'company_telephone_number',
				checked : property === 'company_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Home'),
				name : 'home_telephone_number',
				checked : property === 'home_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Home 2'),
				name : 'home2_telephone_number',
				checked : property === 'home2_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Home Fax'),
				name : 'home_fax_number',
				checked : property === 'home_fax_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('ISDN'),
				name : 'isdn_number',
				checked : property === 'isdn_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Mobile'),
				name : 'cellular_telephone_number',
				checked : property === 'cellular_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Other'),
				name : 'other_telephone_number',
				checked : property === 'other_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Other Fax'),
				name : 'primary_fax_number',
				checked : property === 'primary_fax_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Pager'),
				name : 'pager_telephone_number',
				checked : property === 'pager_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Primary'),
				name : 'primary_telephone_number',
				checked : property === 'primary_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Radio'),
				name : 'radio_telephone_number',
				checked : property === 'radio_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Telex'),
				name : 'telex_telephone_number',
				checked : property === 'telex_telephone_number'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('TTY/TDD'),
				name : 'ttytdd_telephone_number',
				checked : property === 'ttytdd_telephone_number'
			}]
		};
	},

	/**
	 * Function will initialize button menu config object for the address button
	 * @param {String} textFieldName name of the corresponding textfield
	 * @param {String} property will be used to show default selection
	 * @private
	 */
	initAddressButtonMenu : function(textFieldName, property)
	{
		return {
			xtype : 'menu',
			listeners : {
				click : this.onMenuItemSelection,
				scope : this
			},
			items : [{
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Home'),
				name : 'home_address',
				checked : property === 'home_address'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Business'),
				name : 'business_address',
				checked : property === 'business_address'
			}, {
				xtype : 'menucheckitem',
				group : textFieldName,
				text : _('Other'),
				name : 'other_address',
				checked : property === 'other_address'
			}]
		};
	},

	/**
	 * Function will initialize button menu config object for the email button.
	 * group config option is used to group all checkbox items into a single select radio button group
	 * and its name should be unique across all instances of menu button
	 * @param {String} textFieldName name of the corresponding textfield
	 * @param {String} property will be used to show default selection
	 * @private
	 */
	initEmailButtonMenu : function(textFieldName,  property)
	{
		return {
			xtype : 'menu',
			listeners : {
				click : {
					fn : this.onEmailMenuItemSelection,
					scope : this
				}
			},
			defaults : {
				xtype : 'menucheckitem',
				group : textFieldName
			},
			items : [{
				text : _('Email'),
				name : 'email_address_1',
				checked : property === 'email_address_1'
			}, {
				text : _('Email 2'),
				name : 'email_address_2',
				checked : property === 'email_address_2'
			}, {
				text : _('Email 3'),
				name : 'email_address_3',
				checked : property === 'email_address_3'
			}]
		};
	},

	/**
	 * Function that will be called when one of the phone buttons is clicked,
	 * this function is used as wrapper to discard arguments passed with the handler
	 * and it will call function that will open the {@link Zarafa.contact.dialogs.ContactPhoneContent ContactPhoneContent}.
	 * @param {Ext.SplitButton} buttonEl split button element which was clicked.
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 */
	handlePhoneButtonClick : function(buttonEl, eventObj)
	{
		this.showDetailedPhoneContent(buttonEl.ownerCt.findByType('textfield')[0].getName());
	},

	/**
	 * Function that will be called when address button is clicked,
	 * this function is used as wrapper to discard arguments passed with the handler
	 * and it will call function that will open the {@link Zarafa.contact.dialogs.ContactAddressContent ContactAddressContent}.
	 * @param {Ext.SplitButton} buttonEl split button element which was clicked.
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 */
	handleAddressButtonClick : function(buttonEl, eventObj)
	{
		this.showDetailedAddressContent(buttonEl.ownerCt.findByType('textarea')[0].getName());
	},

	/**
	 * Event handler which is fired when the user presses the 'Email' button.
	 * This will open the Address Book User Selection ContentPanel to select a user-email.
	 * @private
	 */
	openAddressBook : function()
	{
		Zarafa.common.Actions.openABUserSelectionContent({
			callback : this.abCallBack,
			scope : this
		});
	},

	/**
	 * Callback function for {@link Zarafa.addressbook.dialogs.ABUserSelectionContentPanel AddressBook}
	 * Function will set email_address_x and email_address_type_x property for the record.
	 * @param {Ext.data.Record} record user selected from AddressBook
	 * @private
	 */
	abCallBack : function(record)
	{
		var emailAddress;
		var addressType = record.get('address_type') || 'SMTP';

		if(addressType === 'ZARAFA') {
			emailAddress = record.get('smtp_address');
		} else {
			emailAddress = record.get('email_address');
		}

		this.mailAddressField.setValue(emailAddress);

		this.record.beginEdit();
		switch (this.mailAddressField.getName())
		{
			case 'email_address_1':
				this.record.set('email_address_1', emailAddress);
				// local contact must have SMTP as address type
				this.record.set('email_address_type_1', 'SMTP', true);
				this.record.set('email_address_display_name_1', record.get('display_name'));
				break;
			case 'email_address_2':
				this.record.set('email_address_2', emailAddress);
				this.record.set('email_address_type_2', 'SMTP', true);
				this.record.set('email_address_display_name_2', record.get('display_name'));
				break;
			case 'email_address_3':
				this.record.set('email_address_3', emailAddress);
				this.record.set('email_address_type_3', 'SMTP', true);
				this.record.set('email_address_display_name_3', record.get('display_name'));
				break;
		}
		this.record.endEdit();
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received.
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if(Ext.isEmpty(record)) {
			return;
		}

		this.record = record;

		this.getForm().loadRecord(record);

		if (record.isOpened() && contentReset) {
			this.updateContactPhoto();
		}

		if (contentReset) {
			// when loading first time generate combobox items and select item that is stored in the record
			this.generateFileAsItems();
			this.fileAsField.selectByValue(record.get('fileas'), true);
		}

		if (record.isModifiedSinceLastUpdate('fileas')) {
			// if fileas property is changed in record then simply select that entry in combobox
			this.fileAsField.selectByValue(record.get('fileas'), true);
		}

		if (contentReset && record.isOpened()) {
			this.editorField.setValue(record.getBody(this.editorField.isHtmlEditor()));
		}

		if (record.isModifiedSinceLastUpdate('display_name') || record.isModifiedSinceLastUpdate('company_name')) {
			// display_name or company_name has been changed, regenerate options and select according to previous selection
			this.generateFileAsItems();
			this.updateFileas();
		}
	},

	/**
	 * Function is used to update contact photo in the dialog
	 * according to updated {@link Zarafa.core.data.IPMRecord record} data.
	 */
	updateContactPhoto : function()
	{
		var attachmentStore = this.record.getAttachmentStore();
		var imageField = this.contactPhotoBox.getEl();

		// Set an event handler for the load event of the image
		var imgEl = new Ext.Element(Ext.getDoc().dom.createElement('img'));
		imgEl.on('load', this.onLoadContactPhoto, this, {single: true});
		
		// update the new contact photo in contact picture field.
		if(imageField && attachmentStore.getCount() > 0) {
			attachmentStore.each(function(attach) {
				if(attach.isContactPhoto()) {
					imgEl.set({'src': attach.getInlineImageUrl()});
					imageField.setStyle({'background-image': 'url(' + encodeURI(attach.getInlineImageUrl()) + ')'});
					this.hasContactPhoto = true;
					this.record.set('has_picture', true);
					this.contactPhotoBox.removeClass('default_contact_photo');
					
					return false;
				}
			}, this);
		}
	},
	
	/**
	 * Event handler for the load event of the contact photo. It resizes the image
	 * if necessary and places it on the right position. 
	 * @param {Ext.EventObject} event The load event
	 * @param {HtmlElement} The img element that fired the load event
	 */
	onLoadContactPhoto : function(event, img)
	{
		var imageField = this.contactPhotoBox.getEl();
		var imgEl = Ext.get(img);
		var ct = imageField.up('.contact_photo_box_ct');
		var ctPadding = ct.getPadding('lr');
		var maxWidth = ct.getWidth() - ctPadding - 2; // Subtract two for border
		var imageWidth = imgEl.dom.naturalWidth;
		var imageHeight = imgEl.dom.naturalHeight;
		var width, height, backgroundSize;
		if ( imageWidth < maxWidth && imageHeight < maxWidth ) {
			// The image is smaller than the area we reserved for it
			// so we don't resize it.
			width = imageWidth;
			height = imageHeight;
			backgroundSize = 'auto';
		} else {
			// The image is bigger than the area we reserved for it,
			// so we will have resize it
			if ( imageWidth > imageHeight ){
				width = maxWidth;
				height = maxWidth*imageHeight/imageWidth;
			} else {
				width = maxWidth*imageWidth/imageHeight;
				height = maxWidth;
			}
		}

		imageField.setWidth(width);
		imageField.setHeight(height);
		imageField.setStyle({
			'background-size': width + 'px ' + height + 'px',
			left: ((maxWidth - width) / 2) + 'px',
			top: ((maxWidth - height) / 2) + 'px'
		});
	},

	/**
	 * Event handler which is fired after the {@link Ext.form.FormPanel FormPanel}
	 * has been {@link Ext.Component#afterrender rendered}. Here contact photo box has 
	 * listen {@link Ext.Element#click single click}, {@link Ext.Element#dblclick double click} and
	 * {@link Ext.Element#contextmenu context menu} evetns. 
	 * @param {Ext.Component} contactPhotoBox which show the contact picture.
	 * @private
	 */
	onAfterRender : function(contactPhotoBox)
	{
		var imageFieldCt = contactPhotoBox.getEl().up('div');
		this.mon(imageFieldCt, {
			'click' : this.onSingleClick, 
			'dblclick' : this.onDoubleClick,
			'contextmenu' : this.onContextMenuClick,
			'scope' : this
		});
	},

	/**
	 * Event handler which is triggered when contact has contact picture and right click
	 * perform on contact photo box. it should used to open context menu for changing or
	 * removing contact picture.
	 * 
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @param {Element} target Event target
	 * @param {Object} object Configuration object
	 */
	onContextMenuClick : function(eventObj, target, object)
	{
		if(this.hasContactPhoto) {
			var attachmentRecord = this.getAttachedContactPhoto();
			Zarafa.core.data.UIFactory.openDefaultContextMenu(attachmentRecord, { position : eventObj.getXY(), parent : this});
		}
	},

	/**
	 * Function will get attached contact picture record 
	 * from {@link Zarafa.core.data.IPMAttachmentStore IPMAttachmentStore}.
	 * @return {Zarafa.core.data.IPMAttachmentRecord} returns the contact picture attachment record.
	 */
	getAttachedContactPhoto : function()
	{
		var attachmentStore = this.record.getAttachmentStore();
		var attachmentRecord;
		attachmentStore.each(function(attach) {
			if(attach.isContactPhoto()) {
				attachmentRecord = attach;
			}
		}, this);
		return attachmentRecord;
	},

	/**
	 * Event handler which is fired when the contact picture field is being clicked 
	 * and contact has default image or contact is new contact. this will call the 
	 * {@link #uploadContactPhoto} function to open upload attachment dialog.
	 * 
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @param {Element} target Event target
	 * @param {Object} object Configuration object
	 */
	onSingleClick : function(eventObj, target, object)
	{
		if(!this.hasContactPhoto) {
			this.uploadContactPhoto();
		}
	},

	/**
	 * Event handler which is fired when contact picture field is being double-clicked and
	 * contact has contact picture. this will call the {@link #uploadContactPhoto}
	 * function to open upload attachment dialog. 
	 * 
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @param {Element} target Event target
	 * @param {Object} object Configuration object
	 */
	onDoubleClick : function(eventObj, target, object)
	{
		if(this.hasContactPhoto) {
			this.uploadContactPhoto();
		}
	},

	/**
	 * Event handler which is triggered when contact photo gets deleted from 
	 * {@link Zarafa.core.data.IPMAttachmentStore IPMAttachmentStore}. Also it will
	 * set the src to {@link Ext.BLANK_IMAGE_URL BlankImage} because empty src attribute of img tag
	 * show page break icon in contact photo box, also set hasContactPhoto to false so
	 * contact picture field listen the single click event to open the browser's file selection dialog 
	 * and set the has_picture property false to hide the contact picture from contact.
	 * 
	 * @param {Zarafa.core.data.IPMAttachmentStore} attachmentStore The Attachmentstore.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} attachmentRecord Attachment record.
	 */
	clearContactPhoto : function(store, attachmentRecord)
	{
		store.remove(attachmentRecord);
		var imageField = this.contactPhotoBox.getEl();
		this.hasContactPhoto = false;
		this.record.set('has_picture', false);
		var ct = this.contactPhotoBox.el.up('.contact_photo_box_ct');
		var maxWidth = ct.getWidth() - ct.getPadding('lr') - 2; //subtracting 2px for the border
		imageField.set({src: Ext.BLANK_IMAGE_URL});
		imageField.setStyle({
			width: maxWidth + 'px', // The image is a square, so we can use the width also for the height
			height: maxWidth + 'px',
			left: 0,
			top: 0,
			'background-image' : '',
			'background-size' : 'auto'
		});
		this.contactPhotoBox.addClass('default_contact_photo');
	},

	/**
	 * Event handler for opening the Browser's file selection dialog.
	 * See {@link #onFileInputChange} for the handling of the selected files.
	 * @private
	 */
	uploadContactPhoto : function()
	{
		var attachmentStore = this.record.getAttachmentStore();
		this.mon(attachmentStore, 'update', this.updateContactPhoto, this);

		var attachComponent = new Zarafa.common.attachment.ui.UploadAttachmentComponent({
			callback : this.uploadContactPhotoCallback,
			accept : 'image/*',
			scope : this
		});

		attachComponent.openAttachmentDialog();
	},

	/**
	 * Callback function for {@link Zarafa.common.attachment.ui.UploadAttachmentComponent}.
	 * which is going to add the contact picture(Attachment record) in {@link Zarafa.core.data.IPMAttachmentStore store}.
	 * 
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Object} form the form is contains {@link Ext.form.BasicForm bacisform} info.
	 */
	uploadContactPhotoCallback : function(files, form)
	{
		var store = this.record.getAttachmentStore();
		this.beforeUploadContactPhoto(store);
		var isHidden = true;
		var param = {sourcetype : 'contactphoto'};
		store.uploadFiles(files, form, isHidden, param);
	},

	/**
	 * Function is check that contact has already contact picture, if it is than remove 
	 * contact picture from attachment store before uploading new contact picture.
	 * @param {Zarafa.core.data.IPMAttachmentStore} attachmentStore The Attachmentstore.
	 */
	beforeUploadContactPhoto : function(store)
	{
		var attachmentRecord = this.getAttachedContactPhoto();
		if(Ext.isDefined(attachmentRecord)) {
			store.remove(attachmentRecord);
		}
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
		if(!Ext.isEmpty(menuItem)) {
			var compositeField = menu.findParentByType('zarafa.compositefield');
			var buttonField = compositeField.findByType('splitbutton')[0];
			var textField = compositeField.findByType('textfield')[0];

			if(!Ext.isEmpty(buttonField) && !Ext.isEmpty(textField)) {
				// update text of button
				buttonField.setText(menuItem.initialConfig.text);

				// update corresponding textfield with new value
				textField.name = menuItem.name;
				textField.el.dom.name = menuItem.name;
				textField.setValue(this.record.get(menuItem.name));
			}
		}
	},

	/**
	 * Function will be called whenever selection of email address
	 * will be changed, this function will change text of button, also change value
	 * of the corresponding textfield and display_email field
	 * @param {Ext.menu.Menu} Menu button manu
	 * @param {Ext.menu.CheckItem} CheckItem menu item that is selected
	 * @param {Ext.EventObject} EventObjectt event object
	 * @private
	 */
	onEmailMenuItemSelection : function(menu, menuItem, eventObj)
	{
		/*
		 * This will update text of splitbutton for Email, and
		 * also change value of the corresponding mailDisplayField
		 */
		this.onMenuItemSelection(menu, menuItem, eventObj);

		// This will set corresponding email-address displayname in mailDisplayNameField field.
		if(!Ext.isEmpty(this.mailDisplayNameField)) {
			var displayFieldProperty = menuItem.name.replace('email_address','email_address_display_name');
			this.mailDisplayNameField.name = displayFieldProperty;
			this.mailDisplayNameField.el.dom.name = displayFieldProperty;
			this.mailDisplayNameField.setValue(this.record.get(displayFieldProperty));
		}
	},

	/**
	 * Function will re-generate combobox items for fileas field whenever display_name or company_name
	 * property in {@link Zarafa.core.data.IPMRecord IPMRecord} is changed. This function is also called when
	 * loading contents in the dialog first time.
	 */
	generateFileAsItems : function()
	{
		var record = this.record;

		var fileasOptions = [];
		var displayName = record.get('display_name');
		var displayNamePrefix = record.get('display_name_prefix');
		var displayNameSuffix = record.get('generation');
		var companyName = record.get('company_name');
		var comboStore = this.fileAsField.getStore();

		if(!Ext.isEmpty(displayName)) {
			// Remove prefix and suffix from display name
			displayName = displayName.replace(displayNamePrefix, '').replace(displayNameSuffix, '').replace(',', '');
			var displayNameArray = displayName.trim().split(new RegExp(Zarafa.contact.data.config.SP + '|' + Zarafa.contact.data.config.NBSP, 'g'));

			// remove whitespaces from array
			displayNameArray = Zarafa.core.Util.trimStringArray(displayNameArray);

			// two options based on name fields only
			// surname, givenname middlename and givenname middlename surname
			var contactName = '';
			if(displayNameArray.length > 0) {
				if(displayNameArray.length === 1) {
					// givenname
					contactName = displayNameArray[0];
					fileasOptions.push([contactName]);
				} else {
					// surname, givenname middlename
					var surname = displayNameArray[displayNameArray.length - 1] + ',' + Zarafa.contact.data.config.NBSP;
					var remainder = displayNameArray.slice(0, displayNameArray.length - 1);

					contactName = surname + remainder.join(Zarafa.contact.data.config.NBSP);
					fileasOptions.push([contactName]);

					// givenname middlename surname
					fileasOptions.push([displayNameArray.join(Zarafa.contact.data.config.NBSP)]);
				}
			}

			// two options based on company name and name fields
			if(!Ext.isEmpty(companyName)) {
				// companyname
				fileasOptions.push([companyName]);

				if(!Ext.isEmpty(contactName)) {
					// givenname | givenname middlename surname | surname, givenname middlename (companyname)
					fileasOptions.push([contactName + Zarafa.contact.data.config.NBSP + '(' + companyName + ')']);
					// companyname (givenname | givenname middlename surname | surname, givenname middlename)
					fileasOptions.push([companyName + Zarafa.contact.data.config.NBSP + '(' + contactName + ')']);
				}
			}
		} else if(!Ext.isEmpty(companyName)) {
			// only companyname is set
			fileasOptions.push([companyName]);
 		}

		comboStore.loadData(fileasOptions);
	},

	/**
	 * Function will update fileas field in {@link Zarafa.core.data.IPMRecord IPMRecord} based on
	 * previous selected entry in fileas combobox or else it will select first entry in the combobox store.
	 * @private
	 */
	updateFileas : function()
	{
		var comboStore = this.fileAsField.getStore();
		var oldSelectedIndex = this.fileAsField.selectedIndex;

		if(comboStore.getCount() <= 0) {
			// if no data is populated in combobox then clear the fileas value
			this.record.set('fileas', '');
		} else {
			if(oldSelectedIndex === -1 || oldSelectedIndex > comboStore.getCount()) {
				// if no selection is present then select first item by default
				this.record.set('fileas', comboStore.getAt(0).get(this.fileAsField.displayField));
			} else {
				this.record.set('fileas', comboStore.getAt(oldSelectedIndex).get(this.fileAsField.displayField));
			}
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		record.beginEdit();

		var newWebpage = this.webpageField.getValue();
		var oldWebpage = record.get(this.webpageField.getName());
		if (newWebpage !== oldWebpage) {
			this.onWebpageChange(this.webpageField, newWebpage, oldWebpage);
		}

		var newFileas = this.fileAsField.getValue();
		var oldFileas = record.get(this.fileAsField.getName());
		if (newFileas !== oldFileas) {
			this.onFileasChange(this.fileAsField, newFileas, oldFileas);
		}

		var newEmail = this.mailAddressField.getValue();
		var oldEmail = record.get(this.mailAddressField.getName());
		if (newEmail !== oldEmail) {
			this.onEmailAddressChange(this.mailAddressField, newEmail, oldEmail);
		}

		this.getForm().updateRecord(record);

		// We only need to generate the subject and fileas,
		// when the properties have been changed.
		if (record.isModified('display_name') ||
		    record.isModified('display_name_prefix') ||
		    record.isModified('generation') ||
		    record.isModified('fileas')) {
			record.updateSubject();
		}

		this.onBodyChange(this.editorField.getEditor(), this.editorField.getValue());

		record.updateAddressbookProps();

		record.endEdit();
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
	onFieldChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.set(field.getName(), newValue);
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
		var record = this.record;
		var isHtmlEditor = field instanceof Ext.form.HtmlEditor;

		record.beginEdit();
		record.setBody(newValue, isHtmlEditor);
		record.endEdit();
	},

	/**
	 * Event handler which is triggered when one of the Email Address fields was
	 * changed. This will update some additional properties as well.
	 *
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onEmailAddressChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.beginEdit();
			this.record.set(field.getName(), newValue);

			switch(field.getName()) {
				case 'email_address_1':
					this.record.set('email_address_type_1', 'SMTP', true);
					break;
				case 'email_address_2':
					this.record.set('email_address_type_2', 'SMTP', true);
					break;
				case 'email_address_3':
					this.record.set('email_address_type_3', 'SMTP', true);
					break;
			}
			this.record.updateAddressbookProps();

			this.record.endEdit();
		}
	},

	/**
	 * Event handler which is fired when the 'fileas' property has been changed. This
	 * will also update the 'fileas_selection' property.
	 *
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onFileasChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.beginEdit();
			this.record.set(field.getName(), newValue);
			/*
			 * if fileas field has been changed then we have to also reset value of fileas_selection
			 * so outlook will re-generate fileas_selection value, because webapp is not generating that value
			 */
			this.record.set('fileas_selection', -1);
			this.record.endEdit();
		}
	},

	/**
	 * Event handler which is fired when the 'webpage' property has been changed. This
	 * will also update the 'business_home_page' property.
	 *
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onWebpageChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.beginEdit();
			this.record.set(field.getName(), newValue);
			this.record.set('business_home_page', newValue);
			this.record.endEdit();
		}
	},

	/**
	 * Event handler which is fired when the 'display_name' property has been changed.
	 * This will parse the display name and show a dialog if the display name could not
	 * fully be parsed.
	 *
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onDisplayNameChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.set(field.getName(), newValue);

			/*
			 * we want the updated record when we need open detailed dialogs,
			 * but the updation of record is done after by the update method of ui components
			 * so we will give sometime for contact general tab to update contact record and
			 * and with the latest updated contact record we can open the detailed dialogs
			 */
			/* jshint unused: false */
			var showDetailedContent = function() {
				var parsedData = this.getContactParser().parseInfo('name', newValue);

				// sync properties
				this.record.beginEdit();
				this.record.set('display_name_prefix', parsedData['display_name_prefix']);
				this.record.set('given_name', parsedData['given_name']);
				this.record.set('middle_name', parsedData['middle_name']);
				this.record.set('surname', parsedData['surname']);
				this.record.set('generation', parsedData['generation']);
				this.record.endEdit();

				var settingValue = container.getSettingsModel().get('zarafa/v1/contexts/contact/show_name_dialog');
				// check for incomplete data and show detailed name dialog
				if(settingValue === true && !Ext.isEmpty(newValue)) {
					if(parsedData['incomplete_info'] === true) {
						// show detailed dialog for full name
						this.showDetailedNameContent(parsedData);
					}
				}
			}.defer(1, this);
		}
	},

	/**
	 * Event handler which is fired when one of the address properties has been changed.
	 * This will parse the address and show a dialog if the address could not
	 * fully be parsed.
	 *
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onAddressChange : function(field, newValue, oldValue)
	{
		if (field.validateValue(field.processValue(newValue))) {
			this.record.set(field.getName(), newValue);

			/*
			 * we want the updated record when we need open detailed dialogs,
			 * but the updation of record is done after by the update method of ui components
			 * so we will give sometime for contact general tab to update contact record and
			 * and with the latest updated contact record we can open the detailed dialogs
			 */
			/*jshint unused:false*/
			var showDetailedContent = function() {
				// check for incomplete data and show detailed name dialog
				var parsedData = this.getContactParser().parseInfo('address', newValue);
				var propertyPrefix = field.getName();

				// sync properties
				this.record.beginEdit();
				this.record.set(propertyPrefix + '_street', parsedData['street']);
				this.record.set(propertyPrefix + '_city', parsedData['city']);
				this.record.set(propertyPrefix + '_state', parsedData['state']);
				this.record.set(propertyPrefix + '_postal_code', parsedData['postal_code']);
				this.record.set(propertyPrefix + '_country', parsedData['country']);
				this.record.endEdit();

				var settingValue = container.getSettingsModel().get('zarafa/v1/contexts/contact/show_address_dialog');
				if (settingValue === true && !Ext.isEmpty(newValue)) {
					if (parsedData['incomplete_info'] === true) {
						// show detailed dialog for address
						this.showDetailedAddressContent(propertyPrefix, parsedData);
					}
				}
			}.defer(1, this);
		}
	},

	/**
	 * Function will open detailed name dialog to enter incomplete information
	 * @param {Object} parsedData if string is already parsed into object then we can pass
	 * that object here in componentConfig so parsing will not be done twice
	 * @private
	 */
	showDetailedNameContent : function(parsedData)
	{
		Zarafa.contact.Actions.openDetailedNameContent(this.record, { parser : this.getContactParser(), parsedData : parsedData });
	},

	/**
	 * Function will open detailed address dialog to enter incomplete information
	 * @param {String} property property that will be modified
	 * @param {Object} parsedData if string is already parsed into object then we can pass
	 * that object here in componentConfig so parsing will not be done twice
	 * @private
	 */
	showDetailedAddressContent : function(property, parsedData)
	{
		Zarafa.contact.Actions.openDetailedAddressContent(this.record, { parser : this.getContactParser(), parsedData : parsedData, property : property });
	},

	/**
	 * Function will open detailed phone dialog to enter incomplete information
	 * @param {String} property property that will be modified
	 * @private
	 */
	showDetailedPhoneContent : function(property)
	{
		Zarafa.contact.Actions.openDetailedPhoneContent(this.record, { parser : this.getContactParser(), property : property });
	},

	/**
	 * @return {Zarafa.contact.data.ContactDetailsParser} contact details parser
	 */
	getContactParser : function()
	{
		return this.dialog.contactParser;
	},


    /**
     * Initialize all {@link Zarafa.core.data.MAPIRecord record} related events
     * for this {@link Zarafa.contact.dialogs.ContactGeneralTab ContactGeneralTabPanel}.
     * @private
     */
    initEvents: function ()
    {
	    this.mon(this.dialog, {
		    'beforesaverecord': this.onBeforeSaveRecord,
		    'scope': this
	    });
    },

    /**
     * Event handler which is fired when the the {@link Ext.data.Store store} for the {@link #record}
     * fires the {@link Ext.data.Store#beforesave} event.
     * This will check all phone number fields if any of this has "x" as a extension separator then
     * replace it with "-".
     * @private
     */
    onBeforeSaveRecord : function()
    {
	    for (var i = 1; i <= 4; i++) {
		    var phone = this["phone" + i];
		    if (phone.value.indexOf("x") > 0) {
			    this.record.set(phone.name, phone.value.replace("x", "-"), true);
			    if(phone.name === 'business_fax_number') {
				    this.record.updateAddressbookProps();
			    }
		    }
	    }
    }
});

Ext.reg('zarafa.contactgeneraltab', Zarafa.contact.dialogs.ContactGeneralTab);
