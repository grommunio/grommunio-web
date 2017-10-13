Ext.namespace('Zarafa.common.flags.ui');

/**
 * @class Zarafa.common.flags.ui.FlagsMenu
 * @extends Ext.menu.Menu
 * @xtype zarafa.flagsmenu
 *
 * The FlagsMenu is the menu that is shown for flags.
 */
Zarafa.common.flags.ui.FlagsMenu = Ext.extend(Ext.menu.Menu, {
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
		}, {
			xtype: 'menuseparator'
		}, {
			text: _('Edit reminder'),
			iconCls : 'icon_flag_Reminder',
			action : 'edit_reminder',
			disabled : true,
			scope: this
		}, {
			text: _('Complete'),
			iconCls : 'icon_flag_complete',
			action: 'complete',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('None'),
			action: 'none',
			hideOnDisabled : false,
			iconCls : 'icon_mail_flag',
			handler: this.setFlag,
			scope: this
		}];
	},

	/**
	 * Event handler for the destroy event of the component. Will remove the records that
	 * were copied from the shadow store.
	 */
	onDestroy : function()
	{
		if (this.shadowEdit !== false) {
			var shadowStore = container.getShadowStore();
			this.records.forEach(function(record){
				shadowStore.remove(record);
			});
		}
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
			// when flag context menu is open
			// and mean while grid was reloaded in background
			// in that case record.store is get null which throw
			// the error while saving record to overcome this problem
			// we required to do following action.
			if(Ext.isEmpty(record.getStore())) {
				record = this.store.getById(record.get('entryid'));
			}
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
