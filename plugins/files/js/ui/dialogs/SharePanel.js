Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.SharePanel
 * @extends Ext.Panel
 * @xtype filesplugin.sharepanel
 *
 * This panel must be extended! It will then decide if it should be displayed or not.
 * Make sure that the plugin has a name set! The name should be in the following format:
 * filesbackend<Backendname>
 *
 * e.g.: filesbackendSMB, filesbackendOwncloud....
 */
Zarafa.plugins.files.ui.dialogs.SharePanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		var records = config.ownerCt.records;
		var hidden = true;


		// check if this panel should be enabled
		if (records.length > 0) {
			var account = records[0].getAccount();
			var backend = account.get("backend");
			var backendPlugin = config.plugin.info.name;

			// "filesbackend" has 12 chars
			if (backend === backendPlugin.substring(12)) {
				hidden = false;
			}
		}

		if (hidden) {
			Ext.applyIf(config, {
				disabled: true,
				hidden  : true
			});
		}


		Zarafa.plugins.files.ui.dialogs.SharePanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.sharepanel', Zarafa.plugins.files.ui.dialogs.SharePanel);