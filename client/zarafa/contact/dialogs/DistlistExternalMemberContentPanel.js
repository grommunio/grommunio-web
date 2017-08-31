Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.DistlistExternalMemberContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 *
 * This class will be used to create a content panel for adding new member(external contact) in distlist,
 *
 * @xtype zarafa.distlistexternalmembercontentpanel
 */
Zarafa.contact.dialogs.DistlistExternalMemberContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record The distlist record which
	 * contains memberStore for distribution list members
	 */
	parentRecord : undefined,

	/**
	 * @cfg {Zarafa.contact.DistlistMemberRecord} memberRecord The distlist member record
	 * which is being edited by this panel.
	 */
	record : undefined,

	/**
	 * The form panel which is loaded inside this panel.
	 * @property
	 * @type Ext.form.FormPanel
	 */
	formPanel : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.distlistexternalmembercontentpanel',
			title : _('New e-mail address'),
			layout : 'fit',
			items: this.createFormItems()
		});

		Zarafa.contact.dialogs.DistlistExternalMemberContentPanel.superclass.constructor.call(this, config);

		this.on('afterlayout', this.onAfterFirstLayout, this, { single: true });
	},

	/**
	 * Create the form in which the new e-mail address info can be fetch
	 * @return {Object} Configuration object for the form
	 */
	createFormItems : function()
	{
		return [{
			xtype: 'form',
			layout: 'form',
			border: false,
			ref: 'formPanel',
			width: 350,
			height: 150,
			items: [{
				xtype: 'textfield',
				fieldLabel: _('Name'),
				name: 'display_name',
				allowBlank : false,
				blankText: _('This field is required'),
				anchor: '100%'
			},{
				xtype: 'textfield',
				fieldLabel: _('E-mail address'),
				name : 'email_address',
				anchor: '100%',
				allowBlank : false,
				blankText: _('This field is required'),
				vtype: 'email',
				vtypeText : _('Please input a valid email address!')
			}],
			buttons: [{
				text: _('Ok'),
				handler: this.onOk,
				scope: this
			},{
				text: _('Cancel'),
				handler: this.onCancel,
				scope: this
			}]
		}];
	},

	/**
	 * Event handler which is fired when {@link #afterlayout} has been called for the first time.
	 * This will load the {@link #record} into {@link #formPanel}.
	 * @private
	 */
	onAfterFirstLayout : function()
	{
		if(this.record) {
			this.formPanel.getForm().loadRecord(this.record);
		}
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * Function will update or create new member record to update in distlist in memberStore.
	 * @private
	 */
	onOk : function()
	{
		var form = this.formPanel.getForm();

		if(!form.isValid()) {
			return false;
		}

		if(this.record) {
			form.updateRecord(this.record);
		} else {
			// If there isn't record then we are adding new member,
			// So create a new member record and fill it with form data.
			var newRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER);
			form.updateRecord(newRecord);
			newRecord.set("smtp_address", newRecord.get("email_address"));

			// Add newly created record into the store.
			this.parentRecord.getMemberStore().add(newRecord);
		}

		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	}
});

// register panel
Ext.reg('zarafa.distlistexternalmembercontentpanel', Zarafa.contact.dialogs.DistlistExternalMemberContentPanel);
