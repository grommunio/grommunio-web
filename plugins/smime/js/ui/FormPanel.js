Ext.namespace('Grommunio.plugins.smime.ui');

/**
 * @class Grommunio.plugins.smime.ui.FormPanel
 * @extends Ext.FormPanel
 *
 * Extending the original {@link Ext.FormPanel} to be able to set the
 * action url of the form in the config.
 */
Grommunio.plugins.smime.ui.FormPanel = Ext.extend(Ext.FormPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config){
		config = config || {};
		Ext.apply(config, {
			xtype: 'smime.form'
		});

		Grommunio.plugins.smime.ui.FormPanel.superclass.constructor.call(this, config);
	},

	// private
	// Overridden to add the action attribute to the form
	initComponent : function()
	{
		Grommunio.plugins.smime.ui.FormPanel.superclass.initComponent.apply(this, arguments);

		Ext.applyIf(this.bodyCfg, {
			action: this.url
		});
	}
});

Ext.reg('smime.form', Grommunio.plugins.smime.ui.FormPanel);
