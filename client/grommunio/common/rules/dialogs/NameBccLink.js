Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.NameBccLink
 * @extends Grommunio.common.rules.dialogs.BaseLink
 * @xtype grommunio.namebcclink
 *
 * Condition component for the {@link Grommunio.common.rules.data.ConditionFlags#NAME_BCC NAME_BCC}
 * condition Flag. This will not show anything to the user, but does generate a proper
 * restriction in {@link #getCondition}.
 */
Grommunio.common.rules.dialogs.NameBccLink = Ext.extend(Grommunio.common.rules.dialogs.BaseLink, {
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
    if (this.conditionFlag !== Grommunio.common.rules.data.ConditionFlags.NAME_BCC) {
      return false;
    }
    var currCoreVersion = container.getVersion().getZCP();
    var versionCompare = container.versionRecord.versionCompare(currCoreVersion,"8.7.2");

    var recipMeValue = versionCompare !== -1;
    var conditionFactory = container.getRulesFactoryByType(Grommunio.common.data.RulesFactoryType.CONDITION);
    var conditionDefinition = conditionFactory.getConditionById(this.conditionFlag);
    return conditionDefinition({value: recipMeValue});

  }
});

Ext.reg('grommunio.namebcclink', Grommunio.common.rules.dialogs.NameBccLink);
