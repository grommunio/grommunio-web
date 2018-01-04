/*
 * #dependsFile client/zarafa/core/mapi/RecipientType.js
 */
Ext.namespace('Zarafa.common.recipientfield.ui');

/**
 * @class Zarafa.common.recipientfield.ui.RecipientField
 * @extends Zarafa.common.ui.BoxField
 * @xtype zarafa.recipientfield
 *
 * Extension to the default {@link Zarafa.common.ui.BoxField} which
 * handles recipients as for rendering. It uses a
 * {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore} for storing
 * and resolving {@link Zarafa.core.data.IPMRecipientsRecord Recipients}.
 *
 * If the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Zarafa.core.data.IPMRecipientStore RecipientStore} into the component.
 * Otherwise the user of this component needs to call {@link #setRecipientStore}.
 */
Zarafa.common.recipientfield.ui.RecipientField = Ext.extend(Zarafa.common.ui.BoxField, {
	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} defaultRecipientType The default recipient type value which should be used for the field
	 * defaultRecipientType takes the value of filterRecipientType properties if its defined.
	 */
	defaultRecipientType : Zarafa.core.mapi.RecipientType.MAPI_TO,

	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} filterRecipientType The recipient type value which is used for this Input field
	 * This field also helps us to make a decision on which recipients should visible into the field and if set to undefined
	 * it will allow to display multiple recipient types into that field.
	 */
	filterRecipientType : undefined,

	/**
	 * @cfg {String} delimiterCharacters The characters which is used to split input up into multiple
	 * recipients. This allows the user to type in multiple recipients before they are converted into
	 * boxes.
	 */
	delimiterCharacters: [';',','],

	/**
	 * @cfg {Boolean} enableDrag true to enable just drag
	 */
	enableDrag : true,

	/**
	 * @cfg {Boolean} enableDrop true to enable just drop
	 */
	enableDrop : true,

	/**
	 * @cfg {Boolean} enableDragDrop true to enable drag and drop
	 */
	enableDragDrop : true,

	/**
	 * The dragZone used by this field if drag is enabled (see {@link #enableDrag})
	 * @property
	 * @type Zarafa.common.recipientfield.ui.RecipientDragZone
	 */
	dragZone : undefined,

	/**
	 * The dropZone used by this tree if drop is enabled (see {@link #enableDrop})
	 * @property
	 * @type Zarafa.common.recipientfield.ui.RecipientDropZone
	 */
	dropZone : undefined,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.store)) {
			config.store = new Zarafa.common.recipientfield.data.SuggestionListStore();
		}

		Ext.applyIf(config, {
			boxType : 'zarafa.recipientbox',
			itemSelector: 'div.x-zarafa-boxfield-suggestion-item',
			extraItemSelector: 'a.x-zarafa-boxfield-suggestion-cross',
			border: false,
			minChars: 1,
			listEmptyText : _('No suggestions available'),
			boxMinHeight: 24,
			boxMaxHeight: 66,
			height: 24,
			tpl: new Ext.XTemplate(
				'<tpl for=".">',
					'<div class="x-zarafa-boxfield-suggestion-item x-combo-list-item">',
						'<a class="x-zarafa-boxfield-suggestion-cross" ext:qtip="'+ _('Delete recipient from suggestion list') +'" ext:qwidth="100%"></a>',
						'{values.display_name:htmlEncode} &lt;',
							'<tpl if="!Ext.isEmpty(values.smtp_address)">{values.smtp_address:htmlEncode}</tpl>',
							'<tpl if="Ext.isEmpty(values.smtp_address)">{values.email_address:htmlEncode}</tpl>',
						'&gt;',
					'</div>',
				'</tpl>'
			)
		});

		Zarafa.common.recipientfield.ui.RecipientField.superclass.constructor.call(this, config);

		this.on('boxdblclick', this.onBoxDblClick, this);
		this.on('boxcontextmenu', this.onBoxContextMenu, this);

		// For some reason Ext explicitly sets the width if the size of a boxComponent is set before it is rendered
		// This means it will never be resized again when the parents components size changes
		// So we make sure it will be undefined again and then it is resized as we want it to.
		// (it took me weeks to figure this out, so be careful when you change this!!!)
		this.on('afterrender', function(){
			if ( this.width ){
				this.width = undefined;
			}
		});
	},

	/**
	 * Called to handle the input when the user presses the handleInputKey or another trigger makes
	 * this component need to handle the input. Has to be overwritten to implement the desired
	 * behavior and the creation of the correct type of record.
	 *
	 * It will split up the input string if it has multiple email addresses or valid delimeteres.
	 * It will split following types of multiple email addresses string
	 *      1. Email addresses with valid delimiters  , and ; and spaces
	 *      2. Email addresses with user name where email address is enclosed in < >
	 *      3. User name with delimiters , and ;
	 * @param {String} value The value from the input field
	 */
	handleInput : function(value)
	{
		// FIXME: Disallow typing in HTML formatting...

		var regExpStr = /([^,;\n\r]*?<{0,1}(?:[a-zA-Z0-9.!#$%&'*+\-/=?^_`{|}~])+\@[a-z0-9\-]+(?:\.[a-z0-9\-]+)*\.(?:[a-z0-9]{2,15}))>{0,1}(?=(?:$|[,;\n\r\s]))/g;

		// fetch the email addresses form string.
		var emailAddresses = value.match(regExpStr);
		var splitted = [];

		// If string doesn't have email address and
		// it has only user name with delimiter then split the string with that delimiter
		if (Ext.isEmpty(emailAddresses)) {
			splitted = value.split(new RegExp(this.delimiterCharacters.join('|'), 'g'));

			if(Ext.isEmpty(splitted)) {
				splitted.push(value);
			}
		} else {
			splitted = emailAddresses;
		}

		// Remove duplicate email addresses.
		splitted = splitted.filter(function (emailAddress, index, self) {
			self[index] = self[index].trim();
			return index === self.indexOf(emailAddress.trim());
		});

		var newRecords = splitted.map(function (emailAddress) {
			return this.boxStore.parseRecipient(emailAddress.trim(), this.defaultRecipientType);
		}, this);

		if (newRecords.length > 0) {
			this.boxStore.add(newRecords);
		}
	},

	/**
	 * Called to handle a selection from the dropdown list. This function needs to
	 * convert the selected record into a record for the {@link #boxStore}.
	 * @param {Ext.data.Record} record The record which was selected from {@link #store}
	 * @protected
	 */
	handleSelection : function(record)
	{
		var recipient = record.convertToRecipient(this.defaultRecipientType);
		this.boxStore.add(recipient);
	},

	/**
	 * Set the store on this field. See {@link #setBoxStore}.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store to set on this field
	 */
	setRecipientStore: function(store)
	{
		return this.setBoxStore.apply(this, arguments);
	},

	/**
	 * Get the store attached to this field. See {@link #getBoxStore}.
	 * @return {Zarafa.core.data.IPMRecipientStore} store
	 */
	getRecipientStore: function()
	{
		return this.getBoxStore();
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (record && record instanceof Zarafa.core.data.MAPIRecord) {
			// In case the recordcomponentupdaterplugin is installed
			// we have a special action to update the component.
			if (contentReset && record.isOpened()) {
				this.setRecipientStore(record.getRecipientStore());
			}
		} else {
			// The recordcomponentupdaterplugin is not installed and the
			// caller really wants to perform the update() function. Probably
			// a bad move, but lets not disappoint the caller.
			Zarafa.common.recipientfield.ui.RecipientField.superclass.update.apply(this, arguments);
		}
	},

	/**
	 * Overwrites the function to set a box to add the resolved and beforeresolve event handlers to
	 * the store.
	 * @param {Ext.data.Store} boxStore The store that will be applied to this field.
	 * @param {Boolean} initial True if this function is called from the constructor.
	 */
	setBoxStore: function(boxStore, initial)
	{
		if (this.boxStore === boxStore && initial !== true) {
			return;
		}

		if (this.boxStore) {
			this.mun(this.boxStore, 'resolved', this.onBoxStoreResolved, this);
			this.mun(this.boxStore, 'beforeresolve', this.onBoxStoreBeforeResolve, this);
		}

		Zarafa.common.recipientfield.ui.RecipientField.superclass.setBoxStore.apply(this, arguments);

		if (this.boxStore) {
			this.mon(this.boxStore, 'resolved', this.onBoxStoreResolved, this);
			this.mon(this.boxStore, 'beforeresolve', this.onBoxStoreBeforeResolve, this);
		}
	},

	/**
	 * Event handler for when the server returns a resolve response. It is also fired when the request for
	 * resolving was not successfull. If the latter is the case the success parameter is set to false.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records that were sent in the resolve request.
	 */
	onBoxStoreResolved: function(store, records)
	{
		records = this.filterRecords(this.getBoxStore(), records);

		for (var i = 0; i < records.length; i++) {
			var recipient = records[i];
			var recipientBox = this.getBoxForRecord(recipient);
			if (recipientBox) {
				recipientBox.update(recipient);
				this.hideSuggestionList();
			}
		}
	},

	/**
	 * Event handler for when a resolve request is made to the server. This can be used to mark the
	 * records that are concerned as pending.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records that are pending resolving
	 */
	onBoxStoreBeforeResolve: function(store, records)
	{
		records = this.filterRecords(this.getBoxStore(), records);

		for (var i = 0; i < records.length; i++) {
			var recipient = records[i];
			var recipientBox = this.getBoxForRecord(recipient);
			if (recipientBox) {
				recipientBox.update(recipient);
			}
		}
	},

	/**
	 * Called by {@link #filterRecords} to check if the given record
	 * must be visible in the field or not. For the recipientfield, we check
	 * the {@link filterRecipientType} property and prevent that the
	 * {@link Zarafa.core.data.IPMRecipientRecord#isMeetingOrganizer meeting organizer}
	 * are visible in the box.
	 * @param {Ext.data.Record} record The record to filter
	 * @return {Boolean} True if the record should be visible, false otherwise
	 * @protected
	 */
	filterRecord : function(record)
	{
		return !record.isMeetingOrganizer() &&
				(!Ext.isDefined(this.filterRecipientType) ||
				 record.get('recipient_type') === this.filterRecipientType);
	},

	/**
	 * Event handler when a Box has been double-clicked.
	 * @param {Zarafa.common.recipientfield.ui.RecipientField} field This field to which the box belongs
	 * @param {Zarafa.common.recipientfield.ui.RecipientBox} box The box for which was double-clicked
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record which is attached to the box
	 * @private
	 */
	onBoxDblClick : function(field, box, record)
	{
		if (record.isResolved()) {
			// Resolved recipients cannot be edited, so we open the "View" dialog for it.
			Zarafa.common.Actions.openViewRecipientContent(record, {
				manager : Ext.WindowMgr
			});
		} else {
			// Unresolved recipients can be edited, so we open the "Create" dialog for it.
			Zarafa.core.data.UIFactory.openCreateRecord(record, {
				manager : Ext.WindowMgr
			});
		}
	},

	/**
	 * Event handler when the contextmenu is requested for a Box.
	 * @param {Zarafa.common.recipientfield.ui.RecipientField} field This field to which the box belongs
	 * @param {Zarafa.common.recipientfield.ui.RecipientBox} box The box for which the contextmenu is requested
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record which is attached to the box
	 * @private
	 */
	onBoxContextMenu : function(field, box, record)
	{
		Zarafa.core.data.UIFactory.openDefaultContextMenu(record, {
			position : box.getEl().getXY(),
			editable : box.editable
		});
	},

	/**
	 * Function called during the {@link #render rendering} of this component.
	 * Override initializes drag and drop zones
	 * @param {Ext.Container} ct The container in which the component is being rendered.
	 * @param {NUmber} position The position within the container where the component will be rendered.
	 * @override
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.recipientfield.ui.RecipientField.superclass.initEvents.apply(this, arguments);

		if ((this.enableDrag || this.enableDragDrop) && !this.dragZone) {
			this.dragZone = new Zarafa.common.ui.BoxFieldDragZone(this.container, {
				ddGroup : 'dd.mapiitem',
				field : this
			});
		}

		if ((this.enableDrop || this.enableDragDrop) && !this.dropZone) {
			this.dropZone = new Zarafa.common.recipientfield.ui.RecipientDropZone(this.container, {
				ddGroup : 'dd.mapiitem',
				field : this
			});
		}
	}
});

Ext.reg('zarafa.recipientfield', Zarafa.common.recipientfield.ui.RecipientField);
