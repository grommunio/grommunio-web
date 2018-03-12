Ext.namespace('Zarafa.common.rules.ui');

/**
 * @class Zarafa.common.rules.ui.RulesPanel
 * @extends Ext.Container
 * @xtype zarafa.rulespanel
 * Will generate UI for the {@link Zarafa.common.settings.SettingsRuleWidget SettingsRuleWidget}.
 */
Zarafa.common.rules.ui.RulesPanel = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Zarafa.common.rules.data.RulesStore} store store to use for loading rules
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if(Ext.isEmpty(config.store)) {
			config.store = new Zarafa.common.rules.data.RulesStore({
				'storeEntryId': container.getHierarchyStore().getDefaultStore().get('store_entryid')
			});
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.rulespanel',
			border : false,
			layout : 'fit',
			items : this.createPanelItems(config)
		});

		Zarafa.common.rules.ui.RulesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates an jsonstore for the combobox which contains the users of which store is fully opened
	 * and the Inbox 'folder permissions' are set.
	 * @return {Object} array which contains the jsonstore.
	 * @private
	 */
	createComboboxStore : function()
	{
		var hierarchyStore = container.getHierarchyStore();
		var data = [{name: _('myself'), value: hierarchyStore.getDefaultStore().get('store_entryid') }];
		var sharedStores = container.getSettingsModel().get('zarafa/v1/contexts/hierarchy/shared_stores', true);

		for (var user in sharedStores) {
			// Skip not fully opened stores
			if (!sharedStores[user].hasOwnProperty("all")) {
				continue;
			}

			hierarchyStore.getStores().forEach(function(store){
				if ( store.get('user_name') === user ){
					// Saving rules only works with owner permissions on the full store.
					// Note: Rules are stored on the default received folder (inbox). The WebApp backend will
					// not check the rights and allows saving rules when the user has folder rights on the
					// inbox (because that's what Kopano Core needs).
					var subtree = store.getSubtreeFolder();
					var inbox = store.getDefaultFolder('inbox');
					if (
						(subtree.get('rights') & Zarafa.core.mapi.Rights.RIGHTS_OWNER) === Zarafa.core.mapi.Rights.RIGHTS_OWNER &&
						(inbox && inbox.get('rights') & Zarafa.core.mapi.Rights.RIGHTS_FOLDER_ACCESS)
					) {
						data = data.concat({name: store.get('mailbox_owner_name'), value: store.get('store_entryid') });
					}
				}
			});

		}

		return {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data: data
		};
	},

	/**
	 * Function will create panel items for {@link Zarafa.common.rules.ui.RulesPanel RulesPanel}
	 * @param {Object} config config passed to the constructor
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems : function(config)
	{
		var comboStore = this.createComboboxStore();
		var items = [];
		if ( container.getServerConfig().isSharedRulesEnabled() ){
			items.push({
				xtype: 'container',
				cls: 'k-store-picker',
				border: false,
				layout: 'form',
				labelWidth: '-', // Anything but a number to make sure Ext does not set a width
				items: {
					xtype: 'combo',
					mode: 'local',
					store: comboStore,
					fieldLabel: _('Update rules for'),
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					value: comboStore.data[0].value,
					editable: false,
					listeners : {
						beforeselect : this.onBeforeUserSelect,
						select : this.onUserSelect,
						scope : this
					}
				}
			});
		}

		items.push({
			xtype : 'zarafa.rulesgrid',
			ref : '../rulesGrid',
			flex : 1,
			store : config.store
		});

		return [{
			xtype : 'container',
			layout : {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : items
		}];
	},

	/**
	 * Event handler for the beforeselect event, when the user selects a different
	 * user to update the mail filters settings.
	 *
	 * Checks if the model is dirty and shows the user a dialog if the user wants to
	 * save any changes.
	 *
	 * @param {Ext.form.ComboBox} field The combobox which was selected
	 * @param {Ext.Record} record The record that was selected
	 * @param {Number} index The index of the selected record
	 *
	 * @return {Mixed} False if there are pending changes. The selecting will then be
	 * handled by {#applyChanges}. Undefined otherwise.
	 */
	onBeforeUserSelect : function(field, record, index)
	{
		var context = container.getContextByName('settings');
		var model = context.getModel();
		if (model.dirty) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg : _('Do you wish to apply the changes?'),
				icon: Ext.MessageBox.QUESTION,
				fn: this.applyChanges.createDelegate(this, [ model, field, record ], 1),
				buttons: Ext.MessageBox.YESNOCANCEL
			});

			return false;
		}
	},

	/**
	 * Event handler for the select event, when the user selects a different
	 * user to update the mail filters settings.
	 *
	 * Loads the selected users store.
	 *
	 * @param {Ext.form.ComboBox} field The combobox which was selected
	 */
	onUserSelect : function(field)
	{
		this.loadUserStore(field.getValue());
	},

	/**
	 * Applies changes according to the answer from the user. And then switches
	 * the store to the user provided selection.
	 *
	 * @param {Ext.button} btn The messagebox button
	 * @param {Zarafa.settings.SettingsContextModel} model the settings model
	 * @param {Ext.form.ComboBox} field the user selection combobox.
	 */
	applyChanges : function(btn, model, field, record)
	{
		// The user cancels the switch to a different category
		if (btn === 'cancel') {
			return;
		}

		// Check if the user wishes to save or discard all changes
		if (btn === 'yes') {
			model.applyChanges();
		} else {
			model.discardChanges();
		}

		// Select the user in the dropdown
		field.setValue(record.get('value'));

		// Load the store of the selected user
		this.loadUserStore(field.getValue());
	},

	/**
	 * Loads the rules from the store with the given entryId
	 *
	 * @param {String} entryId the netryid of the store to be used for reading and writing the rules.
	 */
	loadUserStore : function(entryId)
	{
		this.store.storeEntryId = entryId;
		this.store.load();
	},

	/**
	 * Function will be used to reload data in the {@link Zarafa.common.rules.data.RulesStore RulesStore}.
	 */
	discardChanges : function()
	{
		this.store.load();
	},

	/**
	 * Function will be used to save changes in the {@link Zarafa.common.rules.data.RulesStore RulesStore}.
	 */
	saveChanges : function()
	{
		this.store.save();
	}
});

Ext.reg('zarafa.rulespanel', Zarafa.common.rules.ui.RulesPanel);
