Ext.namespace('Zarafa.plugins.smime.ui');

/**
 * @class Zarafa.plugins.smime.ui.FormPanel
 * @extends Ext.FormPanel
 *
 * Extending the original {@link Ext.FormPanel} to be able to set the
 * action url of the form in the config.
 */
Zarafa.plugins.smime.ui.FormPanel = Ext.extend(Ext.FormPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config){
		config = config || {};
		Ext.apply(config, {
			xtype: 'smime.form'
		});

		Zarafa.plugins.smime.ui.FormPanel.superclass.constructor.call(this, config);
	},

	// private
	// Overridden to add the action attribute to the form
	initComponent : function()
	{
		Zarafa.plugins.smime.ui.FormPanel.superclass.initComponent.apply(this, arguments);

		Ext.applyIf(this.bodyCfg, {
			action: this.url
		});
	}
});

Ext.reg('smime.form', Zarafa.plugins.smime.ui.FormPanel);
