/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.ImportanceLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.importancelink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#IMPORTANCE IMPORTANCE}
 * condition. This will allow the user to select the preferred importance and can generate a proper
 * condition for it.
 */
Grommunio.common.rules.dialogs.ImportanceLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'combo',
				ref: 'importanceCombo',
				width: 100,
				store: {
					xtype: 'jsonstore',
					fields: [ 'name', 'value' ],
					data: Grommunio.common.data.ImportanceFlags.flags
				},
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners: {
					select: function() { this.isModified = true; },
					scope: this
				}
			}]
		});

		Grommunio.common.rules.dialogs.ImportanceLink.superclass.constructor.call(this, config);
	},

	/**
	 * Apply an action onto the DataView, this will parse the condition and show
	 * the contents in a user-friendly way to the user.
	 * @param {Grommunio.common.rules.data.ConditionFlags} conditionFlag The condition type
	 * which identifies the exact type of the condition.
	 * @param {Object} condition The condition to apply
	 */
	setCondition: function(conditionFlag, condition)
	{
		var importance = Grommunio.core.mapi.Importance['NORMAL'];

		if (condition) {
			importance = condition[1][Grommunio.core.mapi.Restrictions.VALUE]['PR_IMPORTANCE'];
		}

		this.importanceCombo.setValue(importance);
		Grommunio.common.rules.dialogs.ImportanceLink.superclass.setCondition.apply(this, arguments);
	},

	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition: function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		var value = this.importanceCombo.getValue();
		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition({value: value});
	}
});

Ext.reg('grommunio.importancelink', Grommunio.common.rules.dialogs.ImportanceLink);
