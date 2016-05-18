/*
 * #dependsFile client/zarafa/core/mapi/Flags.js
 */
Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailFlagsButton
 * @extends Zarafa.core.ui.menu.ConditionalItem
 * @xtype zarafa.flagbutton
 *
 * Extension of the {@link Zarafa.core.ui.menu.ConditionalItem Conditional MenuItem}.
 * This class adds support for easily setting the flag on a {@link Zarafa.mail.MailRecord record}.
 */
Zarafa.mail.dialogs.MailFlagsButton = Ext.extend(Zarafa.core.ui.menu.ConditionalItem, {
	/**
	 * @cfg {Zarafa.core.mapi.FlagStatus} The Flag Status which must be applied.
	 */
	flagStatus : Zarafa.core.mapi.FlagStatus.flagged,
	/**
	 * @cfg {Zarafa.core.mapi.FlagIcon} The Flag icon which must be applied.
	 */
	flagColor : Zarafa.core.mapi.FlagIcon.red,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.flagbutton',
			handler: function() {
				this.applyFlag(this.getRecords());
			},
			scope: this
		});

		Ext.applyIf(this, config);

		Zarafa.mail.dialogs.MailFlagsButton.superclass.constructor.call(this, config);
	},

	/**
	 * Apply the Flag settings as defined in this button to the
	 * {@link Zarafa.mail.MailRecord records} given as arguments.
	 *
	 * @param {Zarafa.mail.MailRecord} records The records to which the flags must be applied
	 */
	applyFlag : function(records)
	{
		if (Ext.isEmpty(records)) {
			return;
		}

		var store;

		Ext.each(records, function(record) {
			store = record.getStore();
			record.set('flag_status', this.flagStatus);
			record.set('flag_icon', this.flagColor);
		}, this);

		store.save(records);
	}
});

Ext.reg('zarafa.flagbutton', Zarafa.mail.dialogs.MailFlagsButton);
