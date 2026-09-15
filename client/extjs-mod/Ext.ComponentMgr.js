/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

(function() {
	var origCreate = Ext.ComponentMgr.create;
	var origCreatePlugin = Ext.ComponentMgr.createPlugin;

	// Deprecated zarafa.* xtypes and ptypes of plugins written before the rename.
	var alias = function(type, registered) {
		if (Ext.isString(type) && type.indexOf('zarafa.') === 0 && !registered(type)) {
			return 'grommunio.' + type.substr(7);
		}
		return type;
	};

	Ext.apply(Ext.ComponentMgr, {
		create: function(config, defaultType)
		{
			if (config && !config.render) {
				config.xtype = alias(config.xtype, Ext.ComponentMgr.isRegistered);
			}
			return origCreate.call(this, config, alias(defaultType, Ext.ComponentMgr.isRegistered));
		},

		createPlugin: function(config, defaultType)
		{
			if (config) {
				config.ptype = alias(config.ptype, Ext.ComponentMgr.isPluginRegistered);
			}
			return origCreatePlugin.call(this, config, alias(defaultType, Ext.ComponentMgr.isPluginRegistered));
		}
	});
	Ext.create = Ext.ComponentMgr.create;
})();
