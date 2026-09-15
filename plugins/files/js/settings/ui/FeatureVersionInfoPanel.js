/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.settings.ui');

/**
 * @class Grommunio.plugins.files.settings.ui.FeatureVersionInfoPanel
 * @extends Ext.Panel
 * @xtype filesplugin.featureversioninfopanel
 *
 * Will generate UI for {@link Grommunio.plugins.files.settings.ui.FeatureVersionInfoContentPanel FeatureVersionInfoContentPanel}.
 */
Grommunio.plugins.files.settings.ui.FeatureVersionInfoPanel = Ext.extend(Ext.Panel, {

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

			xtype      : 'filesplugin.featureversioninfopanel',
			items      : this.createPanelItems(config),
			buttons    : [{
				text   : _('Close'),
				handler: this.doClose,
				scope  : this
			}]
		});

		Grommunio.plugins.files.settings.ui.FeatureVersionInfoPanel.superclass.constructor.call(this, config);

		this.doReload();
	},

	/**
	 * Close the dialog.
	 */
	doClose: function () {
		this.dialog.close();
	},

	/**
	 * Reload the version store.
	 */
	doReload: function () {
		var responseHandler = new Grommunio.core.data.AbstractResponseHandler({
			doGetversion: this.gotVersionValues.createDelegate(this)
		});

		container.getRequest().singleRequest(
			'filesaccountmodule',
			'getversion',
			{
				accountId: this.account.get("id")
			},
			responseHandler
		);
	},

	/**
	 * Function is called after we received the response object from the server.
	 * It will update the textfield values.
	 *
	 * @param {Object} response version information object
	 */
	gotVersionValues: function (response) {
		this.backendVersionField.setValue(response.version.backend);
		this.serverVersionField.setValue(response.version.server);
	},

	/**
	 * Function will create panel items for {@link Grommunio.plugins.files.settings.ui.FeatureVersionInfoPanel FeatureVersionInfoPanel}.
	 *
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems: function () {
		return [{
			xtype     : 'form',
			border    : false,
			labelAlign: 'left',
			items     : [{
				xtype     : 'displayfield',
				ref       : '../backendVersionField',
				fieldLabel: _('Backend'),
				value     : _('Loading…')
			}, {
				xtype     : 'displayfield',
				ref       : '../serverVersionField',
				fieldLabel: this.account.get('backend'),
				value     : _('Loading…')
			}]
		}];
	}
});

Ext.reg('filesplugin.featureversioninfopanel', Grommunio.plugins.files.settings.ui.FeatureVersionInfoPanel);
