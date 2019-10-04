Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.NameBccLink
 * @extends Zarafa.common.rules.dialogs.BaseLink
 * @xtype zarafa.namebcclink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#NAME_BCC  NAME_BCC}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Zarafa.common.rules.dialogs.NameBccLink = Ext.extend(Zarafa.common.rules.dialogs.BaseLink, {
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
        if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.NAME_BCC) {
            return false;
        }
        var currCoreVersion = container.getVersion().getZCP();
        var versionCompare = container.versionRecord.versionCompare(currCoreVersion,"8.7.2");

        // Property value of PR_MESSAGE_RECIP_ME is false for kopano core version below '8.7.2'
        // and true for the version '8.7.2' and above.
        var recipMeValue = versionCompare === -1 ? false : true;
        var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
        var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
        return conditionDefinition({value : recipMeValue});

    }
});

Ext.reg('zarafa.namebcclink', Zarafa.common.rules.dialogs.NameBccLink);
