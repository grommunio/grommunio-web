Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.AccountEditPanel
 * @extends Ext.Panel
 * @xtype filesplugin.accounteditpanel
 *
 * Will generate UI for {@link Zarafa.plugins.files.settings.ui.AccountEditContentPanel AccountEditContentPanel}.
 */
Zarafa.plugins.files.settings.ui.AccountEditPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Object} The current loaded account record.
	 */
	currentItem: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure.
	 */
	constructor: function (config) {
		config = config || {};

		if (config.item) {
			this.currentItem = config.item;
		}

		this.backendStore = new Zarafa.plugins.files.data.BackendStore();
		this.currentBackend = this.normalizeBackendName(
			this.currentItem ? this.currentItem.get('backend') : null,
		);

		Ext.applyIf(config, {
			xtype: 'filesplugin.accounteditpanel',
			layout: 'anchor',
			autoScroll: true,
			border: false,
			items: this.createPanelItems(config),
			buttons: [
				{
					text: _('Save'),
					ref: '../saveBtn',
					cls: 'zarafa-action',
					handler: this.doSave,
					scope: this,
				},
				{
					text: _('Cancel'),
					handler: this.doClose,
					scope: this,
				},
			],
		});

		Zarafa.plugins.files.settings.ui.AccountEditPanel.superclass.constructor.call(
			this,
			config,
		);
	},

	/**
	 * Close the dialog.
	 */
	doClose: function () {
		this.dialog.close();
	},

	/**
	 * If there is no existing record, this function will create a new @see Zarafa.plugins.files.data.AccountRecord
	 * and fill it with the form values.
	 * Afterwards the record will be saved to the server-backend.
	 */
	doSave: function () {
		var store = this.dialog.store;
		var accountName = this.dialog.accName;
		var accountBackend = this.normalizeBackendName(
			this.backendSelector
				? this.backendSelector.getValue()
				: this.currentBackend,
		);
		var metaFormItems = this.dialog.metaForm.form.items.items;
		var formValid = true;

		// build the configuration object from the formfields
		var backendConfig = {};

		// also do some sanity checks on the values
		Ext.each(metaFormItems, function (formRecord) {
			backendConfig[formRecord.getName()] = formRecord.getValue();

			// check if record is valid
			if (!formRecord.isValid()) {
				formValid = false;
				return false;
			}
		});

		if (formValid) {
			if (!this.currentItem) {
				// create new record if none exists yet
				this.currentItem = new store.recordType({
					id: -1,
					name: accountName.getValue(),
					status: Zarafa.plugins.files.data.AccountRecordStatus.NEW,
					backend: accountBackend,
					backend_config: backendConfig,
				});

				store.add(this.currentItem);
			} else {
				// edit the existing record
				this.currentItem.beginEdit();
				this.currentItem.set('name', accountName.getValue());
				this.currentItem.set(
					'status',
					Zarafa.plugins.files.data.AccountRecordStatus.NEW,
				);
				this.currentItem.set('backend', accountBackend);
				this.currentItem.set('backend_config', backendConfig);
				this.currentItem.endEdit();
			}

			// close the dialog after success.
			this.doClose();
		} else {
			// TODO: print error
		}
	},

	/**
	 * Function will create panel items for {@link Zarafa.plugins.files.settings.ui.AccountEditPanel AccountEditPanel}.
	 *
	 * @param {Object} config
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems: function (config) {
		// default values
		var name = _('Files');

		if (Ext.isDefined(config.item)) {
			// set defaultvalues if available
			name = config.item.get('name');
		}

		var backendCombo = new Ext.form.ComboBox({
			xtype: 'combo',
			mode: 'local',
			triggerAction: 'all',
			editable: false,
			forceSelection: true,
			store: this.backendStore,
			displayField: 'displayName',
			valueField: 'name',
			fieldLabel: _('Backend'),
			labelAlign: 'top',
			allowBlank: false,
			ref: '../../../backendSelector',
			value: this.currentBackend,
			listeners: {
				select: this.onBackendSelectionChange,
				scope: this,
			},
		});

		this.backendStore.on(
			'load',
			function (store) {
				var backend = this.normalizeBackendName(this.currentBackend);
				var index = store.find('name', backend);
				var record = index >= 0 ? store.getAt(index) : store.getAt(0);
				if (record) {
					backendCombo.setValue(record.get('name'));
					this.currentBackend = record.get('name');
				}
				this.updateMetaFormBackend(this.currentBackend, true);
			},
			this,
		);

		return [
			{
				xtype: 'fieldset',
				checkboxToggle: false,
				title: _('Account Information'),
				defaultType: 'textfield',
				ref: 'accInfo',
				collapsed: false,
				items: [
					{
						xtype: 'panel',
						layout: 'form',
						border: false,
						flex: 1,
						defaults: {
							anchor: '100%',
							style: 'margin-bottom: 10px;',
						},
						defaultType: 'textfield',
						items: [
							{
								fieldLabel: _('Account name'),
								labelAlign: 'top',
								ref: '../../../accName',
								value: name,
								name: 'accountName',
							},
							backendCombo,
						],
					},
				],
			},
			{
				xtype: 'fieldset',
				checkboxToggle: false,
				title: _('Account Configuration'),
				autoHeight: true,
				defaultType: 'textfield',
				ref: 'metaInfo',
				collapsed: false,
				items: [
					{
						xtype: 'metaform',
						autoInit: true,
						method: 'GET',
						flex: 1,
						defaults: {
							anchor: '100%',
							style: 'margin-bottom: 10px;',
						},
						ref: '../../metaForm',
						url: this.buildMetaFormUrl(this.currentBackend),
						listeners: {
							actioncomplete: this.onMetaFormReady.createDelegate(this),
						},
					},
				],
			},
		];
	},

	/**
	 * Fired after meta data is processed and form fields are created.
	 */
	onMetaFormReady: function () {
		if (Ext.isDefined(this.item)) {
			var saveButton = this.saveBtn;

			// initialize metaform values
			this.dialog.metaForm.bindData(this.item.data.backend_config);

			// enable the save button
			saveButton.setText(dgettext('files_plugin', 'Update'));
			saveButton.enable();
		} else {
			this.saveBtn.enable();
		}

		// FIXME: this is a workaround for IE 9, IE 10 and IE 11
		// chrome and ff will work without this re-layouting
		this.dialog.metaForm.on(
			'afterlayout',
			function () {
				this.dialog.metaForm.doLayout();
				var win = Ext.WindowMgr.getActive();
				win.setHeight(
					this.accInfo.getHeight() + this.metaInfo.getHeight() + 90,
				);
			},
			this,
			{ single: true },
		);
	},

	/**
	 * Normalize backend names for legacy configurations.
	 *
	 * @param {String|null} backendName
	 * @return {String}
	 */
	normalizeBackendName: function (backendName) {
		if (!backendName) {
			return 'Default';
		}
		if (backendName === 'Owncloud') {
			return 'Default';
		}
		return backendName;
	},

	/**
	 * Build the URL used to load backend configuration metadata.
	 *
	 * @param {String} backendName
	 * @return {String}
	 */
	buildMetaFormUrl: function (backendName) {
		return Ext.urlAppend(
			container.getBaseURL(),
			'load=custom&name=form&backend=' + backendName,
		);
	},

	/**
	 * Handle backend selection changes.
	 *
	 * @param {Ext.form.ComboBox} combo
	 */
	onBackendSelectionChange: function (combo) {
		var backend = this.normalizeBackendName(combo.getValue());
		this.currentBackend = backend;
		this.updateMetaFormBackend(backend, false);
	},

	/**
	 * Update the metaform configuration for the selected backend.
	 *
	 * @param {String} backend
	 * @param {Boolean} skipReload When true, avoid reloading the metaform (used during initialisation).
	 */
	updateMetaFormBackend: function (backend, skipReload) {
		var metaForm = this.dialog.metaForm;
		if (!metaForm) {
			return;
		}

		metaForm.url = this.buildMetaFormUrl(backend);
		if (skipReload) {
			return;
		}

		metaForm.load({
			url: metaForm.url,
			params: { meta: true },
		});
		if (this.saveBtn) {
			this.saveBtn.disable();
		}
	},
});

Ext.reg(
	'filesplugin.accounteditpanel',
	Zarafa.plugins.files.settings.ui.AccountEditPanel,
);
