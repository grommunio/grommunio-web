Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.WordSelectionLink
 * @extends Ext.BoxComponent
 * @xtype zarafa.wordselectionlink
 */
Zarafa.common.rules.dialogs.WordSelectionLink = Ext.extend(Ext.BoxComponent, {
	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	emptyText :_('Select one...'),

	/**
	 * @cfg {String} wordStringSeparator The separator which is used to separate list
	 * of words while displaying them as string.
	 */
	wordStringSeparator :_('or'),

	/**
	 * @cfg {Ext.data.Store} store The store in which
	 * the words are stored
	 */
	store : undefined,

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
			xtype: 'zarafa.wordselectionlink',
			border : false,
			autoScroll:true,
			anchor : '100%',
			multiSelect : false,
			store : new Ext.data.Store({ fields : [ 'words' ] }),
			tpl : new Ext.XTemplate(
				'<div class="zarafa-word-link">' +
					'<tpl for=".">' + 
						'<tpl if="!Ext.isEmpty(values.words)">' +
							'&quot;{words:htmlEncode}&quot;'+
						'</tpl>' +
						'<tpl if="xcount &gt; 0 && xindex != xcount">' +
							'<span>&nbsp;' + this.wordStringSeparator  + '&nbsp;</span>' +
						'</tpl>' +
					'</tpl>' +
				'</div>',
				{
					compiled : true,
					wordStringSeparator : config.wordStringSeparator || this.wordStringSeparator
				}
			)
		});

		Zarafa.common.rules.dialogs.WordSelectionLink.superclass.constructor.call(this, config);
	},

	/**
	 * This function is called after the component has been rendered.
	 * This will register the {@link #onActivate} and {@link #onClick} event handlers.
	 * @private
	 */
	afterRender : function()
	{
		Zarafa.common.rules.dialogs.WordSelectionLink.superclass.initComponent.apply(this, arguments);

		this.mon(this.getActionEl(), 'click', this.onClick, this);
	},

	/**
	 * Called when user clicks on a {@link Zarafa.common.rules.dialogs.WordSelectionLink}
	 * It opens words edit dialog.
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} evt The mouse event
 	 * @protected
	 */
	onClick : function(dataView, index, node, evt)
	{
		var tmpStore = new Ext.data.Store({ fields : [ 'words' ] });
		tmpStore.add(this.store.getRange());

		// Open RulesWordsEditDialog
		Zarafa.common.Actions.openRulesWordsEditContent({
			store : tmpStore,
			callback : this.rulesWordsEditDialogCallback,
			scope : this,
			modal : true
		});
	},

	/**
	 * Callback function for {@link Zarafa.common.rules.dialogs.RulesWordsEditDialog}
	 * @param {Ext.data.Store} store the store which contains list of words
	 * @private
	 */
	rulesWordsEditDialogCallback : function(store)
	{
		// Remove old words and add words which we have got
		// from callback function of RulesWordsEditDialog.
		this.store.removeAll();
		this.store.add(store.getRange());
		this.isModified = true;
		this.update(this.store);
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

		// Parse the condition and add words in the store.
		if (condition) {
			var Restrictions = Zarafa.core.mapi.Restrictions;
			switch (conditionFlag) {
				case Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS:
					var subs;

					// Check if a RES_OR restriction was provided, if
					// so we need to loop over all words from the list.
					if (condition[0] == Restrictions.RES_OR) {
						subs = condition[1];
					} else {
						subs = [ condition ];
					}

					for (var i = 0, len = subs.length; i < len; i++) {
						var value = subs[i][1][Restrictions.VALUE];
						Ext.iterate(value, function(key, value) {
							if(!Ext.isEmpty(value)) {
								this.isValid = true;
								if(conditionFlag === Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS) {
									value = Zarafa.core.Util.hexToString(value);
								}
								this.store.add(new Ext.data.Record({ words : value }));
							}
						}, this);
					}
					break;

				case Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS:
				case Zarafa.common.rules.data.ConditionFlags.BODY_WORDS:
				/* falls through */
				default:
					var subs;

					// Check if a RES_OR restriction was provided, if
					// so we need to loop over all words from the list.
					if (condition[0] == Restrictions.RES_OR) {
						subs = condition[1];
					} else {
						subs = [ condition ];
					}

					for (var i = 0, len = subs.length; i < len; i++) {
						var value = subs[i][1][Restrictions.VALUE];
						Ext.iterate(value, function(key, value) {
							if(!Ext.isEmpty(value)) {
								this.isValid = true;
								this.store.add(new Ext.data.Record({ words : value }));
							}
						}, this);
					}
					break;
			}
		}

		this.conditionFlag = conditionFlag;
		this.condition = condition;
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

		// No words are added, so we can't create a condition.
		if (this.store.getCount() === 0) {
			return false;
		}

		var conditions = [];
		var RestrictionFactory = Zarafa.core.data.RestrictionFactory;
		var Restrictions = Zarafa.core.mapi.Restrictions;

		switch (this.conditionFlag) {
			case Zarafa.common.rules.data.ConditionFlags.SENDER_WORDS:
				this.store.each(function(word) {
						var value = Zarafa.core.Util.stringToHex(word.get('words'));
						conditions.push(RestrictionFactory.dataResContent('PR_SENDER_SEARCH_KEY', Restrictions.FL_SUBSTRING, value));
					}, this);
				break;

			case Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS:
				this.store.each(function(word) {
					conditions.push(RestrictionFactory.dataResContent('PR_SUBJECT', Restrictions.FL_SUBSTRING | Restrictions.FL_IGNORECASE, word.get('words')));
				}, this);
				break;
			case Zarafa.common.rules.data.ConditionFlags.BODY_WORDS:
				this.store.each(function(word) {
					conditions.push(RestrictionFactory.dataResContent('PR_BODY', Restrictions.FL_SUBSTRING | Restrictions.FL_IGNORECASE, word.get('words')));
				}, this);
				break;

			default:
				// Invalid conditionFlag
				return false;
		}

		// If there was only 1 word condtion, we don't need to convert
		// it to a OR subrestriction. If we have more then 1 word condtion,
		// then we should create the OR restriction.
		if (conditions.length === 1) {
			return conditions[0];
		} else {
			return Zarafa.core.data.RestrictionFactory.createResOr(conditions);
		}
	},

	/**
	 * Update the contents of this dataview, this will apply the {@link #tpl} for
	 * the {@link #store}.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store to show
	 */
	update : function(store)
	{
		var data = Ext.pluck(store.getRange(), 'data');
		if (Ext.isEmpty(data)) {
			data = [{
				words : this.emptyText
			}];
		}

		Zarafa.common.rules.dialogs.WordSelectionLink.superclass.update.call(this, this.tpl.apply(data));
	}
});

Ext.reg('zarafa.wordselectionlink', Zarafa.common.rules.dialogs.WordSelectionLink);
