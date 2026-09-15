/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.SentToLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.senttolink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#SENT_TO_ME SENT_TO_ME}
 * condition Flag. Which checks if the user is in the TO field.
 */
Grommunio.common.rules.dialogs.SentToLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
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
		if (this.conditionFlag !== Grommunio.common.rules.data.ConditionFlags.SENT_TO_ME) {
			return false;
		}

		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('grommunio.senttolink', Grommunio.common.rules.dialogs.SentToLink);
