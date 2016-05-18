Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailFlagsMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.mailflagsmenu
 *
 * Extend {@link Zarafa.core.ui.menu.ConditionalMenu ConditionalMenu} to create the
 * {@link Zarafa.core.ui.menu.ConditionalItems ConditionalItems} for all possible
 * mail flags.
 */
Zarafa.mail.dialogs.MailFlagsMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	/**
	 * @cfg {Boolean} colorsOnly Only add the color flags to the menu
	 */
	colorsOnly : false,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.mailflagsmenu',
			items: Zarafa.mail.dialogs.MailFlagsMenu.createMailFlagButtons(config.colorsOnly || false)
		});

		Zarafa.mail.dialogs.MailFlagsMenu.superclass.constructor.call(this, config);
	}
});

/**
 * @static
 * Create a {@link Zarafa.mail.dialogs.MailFlagsButton menubutton} containing a submenu.
 * The button itself will contain the default action, and the submenu will contain
 * all possible buttons.
 * @param {Boolean} colorsOnly Only add the color flags to the menu
 * @return {Zarafa.mail.dialogs.MailFlagsButton} The button containing the submenu
 */
Zarafa.mail.dialogs.MailFlagsMenu.createMailFlagSubmenu = function(colorsOnly)
{
	var items = Zarafa.mail.dialogs.MailFlagsMenu.createMailFlagButtons(colorsOnly);
	return {
		xtype: 'zarafa.flagbutton',
		text: _('Set Flag'),
		overflowText: _('Set Flag'),
		iconCls : items[0].iconCls,
		flagStatus: items[0].flagStatus,
		flagColor: items[0].flagColor,
		beforeShow : Zarafa.mail.dialogs.MailFlagsMenu.onMenuItemBeforeShow,
		menu: {
			xtype: 'zarafa.conditionalmenu',
			items: items
		}
	};
};

/**
 * @static
 * Handler function that will be called before showing the flags menu,
 * it will check if loaded record is faulty then will hide this menu.
 * 
 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
 * to see if the item must be enabled or disabled.
 */
Zarafa.mail.dialogs.MailFlagsMenu.onMenuItemBeforeShow = function(item, records)
{
	Ext.each(records, function(record) {
		if(record.isFaultyMessage()) {
			// hide menu item and break the loop
			item.setVisible(false);

			return false;
		}
	}, this);
};

/**
 * @static
 * Create array of {@link Zarafa.mail.dialogs.MailFlagsButton FlagButton} for
 * all available {@link Zarafa.mail.data.MailFlags MailFlags}
 * @param {Boolean} colorsOnly Only add the color flags to the menu
 * @return {Zarafa.mail.dialogs.MailFlagsButton} The array of color buttons.
 */
Zarafa.mail.dialogs.MailFlagsMenu.createMailFlagButtons = function(colorsOnly)
{
	var items = Zarafa.mail.dialogs.MailFlagsMenu.createColorMailFlagButtons();
	if (colorsOnly === false) {
		items.push({ xtype: 'menuseparator' });
		items.push(Zarafa.mail.dialogs.MailFlagsMenu.createStateMailFlagButtons());
	}
	return items;
};

/**
 * @static
 * Create array of {@link Zarafa.mail.dialogs.MailFlagsButton FlagButton} for each
 * possible color {@link Zarafa.mail.data.MailFlags MailFlags}.
 * @return {Zarafa.mail.dialogs.MailFlagsButton} The array of color buttons.
 */
Zarafa.mail.dialogs.MailFlagsMenu.createColorMailFlagButtons = function()
{
	return Zarafa.mail.dialogs.MailFlagsMenu.convertMailFlagToButton(Zarafa.mail.data.MailFlags.colors);
};

/**
 * @static
 * Create array of {@link Zarafa.mail.dialogs.MailFlagsButton FlagButton} for each
 * possible state {@link Zarafa.mail.data.MailFlags MailFlags}.
 * @return {Zarafa.mail.dialogs.MailFlagsButton} The array of state buttons.
 */
Zarafa.mail.dialogs.MailFlagsMenu.createStateMailFlagButtons = function()
{
	return Zarafa.mail.dialogs.MailFlagsMenu.convertMailFlagToButton(Zarafa.mail.data.MailFlags.state);
};

/**
 * @static
 * Convert objects from the {@link Zarafa.mail.data.MailFlags MailFlags} enumeration
 * into {@link Zarafa.mail.dialogs.MailFlagsButton FlagButton} objects.
 *
 * @param {Zarafa.mail.data.MailFlags[]} flags The array of
 * {@link Zarafa.mail.data.MailFlags MailFlags} which must be converted.
 * @return {Zarafa.mail.dialogs.MailFlagsButton} The array of converted buttons.
 */
Zarafa.mail.dialogs.MailFlagsMenu.convertMailFlagToButton = function(flags)
{
	var buttons = [];

	Ext.each(flags, function(flag) {
		buttons.push({
			xtype: 'zarafa.flagbutton',
			text: flag.name,
			iconCls: flag.iconCls,
			flagStatus: flag.flagStatus,
			flagColor: flag.flagColor,
			beforeShow : Zarafa.mail.dialogs.MailFlagsMenu.onMenuItemBeforeShow
		});
	}, this);

	return buttons;
};

Ext.reg('zarafa.mailflagsmenu', Zarafa.mail.dialogs.MailFlagsMenu);
