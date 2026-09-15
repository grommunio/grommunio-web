Ext.namespace('Grommunio.common.recipientfield.ui');

/**
 * @class Grommunio.common.recipientfield.ui.EditRecipientContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.editrecipientcontentpanel
 *
 * This content panel allows for simple editing of a recipient.
 */
Grommunio.common.recipientfield.ui.EditRecipientContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecipientRecord} record The recipient which
	 * is being edited by this panel.
	 */
	record: undefined,

	/**
	 * The form panel which is loaded inside this panel.
	 * @property
	 * @type Ext.form.FormPanel
	 */
	formPanel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Edit recipient'),
			layout: 'fit',
			width: 350,
			height: 110,
			stateful: false,
			items: [{
				xtype: 'form',
				layout: 'form',
				border: false,
				ref: 'formPanel',
				items: [{
					xtype: 'textfield',
					fieldLabel: _('Display name'),
					name: 'display_name',
					anchor: '100%'
				},{
					xtype: 'textfield',
					fieldLabel: _('Email address'),
					allowBlank: false,
					vtype: 'email',
					name: 'smtp_address',
					anchor: '100%'
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
			}]
		});

		Grommunio.common.recipientfield.ui.EditRecipientContentPanel.superclass.constructor.call(this, config);

		this.on('afterlayout', this.onAfterFirstLayout, this, { single: true });
	},

	/**
	 * Event handler which is fired when {@link #afterlayout} has been called for the first time.
	 * This will load the {@link #record} into {@link #formPanel}.
	 * @private
	 */
	onAfterFirstLayout: function()
	{
		this.formPanel.getForm().loadRecord(this.record);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
	{
		this.formPanel.getForm().updateRecord(this.record);
		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel: function()
	{
		this.close();
	}
});

Ext.reg('grommunio.editrecipientcontentpanel', Grommunio.common.recipientfield.ui.EditRecipientContentPanel);
