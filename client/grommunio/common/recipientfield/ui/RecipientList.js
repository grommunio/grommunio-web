/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recipientfield.ui');

/**
 * @class Grommunio.common.recipientfield.ui.RecipientList
 * @extends Grommunio.common.recipientfield.ui.RecipientField
 * @xtype grommunio.recipientlist
 * This extends the {@link Grommunio.common.recipientfield.ui.RecipientField RecipientField}
 * and transforms the boxes into a large list.
 */
Grommunio.common.recipientfield.ui.RecipientList = Ext.extend(Grommunio.common.recipientfield.ui.RecipientField, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType: 'grommunio.recipientbox',
			boxConfig: {
				height: config.inputFieldHeight || this.inputFieldHeight
			},
			listMode: true,
			autoHeight: true,
			autoScroll: false
		});

		Grommunio.common.recipientfield.ui.RecipientList.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.recipientlist', Grommunio.common.recipientfield.ui.RecipientList);
