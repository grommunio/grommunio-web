Ext.namespace('Zarafa.plugins.pgp.dialogs');

Zarafa.plugins.pgp.dialogs.PgpDialogs = {
	/** Sensitive fields exist only in this modal, never in a mail record or settings. */
	form: function(title, fields, submitText, submit, introduction)
	{
		var form = new Ext.form.FormPanel({
			border: false, bodyStyle: 'padding: 12px', labelWidth: 135,
			autoCreate: {tag: 'form', autocomplete: 'off'},
			defaults: {anchor: '100%'}, items: fields.concat([{xtype: 'box', ref: 'operationStatus', hidden: true,
				autoEl: {tag: 'p', cls: 'pgp-operation-status', role: 'status', 'aria-live': 'polite'}}])
		});
		var win = new Ext.Window({
			title: title, modal: true, width: 620, autoHeight: true,
			resizable: false, stateful: false, layout: 'auto', cls: 'pgp-dialog',
			items: (introduction ? [{xtype: 'box', autoEl: {tag: 'p', cls: 'pgp-explanation', html: Zarafa.plugins.pgp.PgpUtils.encode(introduction)}}] : []).concat([form]),
			buttons: [{text: submitText, handler: function(button) {
				if (!form.getForm().isValid()) { return; }
				win.pgpWorking = true;
				button.disable();
				form.operationStatus.show();
				form.operationStatus.getEl().update(Zarafa.plugins.pgp.PgpUtils.encode(_('Working…')));
				var values = form.getForm().getValues();
				var done = function(success, message) {
					if (win.isDestroyed) { return; }
					win.pgpWorking = false;
					if (success) { win.close(); } else {
						button.enable();
						form.operationStatus.getEl().update(Zarafa.plugins.pgp.PgpUtils.encode(message || _('The operation failed. Please try again.')));
					}
				};
				try { submit(values, done); } catch (error) { done(false, error.message); }
				// Do not retain a passphrase in form state while an operation is in flight.
				form.getForm().items.each(function(field) {
					if (field.inputType === 'password') { field.setValue(''); }
				});
				Object.keys(values).forEach(function(name) { if (/passphrase|password/i.test(name)) { delete values[name]; } });
			}}, {text: _('Cancel'), handler: function() { win.close(); }}],
			listeners: {beforeclose: function() {
				if (win.pgpWorking) { return false; }
				form.getForm().reset();
			}}
		});
		win.show();
		return win;
	},
	passwordField: function()
	{
		return {xtype: 'textfield', name: 'passphrase', inputType: 'password', fieldLabel: _('Passphrase'), allowBlank: false,
			// A key passphrase is not the login password for this origin. Using
			// new-password prevents the browser from filling account credentials.
			autoCreate: {tag: 'input', type: 'password', autocomplete: 'new-password', size: 20}};
	},
	unlock: function(fingerprint, callback, scope)
	{
		var utils = Zarafa.plugins.pgp.PgpUtils;
		return this.form(_('Unlock OpenPGP private key'), [this.passwordField()], _('Unlock'), function(values, done) {
			var passphrase = values.passphrase;
			utils.loadKey(fingerprint).then(function(key) {
				return utils.crypto().unlock(key.encrypted_private_key, passphrase, utils.unlockTtl || 300, key.public_key);
			}).then(function(result) {
				passphrase = '';
				if (callback) { callback.call(scope || this, result); }
				done(true);
			}).catch(function(error) { passphrase = ''; done(false, error.message); });
		}, _('Your passphrase and unlocked key remain in this browser tab. The key locks automatically after a limited time or when the tab closes. Fingerprint: ') + utils.formatFingerprint(fingerprint));
	},
	chooseKey: function(keys, current, callback, scope)
	{
		if (!keys.length) {
			var empty = new Ext.Window({title: _('Set up OpenPGP'), modal: true, width: 480, autoHeight: true,
				resizable: false, cls: 'pgp-dialog', items: [{xtype: 'box', autoEl: {tag: 'p', cls: 'pgp-explanation',
					html: Zarafa.plugins.pgp.PgpUtils.encode(_('Add a private key matching the sender address to sign messages or keep a readable encrypted sent copy. You can import an existing key or create one in OpenPGP settings.'))}}],
				buttons: [{text: _('Open key settings'), handler: function() { empty.close(); Zarafa.plugins.pgp.PgpUtils.openSettings(); }},
					{text: _('Cancel'), handler: function() { empty.close(); }}]});
			empty.show();
			return empty;
		}
		var choices = [], utils = Zarafa.plugins.pgp.PgpUtils;
		Ext.each(keys, function(key) { choices.push([key.fingerprint, utils.keyLabel(key)]); });
		return this.form(_('Choose OpenPGP key'), [{
			xtype: 'combo', name: 'fingerprint', hiddenName: 'fingerprint', fieldLabel: _('Private key'),
			store: new Ext.data.ArrayStore({fields: ['fingerprint', 'label'], data: choices}),
			valueField: 'fingerprint', displayField: 'label', mode: 'local', triggerAction: 'all',
			tpl: '<tpl for="."><div class="x-combo-list-item">{label:htmlEncode}</div></tpl>',
			editable: false, forceSelection: true, allowBlank: false,
			value: keys.some(function(key) { return key.fingerprint === current; }) ? current : keys[0].fingerprint
		}], _('Use key'), function(values, done) {
			Ext.each(keys, function(key) {
				if (key.fingerprint === values.fingerprint) { callback.call(scope || this, key); }
			});
			done(true);
		});
	},
	/** Promise forms reject on cancellation so the compose validation queue resumes. */
	unlockAsync: function(fingerprint)
	{
		var dialogs = this;
		return new Promise(function(resolve, reject) {
			var complete = false;
			var win = dialogs.unlock(fingerprint, function(result) { complete = true; resolve(result); });
			win.on('close', function() {
				if (!complete) { var error = new Error(_('Private-key unlocking was cancelled.')); error.cancelled = true; reject(error); }
			});
		});
	},
	chooseKeyAsync: function(keys, current)
	{
		var dialogs = this;
		return new Promise(function(resolve, reject) {
			var complete = false;
			var win = dialogs.chooseKey(keys, current, function(key) { complete = true; resolve(key); });
			win.on('close', function() {
				if (!complete) { var error = new Error(_('Key selection was cancelled.')); error.cancelled = true; reject(error); }
			});
		});
	},
	armored: function(title, armor, fingerprint, secret, suffix)
	{
		var field = new Ext.form.TextArea({value: armor, readOnly: true, selectOnFocus: true, cls: 'pgp-armored'});
		var win = new Ext.Window({title: title, modal: true, width: 680, height: 420, layout: 'fit', stateful: false, cls: 'pgp-dialog',
			items: [field], buttons: [{text: _('Download'), handler: function() {
				var blob = new Blob([field.getValue()], {type: 'application/pgp-keys'});
				var url = window.URL.createObjectURL(blob), link = document.createElement('a');
				link.href = url;
				link.download = Zarafa.plugins.pgp.PgpUtils.fingerprint(fingerprint) + (suffix || (secret ? '-private.asc' : '-public.asc'));
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.setTimeout(function() { window.URL.revokeObjectURL(url); }, 1000);
			}}, {text: _('Close'), handler: function() { win.close(); }}],
			listeners: {beforeclose: function() { field.setValue(''); }}
		});
		win.show();
	}
};
