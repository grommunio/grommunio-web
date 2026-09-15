/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.ImportanceButton
 * @extends Grommunio.core.ui.menu.ConditionalItem
 * @xtype grommunio.importancebutton
 *
 * Extension of the {@link Grommunio.core.ui.menu.ConditionalItem Conditional MenuItem}.
 * This class adds support for easily setting the importance on a {@link Grommunio.core.data.IPMRecord record}.
 */
Grommunio.common.ui.ImportanceButton = Ext.extend(Grommunio.core.ui.menu.ConditionalItem, {
	/**
	 * @cfg {Number} The importance value for this button
	 */
	importanceValue: 1,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.importancebutton',
			handler: function() {
				this.applyFlag(this.getRecords());
			},
			scope: this
		});

		Grommunio.common.ui.ImportanceButton.superclass.constructor.call(this, config);
	},

	/**
	 * Apply the Flag settings as defined in this button to the
	 * {@link Grommunio.core.data.IPMRecord records} given as arguments.
	 *
	 * @param {Grommunio.core.data.IPMRecord} records The records to which the flags must be applied
	 */
	applyFlag: function(records)
	{
		if (Ext.isEmpty(records)) {
			return;
		}

		var store;

		Ext.each(records, function(record) {
			store = record.getStore();
			record.set('importance', this.importanceValue);
		}, this);

		store.save(records);
	}
});

Ext.reg('grommunio.importancebutton', Grommunio.common.ui.ImportanceButton);
