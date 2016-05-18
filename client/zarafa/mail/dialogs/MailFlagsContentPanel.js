Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailFlagsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.mailflagscontentpanel
 */
Zarafa.mail.dialogs.MailFlagsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Boolean} disableFlagColor if true then flag color combo will be disabled,
	 * it is used by new mail content panel.
	 */
	disableFlagColor : false,

	/**
	 * @cfg {Boolean} disableCompleted if true then completed checkbox will be disabled,
	 * it is used by new mail content panel.
	 */
	disableCompleted : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// Add in some standard configuration data.
		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.mailflagscontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			width: 350,
			height: 150,
			items: [{
				xtype: 'zarafa.mailflagspanel',
				disableFlagColor : Ext.isBoolean(config.disableFlagColor) ? config.disableFlagColor : this.disableFlagColor,
				disableCompleted : Ext.isBoolean(config.disableCompleted) ? config.disableCompleted : this.disableCompleted,
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}],
			autoSave : Ext.isDefined(config.modal) ? config.modal : true,
			title : _('E-Mail Flags'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite :  true
			})
		});

		// Call parent constructor
		Zarafa.mail.dialogs.MailFlagsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.mailflagscontentpanel', Zarafa.mail.dialogs.MailFlagsContentPanel);
