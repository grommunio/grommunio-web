/*
 * #dependsFile client/zarafa/common/rules/data/ConditionFlags.js
 */
Ext.namespace('Zarafa.common.rules.data');

/**
 * @class Zarafa.common.rules.data.RulesData
 *
 * Static methods for getting condition definitions and actions definitions.
 * @singleton
 */
Zarafa.common.rules.data.RulesData = {

	/**
	 * Function will return key-value pair of Object which contains key as {@link Zarafa.common.rules.data.ConditionFlags}
	 * and value as Function. These function will be used to generate rule condition restrictions.
	 * This function will be called by {@link Zarafa.common.data.ConditionRuleFactory#constructor}
	 * to register condition definitions.
	 *
	 * @return {Object} Object of Condition Definitions.
	 */
	getConditionRestriction: function ()
	{
		var restrictionFactory = Zarafa.core.data.RestrictionFactory;
		var restrictions = Zarafa.core.mapi.Restrictions;
		var rulesData = this;

		var conditionFlags = Zarafa.common.rules.data.ConditionFlags;
		return {
			[conditionFlags.ATLEAST_SIZE]: function (options) {
				// options.value should be in bytes unit.
				return restrictionFactory.dataResProperty('PR_MESSAGE_SIZE', restrictions.RELOP_GE, options.value);
			},
			[conditionFlags.ATMOST_SIZE]: function (options) {
				// options.value should be in bytes unit.
				return restrictionFactory.dataResProperty('PR_MESSAGE_SIZE', restrictions.RELOP_LE, options.value);
			},
			[conditionFlags.SUBJECT_WORDS]: function (options) {
				return rulesData.getCommonWordConditions('PR_SUBJECT', options.store);
			},
			[conditionFlags.BODY_WORDS]: function (options) {
				return rulesData.getCommonWordConditions('PR_BODY', options.store);
			},
			[conditionFlags.TRANSPORTHEADER_WORDS]: function (options) {
				return rulesData.getCommonWordConditions('PR_TRANSPORT_MESSAGE_HEADERS', options.store);
			},
			[conditionFlags.SENDER_WORDS]: function (options) {
				// requires store in which the words are stored
				if (!options.store) {
					return false;
				}

				var conditions = [];
				options.store.each(function (word) {
					var value = Zarafa.core.Util.stringToHex(word.get('words'));
					conditions.push(restrictionFactory.dataResContent('PR_SENDER_SEARCH_KEY', restrictions.FL_SUBSTRING, value));
				}, this);

				return rulesData.createOrRestriction(conditions);
			},
			[conditionFlags.RECIPIENT_WORDS]: function (options) {
				// requires store in which the words are stored
				if (!options.store) {
					return false;
				}

				var conditions = [];
				options.store.each(function (word) {
					conditions.push(
						restrictionFactory.createResSubRestriction(
							'PR_MESSAGE_RECIPIENTS',
							restrictionFactory.dataResContent(
								'PR_SMTP_ADDRESS',
								restrictions.FL_SUBSTRING | restrictions.FL_IGNORECASE,
								word.get('words')
							)
						)
					);
				}, this);

				return rulesData.createOrRestriction(conditions);
			},
			[conditionFlags.ATTACHMENT]: function () {
				return restrictionFactory.dataResBitmask('PR_MESSAGE_FLAGS',
					restrictions.BMR_NEZ,
					Zarafa.core.mapi.MessageFlags.MSGFLAG_HASATTACH);
			},
			[conditionFlags.IMPORTANCE]: function (options) {
				// options.value should be type of {@link Zarafa.core.mapi.Importance}
				if (!options || Zarafa.core.mapi.Importance.getDisplayName(options.value) === '') {
					return false;
				}

				return restrictionFactory.dataResProperty('PR_IMPORTANCE', restrictions.RELOP_EQ, options.value);
			},
			[conditionFlags.RECEIVED_AFTER]: function (options) {
				// options.value should be type of {@link Zarafa.core.mapi.Importance}
				return restrictionFactory.dataResProperty('PR_MESSAGE_DELIVERY_TIME', restrictions.RELOP_GT, options.value);
			},
			[conditionFlags.RECEIVED_BEFORE]: function (options) {
				// options.value should be time value
				return restrictionFactory.dataResProperty('PR_MESSAGE_DELIVERY_TIME', restrictions.RELOP_LT, options.value);
			},
			[conditionFlags.SENSITIVITY]: function (options) {
				// options.value should be time value
				if (!options || Zarafa.core.mapi.Sensitivity.getDisplayName(options.value) === '') {
					return false;
				}

				return restrictionFactory.dataResProperty('PR_SENSITIVITY', restrictions.RELOP_EQ, options.value);
			},
			[conditionFlags.SENT_TO]: function (options) {
				// options.store should be type of {Zarafa.core.data.IPMRecipientStore}
				if (!options || !options.store) {
					return false;
				}
				var conditions = [];
				options.store.each(function (recipient) {
					if (recipient.isResolved()) {
						conditions.push(restrictionFactory.createResSubRestriction('PR_MESSAGE_RECIPIENTS',
							restrictionFactory.dataResComment(
								restrictionFactory.dataResProperty('PR_SEARCH_KEY', restrictions.RELOP_EQ, recipient.get('search_key'), '0x00010102'),
								{
									'0x60000003': Zarafa.core.mapi.RecipientType.MAPI_TO,
									'0x00010102': recipient.get('search_key'),
									'0x0001001E': recipient.get('display_name') + ' <' + recipient.get('smtp_address') + '>',
									'PR_DISPLAY_TYPE': recipient.get('display_type')
								})
						));
					}
				}, this);

				return rulesData.createOrRestriction(conditions);
			},
			[conditionFlags.RECEIVED_FROM]: function (options) {
				// options.store should be type of {Zarafa.core.data.IPMRecipientStore}
				if (!options || !options.store) {
					return false;
				}
				var conditions = [];
				options.store.each(function (recipient) {
					if (recipient.isResolved()) {
						conditions.push(restrictionFactory.dataResComment(
							restrictionFactory.dataResProperty('PR_SENDER_SEARCH_KEY', restrictions.RELOP_EQ, recipient.get('search_key'), '0x00010102'),
							{
								'0x60000003': Zarafa.core.mapi.RecipientType.MAPI_TO,
								'0x00010102': recipient.get('search_key'),
								'0x0001001E': recipient.get('display_name') + ' <' + recipient.get('smtp_address') + '>',
								'PR_DISPLAY_TYPE': recipient.get('display_type')
							}));
					}
				}, this);

				return rulesData.createOrRestriction(conditions);
			},
			[conditionFlags.SENT_TO_ME]: function () {
				return restrictionFactory.dataResProperty('PR_MESSAGE_TO_ME',
					restrictions.RELOP_EQ,
					true,
					'0x0057000B');
			},
			[conditionFlags.SENT_TO_ME_ONLY]: function () {
				return restrictionFactory.createResAnd([
					// The PR_MESSAGE_TO_ME property should be set to 'true'
					restrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', restrictions.RELOP_EQ, true),
					// The PR_DISPLAY_TO property should not contain the ';' character (this implies a single recipient).
					restrictionFactory.createResNot(
						restrictionFactory.dataResContent('PR_DISPLAY_TO', restrictions.FL_SUBSTRING, ';')
					),
					// The PR_DISPLAY_CC property should be empty
					restrictionFactory.dataResProperty('PR_DISPLAY_CC', restrictions.RELOP_EQ, '')
				]);
			},
			[conditionFlags.NAME_BCC]: function (options) {
				// options.value should be boolean according to kopano core version.
				if (!Ext.isBoolean(options.value)) {
					return false;
				}

				return restrictionFactory.createResAnd([
					restrictionFactory.dataResProperty('PR_MESSAGE_RECIP_ME', restrictions.RELOP_EQ, options.value),
					restrictionFactory.dataResProperty('PR_MESSAGE_CC_ME', restrictions.RELOP_EQ, false),
					restrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', restrictions.RELOP_EQ, false)
				]);
			},
			[conditionFlags.SENT_CC_ME]: function () {
				return restrictionFactory.createResAnd([
					restrictionFactory.dataResProperty('PR_MESSAGE_CC_ME', restrictions.RELOP_EQ, true),
					restrictionFactory.dataResProperty('PR_MESSAGE_RECIP_ME', restrictions.RELOP_EQ, true),
					restrictionFactory.dataResProperty('PR_MESSAGE_TO_ME', restrictions.RELOP_EQ, false)
				]);
			},
			[conditionFlags.NAME_TO_CC]: function () {
				return restrictionFactory.dataResProperty('PR_MESSAGE_RECIP_ME',
					restrictions.RELOP_EQ, true, '0x0059000B');
			},
			[conditionFlags.NONE]: function () {
				// An PR_MESSAGE_CLASS must always exists, therefore this rule is always true.
				return restrictionFactory.dataResExist('PR_MESSAGE_CLASS');
			},
			[conditionFlags.UNKNOWN]: false
		};
	},

	/**
	 * This is common function which will create and return OR restriction according to given conditions in parameter.
	 *
	 * @param {Array} conditions array for which we need to create OR restriction.
	 * @return {Array} restriction for conditions or false if conditions array is empty.
	 */
	createOrRestriction : function(conditions)
	{
		var restrictionFactory = Zarafa.core.data.RestrictionFactory;

		// If there was only 1 condtion, we don't need to convert
		// it to a OR subrestriction. If we have more then 1 condtion,
		// then we should create the OR restriction.
		if (Ext.isArray(conditions)) {
			if (conditions.length === 1) {
				return conditions[0];
			} else if (conditions.length > 1) {
				return restrictionFactory.createResOr(conditions);
			}
		}

		return false;
	},

	/**
	 * Function will return restriction according to given property in parameter.
	 * This is common function to generate restriction for condition types such as {@link Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS},
	 * {@link Zarafa.common.rules.data.ConditionFlags.BODY_WORDS} and {@link Zarafa.common.rules.data.ConditionFlags.TRANSPORTHEADER_WORDS}.
	 *
	 * @param {String} property which required to generate restriction according to condition type.
	 * @param {Ext.data.Store} store The store in which the words are stored.
	 * @return {Array} restriction for condition or returns false if store is not given in parameter.
	 */
	getCommonWordConditions: function (property, store)
	{
		// requires store in which the words are stored
		if (!store) {
			return false;
		}

		var restrictionFactory = Zarafa.core.data.RestrictionFactory;
		var restrictions = Zarafa.core.mapi.Restrictions;
		var conditions = [];

		store.each(function (word) {
			conditions.push(restrictionFactory.dataResContent(property, restrictions.FL_SUBSTRING | restrictions.FL_IGNORECASE, word.get('words')));
		}, this);

		return this.createOrRestriction(conditions);
	},

	/**
	 * Function will return key-value pair of Object which contains key as {@link Zarafa.common.rules.data.actionFlags}
	 * and value as Function. These function will be used to generate rule action object.
	 * This function will be called by {@link Zarafa.common.data.ActionRulesFactory#constructor}
	 * to register action definitions.
	 *
	 * @return {Object} Object of Action Definitions.
	 */
	getAction: function ()
	{
		var actionFlags = Zarafa.common.rules.data.ActionFlags;
		var rulesData = this;

		return {
			[actionFlags.MOVE]: function (options) {
				return rulesData.getFolderSelectionAction(actionFlags.MOVE, options);
			},
			[actionFlags.COPY]: function (options) {
				return rulesData.getFolderSelectionAction(actionFlags.COPY, options);
			},
			[actionFlags.DELETE]: function (options) {
				return rulesData.getFolderSelectionAction(actionFlags.DELETE, options);
			},
			[actionFlags.MARK_AS_READ]: function () {
				var action = {};
				action.action = Zarafa.core.mapi.RuleActions.OP_MARK_AS_READ;
				action.flags = 0;
				action.flavor = 0;
				return action;
			},
			[actionFlags.REDIRECT]: function (options) {
				return rulesData.getUserSelectionAction(actionFlags.REDIRECT, options);
			},
			[actionFlags.FORWARD]: function (options) {
				return rulesData.getUserSelectionAction(actionFlags.FORWARD, options);
			},
			[actionFlags.FORWARD_ATTACH]: function (options) {
				return rulesData.getUserSelectionAction(actionFlags.FORWARD_ATTACH, options);
			},
			[actionFlags.UNKNOWN]: false
		};
	},

	/**
	 * Function will return restriction according to given actionType in parameter.
	 * This is common function to get action for action types such as {@link Zarafa.common.rules.data.actionFlags.MOVE},
	 * {@link Zarafa.common.rules.data.actionFlags.DELETE} and {@link Zarafa.common.rules.data.actionFlags.COPY}.
	 *
	 * @param {Zarafa.common.rules.data.actionFlags} actionType which required to get action according to given action type.
	 * @param {Object} options object that must contain value required to generate action according to action type.
	 * @return {Object} action for given action type or returns false if given actionType is wrong or required option is not given.
	 */
	getFolderSelectionAction: function (actionType, options)
	{
		var action = {};
		var actionFlags = Zarafa.common.rules.data.ActionFlags;
		var ruleActions = Zarafa.core.mapi.RuleActions;

		// Folder is required to set the action.
		// If method is called other than Rule component then only Folder is not required but for the Delete action,
		// Folder is necessary.
		if (options) {
			if (!options.folder) {
				return false;
			}
			action.folderentryid = options.folder.get('entryid');
			action.storeentryid = options.folder.get('store_entryid');
		} else {
			// wastebasket folder must be provided for delete action.
			if (actionType === actionFlags.DELETE) {
				return false;
			}
		} 

		if (actionType === actionFlags.COPY) {
			action.action = ruleActions.OP_COPY;
		} else {
			action.action = ruleActions.OP_MOVE;
		}

		action.flags = 0;
		action.flavor = 0;
		return action;
	},

	/**
	 * Function will return restriction according to given actionType in parameter.
	 * This is common function to get action for action types such as {@link Zarafa.common.rules.data.actionFlags.FORWARD},
	 * {@link Zarafa.common.rules.data.actionFlags.FORWARD_ATTACH} and {@link Zarafa.common.rules.data.actionFlags.REDIRECT}.
	 *
	 * @param {Zarafa.common.rules.data.actionFlags} actionType which required to get action according to given action type.
	 * @param {Object} options options object that must contain value required to generate action according to action type.
	 * @return {Object} action for given action type or returns false if given actionType is wrong or required option is not given.
	 */
	getUserSelectionAction: function (actionType, options)
	{
		var action = {};
		var actionFlags = Zarafa.common.rules.data.ActionFlags;
		var ruleActions = Zarafa.core.mapi.RuleActions;
		var flavorFlags = Zarafa.core.mapi.FlavorFlags;

		// No recipients selected, this means
		// we can't create an action.
		if (!options || !options.store || options.store.getCount() === 0) {
			return false;
		}

		// Set the Address list in the action
		action.adrlist = [];

		options.store.each(function (recipient) {
			action.adrlist.push({
				PR_ENTRYID: recipient.get('entryid'),
				PR_OBJECT_TYPE: recipient.get('object_type'),
				PR_DISPLAY_NAME: recipient.get('display_name'),
				PR_DISPLAY_TYPE: recipient.get('display_type'),
				PR_EMAIL_ADDRESS: recipient.get('email_address') || recipient.get('smtp_address'),
				PR_SMTP_ADDRESS: recipient.get('smtp_address'),
				PR_ADDRTYPE: recipient.get('address_type'),
				PR_RECIPIENT_TYPE: recipient.get('recipient_type'),
				PR_SEARCH_KEY: recipient.get('search_key')
			});
		}, this);

		action.action = ruleActions.OP_FORWARD;
		action.flags = 0;
		action.flavor = 0;

		if (actionType === actionFlags.REDIRECT) {
			action.flavor = flavorFlags.FWD_PRESERVE_SENDER | flavorFlags.FWD_DO_NOT_MUNGE_MSG;
		} else if (actionType === actionFlags.FORWARD_ATTACH) {
			action.flavor = flavorFlags.FWD_AS_ATTACHMENT;
		}
		return action;
	}
};