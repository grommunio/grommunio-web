Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.UserSelectionLink
 * @extends Ext.BoxComponent
 * @xtype zarafa.userselectionlink
 */
Zarafa.common.rules.dialogs.UserSelectionLink = Ext.extend(Ext.BoxComponent, {
	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	emptyText :_('Select one...'),

	/**
	 * @cfg {String} userStringSeparator The separator which is used to separate list
	 * of user while displaying them as string.
	 */
	userStringSeparator : _('and'),

	/**
	 * @cfg {Zarafa.core.data.IPMRecipientStore} store The store in which
	 * the recipients are stored
	 */
	store : undefined,

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
	 * The Condition type which is handled by this view
	 * This is set during {@link #setCondition}.
	 * @property
	 * @type Zarafa.common.rules.data.ConditionFlags
	 */
	conditionFlag : undefined,

	/**
	 * The condition property which was configured during
	 * {@link #setCondition}.
	 * @property
	 * @type Object
	 */
	condition : undefined,

	/**
	 * True if the action/condition was modified by the user, if this is false,
	 * then {@link #getCondition} will return {@link #condition} instead
	 * of returning a new object and {@link #getAction} will return {@link #action}
	 * instead of returning a new Object.
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
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config,{
			xtype: 'zarafa.userselectionlink',
			border : false,
			autoScroll:true,
			anchor : '100%',
			multiSelect : false,
			store : new Zarafa.core.data.IPMRecipientStore(),
			tpl : new Ext.XTemplate(
				'<div class="zarafa-user-link">' +
					'<tpl for="list">' + 
						'<tpl if="!Ext.isEmpty(values.display_name)">' +
							'&quot;{display_name:htmlEncode}&quot;' +
						'</tpl>' +
						'<tpl if="Ext.isEmpty(values.display_name) && !Ext.isEmpty(values.smtp_address)">' +
							'&quot;{smtp_address:htmlEncode}&quot;' +
						'</tpl>' +
						'<tpl if="xcount &gt; 0 && xindex != xcount">' +
							'<span>&nbsp;{parent.seperator}&nbsp;</span>' +
						'</tpl>' +
					'</tpl>' +
				'</div>',
				{
					compiled : true
				}
			)
		});

		Zarafa.common.rules.dialogs.UserSelectionLink.superclass.constructor.call(this, config);
	},

	/**
	 * This function is called after the component has been rendered.
	 * This will register the {@link #onActivate} and {@link #onClick} event handlers.
	 * @private
	 */
	afterRender : function()
	{
		Zarafa.common.rules.dialogs.UserSelectionLink.superclass.initComponent.apply(this, arguments);

		this.mon(this.getActionEl(), 'click', this.onClick, this);
		this.mon(this.store, 'update', this.onRecipientUpdate, this);
		this.mon(this.store, 'add', this.onRecipientAdd, this);
		this.mon(this.store, 'resolved', this.onRecipientAdd, this);
	},

	/**
	 * Handler will be called when recipient in {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}.
	 * It could happen that recipient is updated after we have closed addressbook dialog (mainly in case of resolving)
	 * so we need to update the ui also
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	onRecipientUpdate : function(store, records, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			// update ui, after store is updated
			this.update(this.store);
		}
	},

	/**
	 * Handler will be called when recipient is added to {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPMRecipientRecord} records The records which have been added
	 * @private
	 */
	onRecipientAdd : function(store, records)
	{
		var record = records[0];
		// Only force expanding the distlist when it's a local distlist.
		if (record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST &&
			record.get('address_type') === 'MAPIPDL') {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'), 
				msg: _('Distribution lists are not supported in rules, would you like to replace the distribution list with its members?'), 
				buttons: Ext.MessageBox.YESNO, 
				fn: this.onExpandDistList.createDelegate(this, [record], 1),
				scope: this
			});
		}
	},

	/**
	 * Handler for messagebox which asks the user to expand the distribution list of remove it.
	 * @param {String} btn string containing either 'yes' or 'no
	 * @param {Zarafa.core.data.IPMRecipientRecord} recip The records which should been expanded
	 */
	onExpandDistList: function(btn, recip)
	{
		if(btn === 'yes') {
			this.store.expand(recip, true);
		}
		this.store.remove(recip);
	},

	/**
	 * Called when user clicks on a {@link Zarafa.common.rules.dialogs.UserSelectionLink}
	 * It opens user selection dialog dialog
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} evt The mouse event
	 * @protected
	 */
	onClick : function(dataView, index, node, evt)
	{
		var hideGroups = [];
		if(this.conditionFlag === Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM) {
			hideGroups.push('distribution_list');
		}

		var label;
		if (this.conditionFlag === Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM) {
			label = _('From');
		} else {
			label = _('To');
		}

		// Open addressbook dialog for selection of users
		Zarafa.common.Actions.openABUserMultiSelectionContent({
			listRestriction : {
				hide_groups : hideGroups
			},
			callback : function(record) {
				this.isModified = true;
				this.update(this.store);
			},
			convert : function(r) {
				return r.convertToRecipient();
			},
			scope : this,
			store : this.store,
			modal : true,
			selectionCfg : [{
				xtype : 'zarafa.recipientfield',
				fieldLabel : label + ':',
				height : 50,
				boxStore : this.store,
				flex : 1
			}]
		});
	},

	/**
	 * Apply an action onto the DataView, this will parse the condition and show
	 * the contents in a user-friendly way to the user.
	 * @param {Zarafa.common.rules.data.ConditionFlags} conditionFlag The condition type
	 * which identifies the exact type of the condition.
	 * @param {Object} condition The condition to apply
	 */
	setCondition : function(conditionFlag, condition)
	{
		this.store.removeAll();
		this.isValid = false;
		if (condition) {
			var Restrictions = Zarafa.core.mapi.Restrictions;
			var subs;

			switch (conditionFlag) {
				case Zarafa.common.rules.data.ConditionFlags.SENT_TO:

					// Check if a RES_OR restriction was provided, if
					// so we need to loop over all recipients from the list.
					if (condition[0] === Restrictions.RES_OR) {
						subs = condition[1];
					} else {
						subs = [ condition ];
					}

					for (var i = 0, len = subs.length; i < len; i++) {
						var value = subs[i][1][Restrictions.RESTRICTION];

						// Do not add empty recipient, it is possible that restriction might not have recipient.
						if(value[1] && value[1][Restrictions.PROPS] && value[1][Restrictions.PROPS]['0x0001001E']) {
							var recipient = this.store.parseRecipient(value[1][Restrictions.PROPS]['0x0001001E']);
							recipient.set('display_type', value[1][Restrictions.PROPS]['PR_DISPLAY_TYPE']);
							recipient.set('search_key', value[1][Restrictions.RESTRICTION][1][Restrictions.VALUE]['0x00010102']);

							this.store.add(recipient);
							this.isValid = true;
						}
					}
					break;
				case Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM:

					// Check if a RES_OR restriction was provided, if
					// so we need to loop over all recipients from the list.
					if (condition[0] === Restrictions.RES_OR) {
						subs = condition[1];
					} else {
						subs = [ condition ];
					}

					for (var i = 0, len = subs.length; i < len; i++) {
						var value = subs[i][1];

						// Do not add empty recipient, it is possible that restriction might not have recipient.
						if(value[Restrictions.PROPS] && value[Restrictions.PROPS]['0x0001001E']) {
							var recipient = this.store.parseRecipient(value[Restrictions.PROPS]['0x0001001E']);
							recipient.set('display_type', value[Restrictions.PROPS]['PR_DISPLAY_TYPE']);
							recipient.set('search_key', value[Restrictions.RESTRICTION][1][Restrictions.VALUE]['0x00010102']);

							this.store.add(recipient);
							this.isValid = true;
						}
					}
					break;
				default:
					break;
			}
		}

		this.conditionFlag = conditionFlag;
		this.condition = condition;
		this.userStringSeparator = _('or');
		this.isModified = !Ext.isDefined(condition);
		this.update(this.store);
	},

	/**
	 * Obtain the condition as configured by the user
	 * @return {Object} The condition
	 */
	getCondition : function()
	{
		if (this.isModified !== true && this.isValid === true) {
			return this.condition;
		}

		var conditions = [];

		// No recipients selected, this means
		// we can't create a condition.
		if (this.store.getCount() === 0) {
			return false;
		}

		switch (this.conditionFlag) {
			case Zarafa.common.rules.data.ConditionFlags.SENT_TO:
				this.store.each(function(recipient) {
					if (recipient.isResolved()) {
						conditions.push(this.createToRestriction(recipient));
					}
				}, this);
				break;
			case Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM:
				this.store.each(function(recipient) {
					if (recipient.isResolved()) {
						conditions.push(this.createFromRestriction(recipient));
					}
				}, this);
				break;
			default:
				// invalid actionFlag
				return false;
		}

		// If there was only 1 recipient, we don't need to convert
		// it to a OR subrestriction. If we have more then 1 recipient,
		// then we should create the OR restriction.
		if (conditions.length === 1) {
			return conditions[0];
		} else if (conditions.length > 1) {
			return Zarafa.core.data.RestrictionFactory.createResOr(conditions);
		} else {
			return false;
		}
	},

	/**
	 * Convert a {@link Zarafa.core.data.IPMRecipientRecord Recipient} into
	 * a Restriction used for the {@link #getCondition}.
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipient The recipient for which
	 * the restriction should be created
	 * @return {Object} The restriction
	 * @private
	 */
	createToRestriction : function(recipient)
	{
		var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
		var Restrictions = Zarafa.core.mapi.Restrictions;

		return RestrictionFactory.createResSubRestriction('PR_MESSAGE_RECIPIENTS',
			RestrictionFactory.dataResComment(
				RestrictionFactory.dataResProperty('PR_SEARCH_KEY', Restrictions.RELOP_EQ, recipient.get('search_key'), '0x00010102'),
				{
					'0x60000003' : Zarafa.core.mapi.RecipientType.MAPI_TO,
					'0x00010102' : recipient.get('search_key'),
					'0x0001001E' : recipient.get('display_name') + ' <' + recipient.get('smtp_address') + '>',
					'PR_DISPLAY_TYPE' : recipient.get('display_type')
				}
			)
		);
	},

	/**
	 * Convert a {@link Zarafa.core.data.IPMRecipientRecord Recipient} into
	 * a Restriction used for the {@link #getCondition}.
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipient The recipient for which
	 * the restriction should be created
	 * @return {Object} The restriction
	 * @private
	 */
	createFromRestriction : function(recipient)
	{
		var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
		var Restrictions = Zarafa.core.mapi.Restrictions;

		return RestrictionFactory.dataResComment(
			RestrictionFactory.dataResProperty('PR_SENDER_SEARCH_KEY', Restrictions.RELOP_EQ, recipient.get('search_key'), '0x00010102'),
			{
				'0x60000003' : Zarafa.core.mapi.RecipientType.MAPI_TO,
				'0x00010102' : recipient.get('search_key'),
				'0x0001001E' : recipient.get('display_name') + ' <' + recipient.get('smtp_address') + '>',
				'PR_DISPLAY_TYPE' : recipient.get('display_type')
			}
		);
	},

	/**
	 * Apply an action onto the DataView, this will parse the action and show
	 * the contents in a user-friendly way to the user.
	 * @param {Zarafa.common.rules.data.ActionFlags} actionFlag The action type
	 * which identifies the exact type of the action.
	 * @param {Object} action The action to apply
	 */
	setAction : function(actionFlag, action)
	{
		this.store.removeAll();
		this.isValid = false;
		if (action) {
			var RecordFactory = Zarafa.core.data.RecordFactory;
			var CustomObjectType = Zarafa.core.data.RecordCustomObjectType;

			for (var i = 0, len = action.adrlist.length; i < len; i++) {
				var address = action.adrlist[i];
				this.isValid = true;

				var recipient = RecordFactory.createRecordObjectByCustomType(CustomObjectType.ZARAFA_RECIPIENT, {
					'entryid' : address['PR_ENTRYID'],
					'object_type' : address['PR_OBJECT_TYPE'],
					'display_name' : address['PR_DISPLAY_NAME'],
					'display_type' : address['PR_DISPLAY_TYPE'],
					'email_address' : address['PR_EMAIL_ADDRESS'],
					'smtp_address' : address['PR_SMTP_ADDRESS'],
					'address_type' : address['PR_ADDRTYPE'],
					'recipient_type' : address['PR_RECIPIENT_TYPE'],
					'search_key' : address['PR_SEARCH_KEY']
				});
				this.store.add(recipient);
			}
		}

		this.actionFlag = actionFlag;
		this.action = action;
		this.userStringSeparator = _('and');
		this.isModified = !Ext.isDefined(action);
		this.update(this.store);
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

		var action = {};

		// No recipients selected, this means
		// we can't create an action.
		if (this.store.getCount() === 0) {
			return false;
		}

		// Set the Address list in the action
		action.adrlist = [];
		this.store.each(function(recipient) {
			action.adrlist.push({
				PR_ENTRYID : recipient.get('entryid'),
				PR_OBJECT_TYPE : recipient.get('object_type'),
				PR_DISPLAY_NAME : recipient.get('display_name'),
				PR_DISPLAY_TYPE : recipient.get('display_type'),
				PR_EMAIL_ADDRESS : recipient.get('email_address') || recipient.get('smtp_address'),
				PR_SMTP_ADDRESS : recipient.get('smtp_address'),
				PR_ADDRTYPE : recipient.get('address_type'),
				PR_RECIPIENT_TYPE : recipient.get('recipient_type'),
				PR_SEARCH_KEY : recipient.get('search_key')
			});
		}, this);

		// Fill in the additional properties required for the action.
		var ActionFlags = Zarafa.common.rules.data.ActionFlags;
		var RuleActions = Zarafa.core.mapi.RuleActions;
		var FlavorFlags = Zarafa.core.mapi.FlavorFlags;
		switch (this.actionFlag) {
			case ActionFlags.REDIRECT:
				action.action = RuleActions.OP_FORWARD;
				action.flags = 0;
				action.flavor = FlavorFlags.FWD_PRESERVE_SENDER | FlavorFlags.FWD_DO_NOT_MUNGE_MSG;
				break;
			case ActionFlags.FORWARD:
				action.action = RuleActions.OP_FORWARD;
				action.flags = 0;
				action.flavor = 0;
				break;
			case ActionFlags.FORWARD_ATTACH:
				action.action = RuleActions.OP_FORWARD;
				action.flags = 0;
				action.flavor = FlavorFlags.FWD_AS_ATTACHMENT;
				break;
			default:
				// invalid actionFlag
				return false;
		}

		return action;
	},

	/**
	 * Update the contents of this dataview, this will apply the {@link #tpl} for
	 * the {@link #store}.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store to show
	 */
	update : function(store)
	{
		var data = {
			seperator : this.userStringSeparator,
			list : Ext.pluck(store.getRange(), 'data')
		};

		if (Ext.isEmpty(data.list)) {
			data.list = [{
				display_name : this.emptyText
			}];
		}

		Zarafa.common.rules.dialogs.UserSelectionLink.superclass.update.call(this, this.tpl.apply(data));
	}
});

Ext.reg('zarafa.userselectionlink', Zarafa.common.rules.dialogs.UserSelectionLink);
