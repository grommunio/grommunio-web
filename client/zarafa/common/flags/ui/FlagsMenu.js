Ext.namespace('Zarafa.common.flags.ui');

/**
 * @class Zarafa.common.flags.ui.FlagsMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.flagsmenu
 *
 * The FlagsMenu is the menu that is shown for flags.
 */
Zarafa.common.flags.ui.FlagsMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records to which the actions in
	 * this menu will apply
	 */
	records : [],

	/**
	 * @cfg {Boolean} shadowEdit True to add {@link #records} into
	 * {@link Zarafa.core.data.ShadowStore}.
	 */
	shadowEdit : true,

	/**
	 * @cfg {Zarafa.core.data.IPMStore} store which contains
	 * records on which flag will be apply.
	 */
	store : null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if ( !Array.isArray(config.records) ){
			config.records = [config.records];
		}

		if (config.shadowEdit !== false) {
			// Add the records to the shadow store, because otherwise we cannot
			// save them when the mail grid refreshes while we have this context
			// menu open.
			var shadowStore = container.getShadowStore();
			config.records = config.records.map(function(record){
				record = record.copy();
				shadowStore.add(record);
				return record;
			});
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.flagsmenu',
			cls: 'k-flags-menu',
			items: this.createMenuItems(),
			listeners: {
				scope: this,
				destroy: this.onDestroy
			}
		});

		Zarafa.common.flags.ui.FlagsMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the menu items that should be shown in the flags menu
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of menu items of
	 * the flags menu
	 * @private
	 */
	createMenuItems : function()
	{
		return [{
			text: _('Today'),
			iconCls : 'icon_mail_flag_red',
			action: 'today',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('Tomorrow'),
			iconCls : 'icon_mail_flag_orange_dark',
			action: 'tomorrow',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('This week'),
			iconCls : 'icon_mail_flag_orange',
			action: 'this_week',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('Next week'),
			iconCls : 'icon_mail_flag_yellow',
			action: 'next_week',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('No date'),
			iconCls : 'icon_mail_flag_red',
			action: 'no_date',
			handler: this.setFlag,
			scope: this
		},{
			xtype: 'zarafa.conditionalitem',
			text: _('Custom'),
			iconCls : 'icon_mail_flag_red',
			beforeShow: this.onFollowUpItemBeforeShow,
			action: 'custom',
			handler: this.onSetCustomFlag,
			scope: this
		}, {
			xtype: 'menuseparator'
		}, {
			xtype: 'zarafa.conditionalitem',
			text: _('Set reminder'),
			iconCls : 'icon_flag_Reminder',
			action : 'set_reminder',
			beforeShow: this.onFollowUpItemBeforeShow,
			handler: this.onSetCustomFlag,
			scope: this
		}, {
			text: _('Complete'),
			iconCls : 'icon_flag_complete',
			action: 'complete',
			handler: this.setFlag,
			scope: this
		}, {
			xtype: 'zarafa.conditionalitem',
			text: _('None'),
			action: 'none',
			beforeShow: this.onFollowUpItemBeforeShow,
			iconCls : 'icon_mail_flag',
			handler: this.setFlag,
			scope: this
		}];
	},

	/**
	 * Event handler triggers before the item shows. If selected
	 * record is task record then don't show 'Set reminder', 'Custom' and 'None'
	 * options in flags context menu.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onFollowUpItemBeforeShow : function (item, records)
	{
		if(!Array.isArray(records)) {
			records = [records];
		}
		var hasTaskRecord = records.some(function (record) {
			return record.isMessageClass('IPM.Task');
		});
		item.setDisabled(hasTaskRecord);
	},

	/**
	 * Event handler for the destroy event of the component. Will remove the records that
	 * were copied from the shadow store.
	 */
	onDestroy : function()
	{
		if (this.shadowEdit !== false) {
			container.getShadowStore().remove(this.record);
		}
	},

	/**
	 * Event handler which is triggered when either custom
	 * or set reminder flag context menu item was clicked.
	 * @param {Ext.menu.Item} menuItem The menu item that was clicked
	 */
	onSetCustomFlag : function (menuItem)
	{
		Zarafa.common.Actions.openCustomFlagContent(this.records,{
			setFocusOnReminder : menuItem.action === 'set_reminder'
		});
	},

	/**
	 * Event handler for the click event of the items in the flag menu. Will set the required properties
	 * on the selected records.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} menuItem The menu item that was clicked
	 */
	setFlag : function(menuItem)
	{
		// If there was an old-style flag, we must set the category before changing the flag
		Zarafa.common.flags.Util.updateCategories(this.records);

		const flagProperties = Zarafa.common.flags.Util.getFlagBaseProperties();

		switch ( menuItem.action ) {
			case 'no_date':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesNoDate());
				break;
			case 'today':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesToday());
				break;
			case 'tomorrow':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesTomorrow());
				break;
			case 'this_week':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesThisWeek());
				break;
			case 'next_week':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesNextWeek());
				break;
			case 'complete':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesComplete());
				break;
			case 'none':
				Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesRemoveFlag());
				break;
		}

		// Now set the properties an all selected records
		this.setFlagProperties(this.records, flagProperties);
	},

	/**
	 * Set necessary flag related properties into given record(s).
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record(s) for which configured flag needs to be identified.
	 * @param {Object} flagProperties Necessary flag properties
	 */
	setFlagProperties : function(records, flagProperties)
	{
		records.forEach(function(record){
			record.beginEdit();
			for ( var property in flagProperties ){
				record.set(property, flagProperties[property]);
			}
			record.endEdit();
			record.save();
		}, this);
	}
});

Ext.reg('zarafa.flagsmenu', Zarafa.common.flags.ui.FlagsMenu);
