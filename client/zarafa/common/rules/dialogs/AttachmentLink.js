/*
 * #dependsFile client/zarafa/common/rules/dialogs/BaseLink.js
 */
Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.AttachmentLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.attachmentlink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#ATTACHMENT ATTACHMENT}
 * verifies if the message has an attachment.
 */
Zarafa.common.rules.dialogs.AttachmentLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition : function()
	{
		if (this.isModified !== true) {
			return this.condition;
		}

		// Invalid conditionFlag
		if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.ATTACHMENT) {
			return false;
		}

		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
		return conditionDefinition();
	}
});

Ext.reg('zarafa.attachmentlink', Zarafa.common.rules.dialogs.AttachmentLink);
