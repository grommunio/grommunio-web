/**
 * @class Zarafa.common.rules.dialogs.AtMostSizeLink
 * @extends Zarafa.common.rules.dialogs.AtLeatSizeLink
 * @xtype zarafa.atmostsizelink
 *
 * Condition component for the {@link Zarafa.common.rules.data.ConditionFlags#ATMOST_SIZE}
 * condition. This will allow the user to input a size and select a size unit. This will generate a proper
 * condition for it and set 'rule_msg_atmost_size_unit' record property.
 */
Zarafa.common.rules.dialogs.AtMostSizeLink = Ext.extend(Zarafa.common.rules.dialogs.AtLeatSizeLink, {
    /**
     * This property is to identify the current condition is AtMostSizeLink.
     * This will help to distinguish between {@link Zarafa.common.rules.dialogs.AtMostSizeLink AtMostSizeLink} class and
     * {@link Zarafa.common.rules.dialogs.AtLeatSizeLink AtLeatSizeLink} class.
     * This is used in {@link Zarafa.common.rules.dialogs.AtLeatSizeLink#getCondition#setSizeUnit} functions.
     * @property
     * @type Boolean
     */
    atMostSizeLink : true
});

Ext.reg('zarafa.atmostsizelink', Zarafa.common.rules.dialogs.AtMostSizeLink);