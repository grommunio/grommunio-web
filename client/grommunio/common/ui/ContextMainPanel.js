/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.ContextMainPanel
 * @extends Ext.Panel
 * @xtype grommunio.contextmainpanel
 */
Grommunio.common.ui.ContextMainPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Grommunio.mail.MailContext} context The context to which this panel belongs
	 */
	context: undefined,

	/**
	 * The {@link Grommunio.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Grommunio.mail.MailContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			xtype: 'grommunio.contextmainpanel',
			border: false,
			cls: 'grommunio-panel'
		});

		Grommunio.common.ui.ContextMainPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.contextmainpanel', Grommunio.common.ui.ContextMainPanel);
