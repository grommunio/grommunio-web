/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.SentCcMeLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.senttomelink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#SENT_TO_ME_ONLY SENT_TO_ME_ONLY}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Grommunio.common.rules.dialogs.SentCcMeLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition: function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		// Invalid conditionFlag
		if (this.conditionFlag !== Grommunio.common.rules.data.ConditionFlags.SENT_CC_ME) {
			return false;
		}

		// Create a restriction
		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('grommunio.sentccmelink', Grommunio.common.rules.dialogs.SentCcMeLink);
