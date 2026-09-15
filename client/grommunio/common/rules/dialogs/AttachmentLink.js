/*
 * #dependsFile client/grommunio/common/rules/dialogs/BaseLink.js
 */
Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.AttachmentLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.attachmentlink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#ATTACHMENT ATTACHMENT}
 * verifies if the message has an attachment.
 */
Grommunio.common.rules.dialogs.AttachmentLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
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
		if (this.conditionFlag !== Grommunio.common.rules.data.ConditionFlags.ATTACHMENT) {
			return false;
		}

		var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('grommunio.attachmentlink', Grommunio.common.rules.dialogs.AttachmentLink);
