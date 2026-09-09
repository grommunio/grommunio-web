/*
 * Serve the repository root over loopback and open
 * /plugins/pgp/test/ui-visual-fixture.html in a browser. No test dependency needed.
 * Only the surrounding app and data services are stand-ins; widgets and CSS are real.
 */
(function() {
	'use strict';
	window._ = function(text) { return text === 'options' ? 'Optionen für diese Nachricht' : text; };
	Ext.BLANK_IMAGE_URL = '../../../client/extjs/resources/images/default/s.gif';
	Ext.namespace('Zarafa.plugins.pgp');
	var fakeKey = {
		fingerprint: '1111222233334444555566667777888899990000',
		uids: ['UI Fixture <fixture@example.invalid>'], secret: true, can_sign: true, can_encrypt: true,
		trusted: true, trusted_emails: ['fixture@example.invalid'], algorithm: 'RSA', bits: 3072,
		expires: 1900000000, unlocked: false
	};
	var servers = ['https://keys.example.invalid'];
	window.container = {getUser: function() { return {getSMTPAddress: function() { return 'fixture@example.invalid'; }}; }};
	function disabledOperation() { return Promise.reject(new Error('Fixture only: cryptographic and server operations are disabled.')); }
	Zarafa.plugins.pgp.PgpUtils = {
		encode: Ext.util.Format.htmlEncode,
		keyEmails: function() { return ['fixture@example.invalid']; },
		formatFingerprint: function(value) { return value.replace(/(.{4})/g, '$1 ').trim(); },
		fingerprint: function(value) { return String(value).replace(/\s/g, '').toUpperCase(); },
		isFingerprint: function(value) { return /^[a-f\d]{40}$/i.test(String(value).replace(/\s/g, '')); },
		keyLabel: function() { return 'UI Fixture <fixture@example.invalid> — 9999 0000'; },
		usableKey: function() { return true; },
		api: function(action, data) {
			if (action === 'keyservers') { servers = data.servers.slice(); }
			if (action === 'list' || action === 'keyservers') {
				return Promise.resolve({keys: [fakeKey], keyservers: servers.slice(), allowed_keyservers: servers.slice()});
			}
			return disabledOperation();
		},
		crypto: function() { return {unlocked: function() { return []; }, lock: Ext.emptyFn, generate: disabledOperation, inspect: disabledOperation, unlock: disabledOperation}; },
		loadKey: disabledOperation, storeKey: disabledOperation, importKey: disabledOperation,
		openSettings: function() { document.getElementById('fixture-settings').scrollIntoView(); }
	};
	// There is no mail-record lifecycle or application QuickTip registry in this page.
	function FixturePlugin() {}
	FixturePlugin.prototype.init = Ext.emptyFn;
	Ext.preg('zarafa.recordcomponentupdaterplugin', FixturePlugin);
	Ext.preg('zarafa.menuitemtooltipplugin', FixturePlugin);
	Ext.Ajax.request = function() { throw new Error('Network API requests are forbidden in this fixture.'); };
	window.fetch = disabledOperation;
	window.addEventListener('error', function(event) {
		var output = document.getElementById('fixture-results');
		if (output) { output.textContent += '\nERROR: ' + event.message; }
	});

	Ext.onReady(function() {
		Ext.QuickTips.init();
		document.getElementById('fixture-category-icon').src = Ext.BLANK_IMAGE_URL;
		var manager = Zarafa.common.ui.SecurityButtons, buttons = [], record = {};
		var dialog = {record: record};
		function refreshButtons() { buttons.forEach(function(button) { manager.updateButton(button, record); }); }
		['smime', 'pgp'].forEach(function(id, index) {
			manager.register({id: id, label: index ? 'OpenPGP' : 'S/MIME', priority: index,
				isSelected: function(item, action) { return !!item[id + '_' + action]; },
				setAction: function(owner, action, enabled) { owner.record[id + '_' + action] = enabled; refreshButtons(); },
				getOptions: function() { return [{text: 'Choose private key…', iconCls: 'icon_pgp_key', handler: function() {
					Zarafa.plugins.pgp.dialogs.PgpDialogs.chooseKey([fakeKey], fakeKey.fingerprint, Ext.emptyFn);
				}}, {text: 'A longer translated option to exercise automatic menu sizing', handler: Ext.emptyFn}]; }
			});
		});
		var compose = new Ext.Panel({renderTo: 'fixture-compose', title: 'Compose protection controls', border: true,
			bodyStyle: 'padding: 12px', html: 'Open either dropdown to inspect the protocol options and submenu arrows.',
			tbar: {cls: 'zarafa-dialogtoolbar', items: manager.createButtons().map(function(config) {
				config.securityDialog = dialog;
				return config;
			})}});
		buttons = compose.getTopToolbar().items.items.filter(function(item) { return !!item.securityAction; });
		refreshButtons();
		var iconGrid = new Ext.grid.GridPanel({renderTo: 'fixture-icon-grid', title: 'Mail-column icon context', height: 100, stateful: false,
			store: new Ext.data.ArrayStore({fields: ['subject'], data: [['Synthetic protected message']]}),
			columns: [{id: 'pgp', header: '<p class="icon_pgp_key"><span class="title">OpenPGP</span></p>', headerCls: 'zarafa-icon-column', width: 45,
				renderer: function() { return '<div class="icon_pgp_encrypt" style="width:20px;height:20px" title="OpenPGP encrypted"></div>'; }},
				{header: 'Subject', dataIndex: 'subject', width: 500}], viewConfig: {forceFit: true}, enableHdMenu: false});
		var reference = new Zarafa.settings.ui.SettingsWidget({renderTo: 'fixture-settings', title: 'Native settings spacing reference',
			items: [{xtype: 'displayfield', fieldLabel: 'Example setting', value: 'Unmodified SettingsWidget padding'}]});
		var widget = new Zarafa.plugins.pgp.settings.SettingsPgpWidget({renderTo: 'fixture-settings'});
		widget.update({get: function(name, fallback) { return fallback; }});
		function selected(value) { if (value) { widget.keyGrid.getSelectionModel().selectFirstRow(); } else { widget.keyGrid.getSelectionModel().clearSelections(); } }
		function dark(value) { document.body.classList.toggle('dark-mode', value); }
		new Ext.Toolbar({renderTo: 'fixture-controls', items: [
			{text: 'Dark mode', handler: function() { dark(true); }},
			{text: 'Light mode', handler: function() { dark(false); }}, '-',
			{text: 'Select sample private key', handler: function() { selected(true); }},
			{text: 'Clear key selection', handler: function() { selected(false); }}, '-',
			{text: 'Run checks', handler: runChecks}
		]});
		function rgb(value) { var parts = value.match(/[\d.]+/g); return parts ? parts.slice(0, 3).map(Number) : [0, 0, 0]; }
		function luminance(value) {
			var channels = rgb(value).map(function(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
			return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
		}
		function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
		function background(node) {
			while (node) {
				var value = getComputedStyle(node).backgroundColor;
				if (value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') { return value; }
				node = node.parentElement;
			}
			return 'rgb(255, 255, 255)';
		}
		function runChecks() {
			var output = [], failures = 0, originalDark = document.body.classList.contains('dark-mode');
			var originalSelection = !!widget.keyGrid.getSelectionModel().getSelected(), snapshot = Ext.apply({}, record);
			var scrollX = window.scrollX, scrollY = window.scrollY;
			// Theme changes animate text, surfaces and borders on different descendants.
			// Disable those transitions only during measurements, then remove the rule.
			var transitionReset = document.createElement('style');
			transitionReset.textContent = 'body.zarafa-webclient *, body.zarafa-webclient *::before, body.zarafa-webclient *::after { transition: none !important; }';
			document.head.appendChild(transitionReset);
			function check(condition, label, actual) {
				if (!condition) { failures++; }
				output.push((condition ? 'PASS ' : 'FAIL ') + label + (actual ? ' — ' + actual : ''));
			}
			try {
				[false, true].forEach(function(isDark) {
					dark(isDark);
					var mode = isDark ? 'Dark: ' : 'Light: ';
					Object.keys(record).forEach(function(key) { delete record[key]; });
					refreshButtons();
					buttons.forEach(function(button) {
						var node = button.el.dom.querySelector('button'), style = getComputedStyle(node), icon = getComputedStyle(node, '::before');
						var ratio = contrast(style.color, background(node));
						check(ratio >= 4.5, mode + button.text + ' text contrast', ratio.toFixed(2) + ':1');
						check(style.filter === 'none', mode + button.text + ' is not inverted', style.filter);
						check(contrast(icon.backgroundColor, background(node)) >= 3, mode + button.text + ' mask contrast');
					});
					record.pgp_sign = true;
					refreshButtons();
					var selectedNode = buttons[0].el.dom.querySelector('button');
					check(contrast(getComputedStyle(selectedNode, '::before').backgroundColor, background(selectedNode)) >= 3, mode + 'selected mask contrast');
					delete record.pgp_sign;
					refreshButtons();
					buttons[0].showMenu();
					var menu = buttons[0].menu;
					Array.prototype.forEach.call(menu.el.dom.querySelectorAll('a.x-menu-item-arrow'), function(anchor) {
						var style = getComputedStyle(anchor), label = anchor.querySelector('.x-menu-item-text'), range = document.createRange();
						range.selectNodeContents(label);
						check(style.backgroundSize === '5px 9px', mode + 'submenu arrow size', style.backgroundSize);
						check(parseFloat(style.paddingRight) >= 28, mode + 'submenu right gutter', style.paddingRight);
						check(range.getBoundingClientRect().right <= anchor.getBoundingClientRect().right - 22, mode + 'long label clears submenu arrow');
					});
					var submenuItem = menu.items.items.filter(function(item) { return !!item.menu; })[0];
					// Open synchronously for computed-style checks; hover still uses the native delay.
					submenuItem.deferExpand();
					Array.prototype.forEach.call(document.querySelectorAll('.icon_pgp_key, .icon_pgp_encrypt'), function(node) {
						if (node.getBoundingClientRect().width) { check(getComputedStyle(node).filter === 'none', mode + 'PGP icon is not inverted (' + node.tagName + ')'); }
					});
					buttons[0].hideMenu();
					selected(false);
					['verify', 'export', 'private', 'delete'].forEach(function(id) {
						check(widget.keyGrid.getBottomToolbar().getComponent(id).disabled, mode + id + ' disabled without selection');
					});
					selected(true);
					var buttonNodes = Array.prototype.slice.call(widget.el.dom.querySelectorAll('.pgp-settings-button'));
					function measureButton(node) {
						node = node.querySelector('.x-btn-small');
						var style = getComputedStyle(node);
						return {height: node.getBoundingClientRect().height, border: [style.borderTopWidth, style.borderTopStyle, style.borderTopColor].join(' '), surface: style.backgroundColor, shadow: style.boxShadow};
					}
					var styles = buttonNodes.map(measureButton);
					check(styles.length >= 10, mode + 'all settings action styles inspected', String(styles.length));
					check(styles.every(function(item) { return Math.abs(item.height - styles[0].height) <= 1; }), mode + 'settings button heights match', styles.map(function(item) { return item.height; }).join(', '));
					check(styles.every(function(item) { return item.border === styles[0].border && item.surface === styles[0].surface; }), mode + 'settings button borders and surfaces match');
					var generate = widget.keyGrid.getTopToolbar().items.items[0].el.dom.querySelector('button');
					var generateRatio = contrast(getComputedStyle(generate).color, background(generate));
					check(generateRatio >= 4.5, mode + 'Generate key label contrast', generateRatio.toFixed(2) + ':1');
					var stateClasses = ['x-btn-over', 'x-btn-click', 'x-btn-focus'];
					var originalClasses = buttonNodes.map(function(node) { return stateClasses.filter(function(name) { return node.classList.contains(name); }); });
					try {
						[{label: 'hover', classes: ['x-btn-over']}, {label: 'pressed', classes: ['x-btn-over', 'x-btn-click']}, {label: 'focus', classes: ['x-btn-focus']}].forEach(function(state) {
							buttonNodes.forEach(function(node) {
								stateClasses.forEach(function(name) { node.classList.remove(name); });
								state.classes.forEach(function(name) { node.classList.add(name); });
							});
							var stateStyles = buttonNodes.map(measureButton);
							check(stateStyles.every(function(item) { return Math.abs(item.height - styles[0].height) <= 1; }), mode + state.label + ' preserves button height');
							check(stateStyles.every(function(item) { return item.border === stateStyles[0].border && item.surface === stateStyles[0].surface && item.shadow === stateStyles[0].shadow; }), mode + state.label + ' borders, surfaces and shadows match');
							check(stateStyles.every(function(item, index) { return item.border !== styles[index].border || item.surface !== styles[index].surface || item.shadow !== styles[index].shadow; }), mode + state.label + ' remains visibly distinct from idle');
							if (state.label === 'focus') { check(stateStyles.every(function(item) { return item.shadow !== 'none'; }), mode + 'keyboard focus ring remains visible'); }
						});
					} finally {
						buttonNodes.forEach(function(node, index) {
							stateClasses.forEach(function(name) { node.classList.remove(name); });
							originalClasses[index].forEach(function(name) { node.classList.add(name); });
						});
					}
					var manage = widget.el.dom.querySelector('.pgp-keyservers-button');
					manage.scrollIntoView({block: 'center'});
					var outer = manage.getBoundingClientRect(), inner = manage.querySelector('.x-btn-small').getBoundingClientRect();
					check(outer.width <= inner.width + 2 && outer.width < widget.body.getWidth() / 2, mode + 'Manage keyservers wrapper matches visible button', outer.width.toFixed(1) + ' / ' + inner.width.toFixed(1));
					var hit = document.elementFromPoint(outer.right + 24, outer.top + outer.height / 2);
					check(hit && !manage.contains(hit), mode + 'empty area to right is not Manage keyservers hitbox');
					var padding = getComputedStyle(widget.body.dom), nativePadding = getComputedStyle(reference.body.dom);
					check(padding.padding === nativePadding.padding && parseFloat(padding.paddingLeft) >= 12, mode + 'native widget body spacing', padding.padding);
					check(parseFloat(getComputedStyle(widget.keyGrid.el.dom).marginBottom) >= 12, mode + 'key grid has spacing before compose defaults');
					check(parseFloat(getComputedStyle(widget.body.dom.querySelector('.pgp-explanation')).marginBottom) >= 12, mode + 'introduction has spacing before key grid');
				});
			} catch (error) { check(false, 'Fixture check execution', error.stack || error.message); }
			Object.keys(record).forEach(function(key) { delete record[key]; });
			Ext.apply(record, snapshot);
			refreshButtons(); selected(originalSelection); dark(originalDark); window.scrollTo(scrollX, scrollY);
			transitionReset.parentNode.removeChild(transitionReset);
			document.getElementById('fixture-results').textContent = (failures ? failures + ' check(s) failed' : 'All checks passed') + '\n' + output.join('\n');
			window.pgpVisualFixture.lastResult = {failures: failures, checks: output};
		}
		window.pgpVisualFixture = {widget: widget, compose: compose, iconGrid: iconGrid, buttons: buttons, runChecks: runChecks};
		document.getElementById('fixture-results').textContent = 'Ready. Run checks to verify both themes. All data and actions are local stand-ins.';
	});
})();
