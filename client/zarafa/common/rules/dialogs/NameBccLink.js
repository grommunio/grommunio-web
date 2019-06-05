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

        var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
        var Restrictions = Zarafa.core.mapi.Restrictions;

        // Invalid conditionFlag
        if (this.conditionFlag !== Zarafa.common.rules.data.ConditionFlags.NAME_BCC) {
            return false;
        }
        var currCoreVersion = container.getVersion().getZCP();
        var versionCompare = container.versionRecord.versionCompare(currCoreVersion,"8.7.2");

        // Property value of PR_MESSAGE_RECIP_ME is false for kopano core version below '8.7.2'
        // and true for the version '8.7.2' and above.
        var recipMeValue = versionCompare === -1 ? false : true;

        return RestrictionFactory.createResAnd([
            RestrictionFactory.dataResProperty('PR_MESSAGE_RECIP_ME', Restrictions.RELOP_EQ, recipMeValue),
            RestrictionFactory.dataResProperty('PR_MESSAGE_CC_ME', Restrictions.RELOP_EQ, false),
            RestrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', Restrictions.RELOP_EQ, false)
        ]);

    }
});

Ext.reg('zarafa.namebcclink', Zarafa.common.rules.dialogs.NameBccLink);
