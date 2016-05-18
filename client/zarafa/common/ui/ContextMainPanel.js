Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.ContextMainPanel
 * @extends Ext.Panel
 * @xtype zarafa.contextmainpanel
 */
Zarafa.common.ui.ContextMainPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.mail.MailContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.contextmainpanel',
			border : false,
			cls: 'zarafa-panel'
		});

		Zarafa.common.ui.ContextMainPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.contextmainpanel', Zarafa.common.ui.ContextMainPanel);
