Ext.namespace('Zarafa.common.ui');

/**
 * Shared compose protection controls. Plugins contribute protocols, not toolbars.
 * A message may use signing and encryption from one protocol only.
 */
Zarafa.common.ui.SecurityButtons = {
	providers: [],
	register: function(provider)
	{
		this.providers = this.providers.filter(function(item) { return item.id !== provider.id; });
		this.providers.push(provider);
		this.providers.sort(function(a, b) { return (a.priority || 0) - (b.priority || 0); });
	},
	getDialog: function(component)
	{
		var depth = 0;
		while (component && depth++ < 20) {
			if (component.securityDialog) { return component.securityDialog; }
			if (component.dialog && component.dialog.record) { return component.dialog; }
			component = component.ownerCt || (component.parentMenu && component.parentMenu.ownerCt);
		}
		return null;
	},
	activeProvider: function(record)
	{
		if (!record) { return null; }
		for (var i = 0; i < this.providers.length; i++) {
			var provider = this.providers[i];
			if (provider.isSelected(record, 'sign') || provider.isSelected(record, 'encrypt')) { return provider; }
		}
		return null;
	},
	canSelect: function(provider, record)
	{
		var active = this.activeProvider(record);
		return !!record && (!active || active.id === provider.id);
	},
	setAction: function(provider, dialog, action, enabled, button)
	{
		if (!dialog || !dialog.record || (enabled && !this.canSelect(provider, dialog.record))) { return; }
		dialog.securityPreferredProtocol = provider.id;
		provider.setAction(dialog, action, enabled, button);
		this.updateButton(button, dialog.record);
	},
	attach: function(button)
	{
		var dialog = this.getDialog(button);
		if (!dialog) { return; }
		dialog.securityProvidersAttached = dialog.securityProvidersAttached || {};
		Ext.each(this.providers, function(provider) {
			if (!dialog.securityProvidersAttached[provider.id]) {
				dialog.securityProvidersAttached[provider.id] = true;
				if (provider.attach) { provider.attach(dialog); }
			}
		});
		this.updateButton(button, dialog.record);
	},
	updateButton: function(button, record)
	{
		if (!button) { return; }
		button.record = record;
		if (button.setDisabled) { button.setDisabled(!record); }
		var action = button.securityAction, active = this.activeProvider(record);
		var selected = active && active.isSelected(record, action);
		if (button.setIconClass) { button.setIconClass('icon_security_' + action + (selected ? '_selected' : '')); }
		if (button.setTooltip) {
			button.setTooltip((action === 'sign' ? _('Digitally sign this message') : _('Encrypt this message')) +
				(selected ? ' (' + active.label + ')' : ''));
		}
	},
	mainClick: function(button)
	{
		var dialog = this.getDialog(button);
		if (!dialog || !dialog.record) { return; }
		var active = this.activeProvider(dialog.record), provider = active;
		if (!provider) {
			provider = this.providers.filter(function(item) { return item.id === dialog.securityPreferredProtocol; })[0] || this.providers[0];
		}
		if (provider) { this.setAction(provider, dialog, button.securityAction, !provider.isSelected(dialog.record, button.securityAction), button); }
	},
	populateMenu: function(menu, button)
	{
		var manager = this, dialog = this.getDialog(button), record = dialog && dialog.record;
		menu.removeAll();
		Ext.each(this.providers, function(provider) {
			var active = manager.activeProvider(record), allowed = manager.canSelect(provider, record);
			menu.add({
				xtype: 'menucheckitem',
				text: provider.label,
				checked: !!record && provider.isSelected(record, button.securityAction),
				disabled: !allowed,
				plugins: ['zarafa.menuitemtooltipplugin'],
				tooltip: allowed ? provider.label : String.format(_('Turn off {0} signing and encryption first.'), active ? active.label : ''),
				listeners: {afterrender: function(item) {
					// Disabled Ext menu items don't fire QuickTips activation; use a native tooltip.
					if (item.disabled) { item.getEl().dom.setAttribute('title', item.tooltip); }
				}},
				hideOnClick: true,
				checkHandler: function(item, checked) { manager.setAction(provider, dialog, button.securityAction, checked, button); }
			});
			var options = dialog && provider.getOptions ? provider.getOptions(button.securityAction, dialog, button) : [];
			if (options.length) {
				menu.add({
					text: provider.label + ' ' + _('options'),
					disabled: !allowed,
					menu: {cls: 'message-security-menu', items: options}
				});
			}
		});
	},
	createButtons: function()
	{
		if (!this.providers.length) { return []; }
		var manager = this;
		return ['sign', 'encrypt'].map(function(action) {
			var config = {
				xtype: 'splitbutton',
				securityAction: action,
				text: action === 'sign' ? _('Sign') : _('Encrypt'),
				iconCls: 'icon_security_' + action,
				plugins: ['zarafa.recordcomponentupdaterplugin'],
				update: function(record) { manager.updateButton(this, record); },
				handler: function(button) { manager.mainClick(button); },
				listeners: {
					added: function(button) { button.update = function(record) { manager.updateButton(button, record); }; },
					afterrender: function(button) { manager.attach(button); },
					beforeshow: function(button) { manager.attach(button); }
				},
				menu: {
					cls: 'message-security-menu',
					items: [],
					listeners: {beforeshow: function(menu) { manager.populateMenu(menu, menu.ownerCt); }}
				}
			};
			return config;
		});
	}
};
