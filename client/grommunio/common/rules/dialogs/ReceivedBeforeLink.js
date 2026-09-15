/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.ReceivedBeforeLink
 * @extends Grommunio.common.rules.dialogs.ReceivedAfterLink
 * @xtype grommunio.receivedbeforelink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#RECEIVED_BEFORE RECEIVED_BEFORE}
 * condition. This will allow the user to select a date and can generate a proper
 * condition for it.
 */
Grommunio.common.rules.dialogs.ReceivedBeforeLink = Ext.extend(Grommunio.common.rules.dialogs.ReceivedAfterLink, {
	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition: function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		var value = this.receivedDate.getValue().getTime()/1000;
		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);

		return conditionDefinition({value: value});
	}
});

Ext.reg('grommunio.receivedbeforelink', Grommunio.common.rules.dialogs.ReceivedBeforeLink);
