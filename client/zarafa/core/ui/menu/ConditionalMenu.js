Ext.namespace('Zarafa.core.ui.menu');

/**
 * @class Zarafa.core.ui.menu.ConditionalMenu
 * @extends Ext.menu.Menu
 * @xtype zarafa.conditionalmenu
 *
 * Extends the {@link Ext.menu.Menu} class and allows menu options to determine whether to display themselfs.
 */
Zarafa.core.ui.menu.ConditionalMenu = Ext.extend(Ext.menu.Menu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} records The records on which this contextmenu was requested
	 */
	records : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.conditionalmenu',
			shadow: false
		});

		Zarafa.core.ui.menu.ConditionalMenu.superclass.constructor.call(this, config);

		this.on('beforeshow', this.onMenuBeforeShow, this);
	},

	/**
	 * Event handler for the {@link #beforeshow} event. This will go through all
	 * {@link Zarafa.core.ui.menu.ConditionalItem items} in the menu and call the
	 * {@link Zarafa.core.ui.menu.ConditionalItem#beforeShow} function.
	 *
	 * Optionally all duplicate menuseparators will be removed. This can happen when an
	 * item which was surrounded by separators has been hidden.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalMenu} menu The menu which is being opened.
	 * @private
	 */
	onMenuBeforeShow : function(menu)
	{
		var records = this.records;
		var allowSeparator = false;
		var lastItemIndex = -1;

		// move over the items list and call 'beforeOpen' on each item if that function exists
		menu.items.each(function(item, index) {
			if (item.isXType('zarafa.conditionalitem')) {
				if (Ext.isFunction(item.beforeShow)) {
					item.beforeShow.call(item.scope || item, item, records);
				}

				if (Ext.isDefined(item.menu)) {
					this.onMenuBeforeShow(item.menu);
				}
			}

			// A separator is being added, check if we actually want to display it.
			if (item.isXType('menuseparator')) {
				item.setVisible(allowSeparator === true);
				allowSeparator = false;
			} else {
				// If the non-seperator item is visible,
				// we are allowed to display a separator when requested.
				if (item.hidden === false) {
					allowSeparator = true;
					lastItemIndex = index;
				}
			}
		}, this);

		// The menu is empty, or we have hidden everything.
		if (lastItemIndex === -1) {
			return false;
		}

		// Remove all separators which are visible as last items in the menu.
		for (var i = lastItemIndex, len = menu.items.getCount(); i < len; i++) {
			var item = menu.items.items[i];
			if (item.isXType('menuseparator')) {
				item.setVisible(false);
			}
		}

		// But what if we just removed everything?
		if (lastItemIndex === -1) {
			return false;
		}
	}
});

Ext.reg('zarafa.conditionalmenu', Zarafa.core.ui.menu.ConditionalMenu);
