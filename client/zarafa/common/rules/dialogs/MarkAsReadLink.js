Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.MarkAsReadLink
 * @extends Ext.Container
 * @xtype zarafa.markasreadlink
 *
 * Extension of the {@link Ext.Container Container}
 * especially for the {@link Zarafa.common.rules.data.ActionFlags#MARK_AS_READ  MARK_AS_READ ActionFlag}.
 * This component handles MARK_AS_READ action.
 * This will not show anything to the user, but during {@link #setAction} this will force
 * the {@link #actionFlag} to be {@link Zarafa.common.rules.data.ActionFlags#MARK_AS_READ MARK_AS_READ}
 */
Zarafa.common.rules.dialogs.MarkAsReadLink = Ext.extend(Ext.Container,{

	/**
	 * The Action type which is handled by this view
	 * This is set during {@link #setAction}.
	 * @property
	 * @type Zarafa.common.rules.data.ActionFlags
	 */
	actionFlag : undefined,

	/**
	 * The action property which was configured during
	 * {@link #setAction}.
	 * @property
	 * @type Object
	 */
	action : undefined,

	/**
	 * True if the action was modified by the user, if this is false,
	 * then {@link #getAction} will return {@link #action} instead
	 * of returning a new object.
	 * @property
	 * @type Boolean
	 */
	isModified : false,

	/**
	 * True if the action/condition is complete and valid,
	 * False will denote that action/condition is invalid or incomplete
	 * if this is true, then {@link #getCondition} will return {@link #condition} instead
	 * of returning a new object and {@link #getAction} will return {@link #action}
	 * instead of returning a new Object.
	 * @property
	 * @type Boolean
	 */
	isValid : true,

	/**
      * Apply an action onto the DataView, this will parse the action and show
      * the contents in a user-friendly way to the user.
      * @param {Zarafa.common.rules.data.ActionFlags} actionFlag The action type
      * which identifies the exact type of the action.
      * @param {Object} action The action to apply
      */
    setAction : function(actionFlag, action)
	{
		this.isValid = action ?  true : false;
		this.actionFlag = actionFlag;
		this.action = action;
		this.isModified = !Ext.isDefined(action);
	},

	/**
	 * Obtain the action as configured by the user
	 * @return {Object} The action
	 */
	getAction : function()
	{
		if (this.isModified !== true && this.isValid === true) {
			return this.action;
		}

		var actionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.ACTION);
		var actionDefinition = actionFactory.getActionById(this.actionFlag);
		return actionDefinition(this.actionFlag);
	}

});

Ext.reg('zarafa.markasreadlink', Zarafa.common.rules.dialogs.MarkAsReadLink);