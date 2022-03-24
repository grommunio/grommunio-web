Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.FeatureQuotaInfoPanel
 * @extends Ext.Panel
 * @xtype filesplugin.featurequotainfopanel
 *
 * Will generate UI for {@link Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel FeatureQuotaInfoContentPanel}.
 */
Zarafa.plugins.files.settings.ui.FeatureQuotaInfoPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Object} The current loaded account record.
	 */
	account: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure.
	 */
	constructor: function (config) {
		config = config || {};

		if (config.item) {
			this.account = config.item;
		}

		Ext.applyIf(config, {
			xtype      : 'filesplugin.featurequotainfopanel',
			items      : this.createPanelItems(),
			buttons    : [{
				text   : dgettext('plugin_files', 'Reload'),
				handler: this.doReload.createDelegate(this),
				scope  : this
			}, {
				text   : dgettext('plugin_files', 'Close'),
				handler: this.doClose,
				scope  : this
			}]
		});

		Zarafa.plugins.files.settings.ui.FeatureQuotaInfoPanel.superclass.constructor.call(this, config);

		this.doReload();
	},

	/**
	 * Close the dialog.
	 */
	doClose: function () {
		this.dialog.close();
	},

	/**
	 * Reload the quota store.
	 */
	doReload: function () {
		var responseHandler = new Zarafa.core.data.AbstractResponseHandler({
			doGetquota: this.gotQuotaValues.createDelegate(this)
		});

		container.getRequest().singleRequest(
			'filesaccountmodule',
			'getquota',
			{
				accountId: this.account.get("id"),
				folder   : "/"
			},
			responseHandler
		);
	},

	/**
	 * Function is called after we received the response object from the server.
	 * It sets the quota information in the form panel.
	 *
	 * @param {Object} response object from the server
	 */
	gotQuotaValues: function (response) {
		if (!this.formPanel) {
			return;
		}

		var used = parseInt(response["quota"][0].amount);
		var available = parseInt(response["quota"][1].amount);
		// Backend sometimes returns a negative value for available data, set it to zero.
		if (used < 0 ) {
			used = 0;
		}

		if (available < 0) {
			available = 0;
		}

		this.formPanel.getForm().setValues([
			{ id: 'usedField', value: Ext.util.Format.fileSize(used) },
			{ id: 'availableField', value: Ext.util.Format.fileSize(available) },
			{ id: 'totalField', value: Ext.util.Format.fileSize(available + used) }
		]);
	},

	/**
	 * Function will create panel items for {@link Zarafa.plugins.files.settings.ui.FeatureQuotaInfoPanel FeatureQuotaInfoPanel}.
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems: function () {
		return [{
			xtype: 'form',
			border: false,
			ref: 'formPanel',
			labelAlign: 'left',
			items: [{
				xtype     : 'displayfield',
				name      : 'usedField',
				fieldLabel: dgettext('plugin_files', 'Used'),
				value     : dgettext('plugin_files', 'Loading') + '&hellip;'
			}, {
				xtype     : 'displayfield',
				name      : 'availableField',
				fieldLabel: dgettext('plugin_files', 'Free'),
				value     : dgettext('plugin_files', 'Loading') + '&hellip;'
			}, {
				xtype     : 'displayfield',
				name      : 'totalField',
				fieldLabel: dgettext('plugin_files', 'Total'),
				value     : dgettext('plugin_files', 'Loading') + '&hellip;'
			}]
		}];
	}
});

Ext.reg('filesplugin.featurequotainfopanel', Zarafa.plugins.files.settings.ui.FeatureQuotaInfoPanel);
