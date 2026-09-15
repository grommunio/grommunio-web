/**
 * @class Grommunio.common.rules.dialogs.AtMostSizeLink
 * @extends Grommunio.common.rules.dialogs.AtLeatSizeLink
 * @xtype grommunio.atmostsizelink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#ATMOST_SIZE}
 * condition. This will allow the user to input a size and select a size unit. This will generate a proper
 * condition for it and set 'rule_msg_atmost_size_unit' record property.
 */
Grommunio.common.rules.dialogs.AtMostSizeLink = Ext.extend(Grommunio.common.rules.dialogs.AtLeatSizeLink, {
  /**
   * This property is to identify the current condition is AtMostSizeLink.
   * This will help to distinguish between {@link Grommunio.common.rules.dialogs.AtMostSizeLink AtMostSizeLink} class and
   * {@link Grommunio.common.rules.dialogs.AtLeatSizeLink AtLeatSizeLink} class.
   * This is used in {@link Grommunio.common.rules.dialogs.AtLeatSizeLink#getCondition#setSizeUnit} functions.
   * @property
   * @type Boolean
   */
  atMostSizeLink: true
});

Ext.reg('grommunio.atmostsizelink', Grommunio.common.rules.dialogs.AtMostSizeLink);
