/*
 * #dependsFile client/zarafa/common/ui/htmleditor/Fonts.js
 */
Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsSignaturesWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingssignatureswidget
 *
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the Signatures settings in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}.
 */
Zarafa.mail.settings.SettingsSignaturesWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * True when the currently {@link #selectedSignature edited signature}
	 * has been modified. This will trigger requests to the user if he wishes
	 * to save the signature. The dirty state should always be checked through
	 * {@link #hasDirtySignature} as that will check if any of the form fields
	 * have unsaved modifications.
	 * @property
	 * @type Boolean
	 * @private
	 */
	dirtySelectedSignature : false,

	/**
	 * The currently selected record which the user is editing. If {@link #dirtySelectedSignature}
	 * changes were made to the textfields and the user should press 'Save' to store all changes
	 * into the record.
	 * @property
	 * @type Ext.data.Record
	 * @private
	 */
	selectedSignature : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = {
			xtype : 'jsonstore',
			fields : [
				{ name : 'id', type : 'int' },
				{ name : 'name' },
				{ name : 'content' },
				{ name : 'isHTML', type : 'boolean' }
			],
			sortInfo : {
				field : 'id',
				direction : 'ASC'
			},
			autoDestroy : true
		};

		Ext.applyIf(config, {
			title : _('Signatures'),
			iconCls : 'zarafa-settings-favorite-signatures',
			items : [{
				xtype : 'container',
				layout : 'column',
				items : [{
					xtype : 'grid',
					name : 'zarafa/v1/contexts/mail/signatures/all',
					ref : '../signaturesGrid',
					cls :'zarafa-settings-signatures',
					columnWidth : 0.5,
					height : 200,
					store : store,
					hideHeaders : true,
					viewConfig : {
						forceFit : true,
						deferEmptyText: false,
						emptyText: '<div class="emptytext">' + _('No signatures configured') + '</div>'
					},
					sm : new Ext.grid.RowSelectionModel({
						singleSelect : true,
						listeners : {
							beforerowselect : this.onSignatureBeforeRowSelect,
							selectionchange : this.onSignatureSelectionChange,
							scope : this
						}
					}),
					columns : [{
						dataIndex : 'name',
						header : '&#160;',
						renderer : Ext.util.Format.htmlEncode
					}],
					buttons : [{
						text : _('New'),
						ref : '../../../newSignatureBtn',
						handler : this.onAddSignature,
						scope : this
					},{
						text : _('Delete'),
						ref : '../../../delSignatureBtn',
						handler : this.onDeleteSignature,
						scope : this
					}]
				},{
					xtype : 'container',
					layout : 'form',
					columnWidth : 0.5,
					labelWidth : 200,
					items : [{
						xtype : 'combo',
						ref : '../../newMessageCombo',
						name : 'zarafa/v1/contexts/mail/signatures/new_message',
						fieldLabel : _('Signature for new messages'),
						anchor : '100%',
						store : store,
						mode: 'local',
						triggerAction: 'all',
						displayField: 'name',
						valueField: 'id',
						lazyInit: false,
						autoSelect : true,
						forceSelection: true,
						editable: false,
						listeners : {
							select : this.onSignatureComboSelect,
							scope : this
						}
					},{
						xtype : 'combo',
						ref : '../../replyMessageCombo',
						name : 'zarafa/v1/contexts/mail/signatures/replyforward_message',
						fieldLabel : _('Signature for replies and forwards'),
						anchor : '100%',
						store : store,
						mode: 'local',
						triggerAction: 'all',
						displayField: 'name',
						valueField: 'id',
						lazyInit: false,
						autoSelect : true,
						forceSelection: true,
						editable: false,
						listeners : {
							select : this.onSignatureComboSelect,
							scope : this
						}
					}]
				}]
			},{
				xtype : 'textfield',
				name : 'name',
				fieldLabel : _('Name'),
				ref : 'nameField',
				anchor : '100%',
				listeners : {
					change : this.onNameFieldChange,
					 scope : this
				}
			},{
				xtype : 'zarafa.editorfield',
				cls : 'k-signature-editor',
				name : 'content',
				htmlName : 'content',
				plaintextName : 'content',
				ref : 'contentField',
				anchor : '100%',
				height: 300,
				disableEditor: true,
				listeners : {
					change : this.onEditorFieldChange,
					valuecorrection : this.onValueCorrection,
					scope : this
				}
			}],
			buttons : [{
				text : _('Save Signature'),
				ref : '../saveSignatureBtn',
				handler : this.onSaveSignature,
				scope : this
			}]
		});

		Zarafa.mail.settings.SettingsSignaturesWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called during initialization.
	 *
	 * This will bind the {@link Ext.data.Store store} in the {@link Ext.grid.GridPanel} with those
	 * in the 2 {@link Ext.form.ComboBox comboboxes}. This will ensure that any change made in the
	 * editor will be reflected in the comboboxes as well. See {@link #onGridAddSignature},
	 * {@link #onGridDelSignature} and {@link #onGridUpdateSignature}.
	 * @private
	 */
	initEvents : function()
	{
		// Connect the store from the grid to the stores inside the comboboxes
		var source = this.signaturesGrid.getStore();

		this.mon(source, 'add', this.onGridAddSignature, this);
		this.mon(source, 'remove', this.onGridDelSignature, this);
		this.mon(source, 'update', this.onGridUpdateSignature, this);
	},

	/**
	 * Event handler which is fired when the {@link Ext.data.Store} in the
	 * {@link Ext.grid.GridPanel} fires the {@link Ext.data.Store#add add}
	 * event. This will add the corresponding records to the 2
	 * {@link Ext.form.ComboBox comboboxes}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} records The records which were added
	 * @param {Number} index The where the records were added
	 * @private
	 */
	onGridAddSignature : function(store, records, index)
	{
		var d1 = this.newMessageCombo.getStore();
		var d2 = this.replyMessageCombo.getStore();

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		var copy1 = [];
		var copy2 = [];
		for (var i = 0, len = records.length; i < len; i++) {
			var data;

			data = Ext.apply({}, records[i].data);
			copy1.push(new d1.recordType(data, records[i].id));
			data = Ext.apply({}, records[i].data);
			copy2.push(new d2.recordType(data, records[i].id));
		}

		// Insert with a +1 offset, as these 2 stores have a fake
		// entry inside it which is always the first entry in the store.
		d1.insert(index + 1, copy1);
		d2.insert(index + 1, copy2);

		// Change the current selection if this is the first
		// signature to be added.
		if (d1.getCount() === records.length) {
			this.newMessageCombo.setValue(d1.getAt(0).get('id'));
		}
		if (d2.getCount() === records.length) {
			this.replyMessageCombo.setValue(d2.getAt(0).get('id'));
		}
	},

	/**
	 * Event handler which is fired when the {@link Ext.data.Store} in the
	 * {@link Ext.grid.GridPanel} fires the {@link Ext.data.Store#remove remove}
	 * event. This will remove the corresponding records from the 2
	 * {@link Ext.form.ComboBox comboboxes}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} records The records which were deleted
	 * @param {Number} index The index from where the records were deleted
	 * @private
	 */
	onGridDelSignature : function(store, records, index)
	{
		var d1 = this.newMessageCombo.getStore();
		var d2 = this.replyMessageCombo.getStore();

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			var orig;

			orig = d1.getById(records[i].id);
			d1.remove(orig);
			orig = d2.getById(records[i].id);
			d2.remove(orig);
		}

		// Change the current selection when the deleted record
		// was the currently selected record...
		records = d1.getById(this.newMessageCombo.getValue());
		if (!records) {
			this.newMessageCombo.setValue(0);
		}
		records = d1.getById(this.replyMessageCombo.getValue());
		if (!records) {
			this.replyMessageCombo.setValue(0);
		}
	},

	/**
	 * Event handler which is fired when the {@link Ext.data.Store} in the
	 * {@link Ext.grid.GridPanel} fires the {@link Ext.data.Store#update update}
	 * event. This will merge the changes of the given records in the corresponding
	 * records in the 2 {@link Ext.form.ComboBox comboboxes}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} records The records which were updated
	 * @private
	 */
	onGridUpdateSignature : function(store, records)
	{
		var d1 = this.newMessageCombo.getStore();
		var d2 = this.replyMessageCombo.getStore();

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			var orig;

			orig = d1.getById(records[i].id);
			Ext.apply(orig.data, records[i].data);
			orig = d2.getById(records[i].id);
			Ext.apply(orig.data, records[i].data);
		}

		d1.fireEvent('datachanged', d1);
		d2.fireEvent('datachanged', d2);

		// Force reload the current selection, by default the 'datachanged'
		// event will ensure that the dropdownlist of the combobox is changed,
		// however for the currently selected value we must force selection.
		this.newMessageCombo.setValue(this.newMessageCombo.getValue());
		this.replyMessageCombo.setValue(this.replyMessageCombo.getValue());
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;

		// Reset the current selection
		this.doSelectSignature(undefined);

		// Convert the signatures into Store data
		var signatures = settingsModel.get(this.signaturesGrid.name, true);
		var signaturesArray = [];
		for (var key in signatures) {
			signaturesArray.push(Ext.apply({}, signatures[key], { id : key }));
		}

		// Load all signatures into the GridPanel
		var store = this.signaturesGrid.getStore();
		store.loadData(signaturesArray);

		// For the Signatures selection combo, we must add a fake entry called <None>
		// to disable the signatures in some situations.
		var signaturesIdArray = [{ id : 0, name : '<'+ _('None') + '>' }].concat(signaturesArray);

		// Load the signature ids into the New Message, and select the correct value
		// based on the settings.
		store = this.newMessageCombo.getStore();
		store.loadData(signaturesIdArray);
		var newId = settingsModel.get(this.newMessageCombo.name);
		var newRecord = store.getById(newId);
		if (!newRecord) {
			newId = 0; // Select the <None> option
		}
		this.newMessageCombo.setValue(newId);

		// Load the signature ids into the Reply/Forward Message, and select the correct value
		// based on the settings.
		store = this.replyMessageCombo.getStore();
		store.loadData(signaturesIdArray);
		var replyId = settingsModel.get(this.replyMessageCombo.name);
		var replyRecord = store.getById(replyId);
		if (!replyRecord) {
			replyId = 0; // Select the <None> option
		}
		this.replyMessageCombo.setValue(replyId);

		// By default the name and content fields will be disabled, but just for the fun
		// we will toggle the editortype to something we actually expect
		var useHtml = settingsModel.get('zarafa/v1/contexts/mail/dialogs/mailcreate/use_html_editor');
		this.contentField.setHtmlEditor(useHtml, false);

		// We also want to be cool, so when the user toggles the use_html_editor combobox we directly
		// change this editor immediately.
		this.mon(settingsModel, 'set', this.onSettingsSet, this);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.beginEdit();

		// In case we were editing a signature, save it now
		this.onSaveSignature();

		// Start reading the Grid store and convert the contents back into
		// an object which can be pushed to the settings.
		var signatures = this.signaturesGrid.getStore().getRange();
		var signaturesData = {};
		for (var i = 0, len = signatures.length; i < len; i++) {
			var signature = signatures[i];

			signaturesData[signature.get('id')] = {
				'name' : signature.get('name'),
				'content' : signature.get('content'),
				'isHTML' : signature.get('isHTML')
			};
		}

		// If all signatures are removed, remove the full setting path. Otherwise the empty JavaScript object {}
		// will be interperted by PHP as an object and cause 4 empty signatures
		if (signatures.length !== 0) {
			settingsModel.set(this.signaturesGrid.name, signaturesData);
		} else {
			settingsModel.remove(this.signaturesGrid.name);
		}

		// Update the default signatures
		var newId = this.newMessageCombo.getValue();
		if (newId !== 0) {
			settingsModel.set(this.newMessageCombo.name, newId);
		} else {
			settingsModel.remove(this.newMessageCombo.name);
		}

		var replyId = this.replyMessageCombo.getValue();
		if (replyId !== 0) {
			settingsModel.set(this.replyMessageCombo.name, replyId);
		} else {
			settingsModel.remove(this.replyMessageCombo.name);
		}

		settingsModel.endEdit();
	},

	/**
	 * Event handler which is fired when {@link #model} fires the
	 * {@link Zarafa.settings.SettingsModel#set set} event. This will
	 * check if the 'use_html_editor' setting was changed by the user,
	 * and will {@link Zarafa.common.ui.EditorField#setHtmlEditor toggle} the
	 * {@link Zarafa.common.ui.EditorField EditorField} accordingly.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The model which fired the event
	 * @param {Object|Array} settings The modified settings
	 * @private
	 */
	onSettingsSet : function(settingsModel, settings)
	{
		if (!Array.isArray(settings)) {
			settings = [ settings ];
		}

		for (var i = 0, len = settings.length; i < len; i++) {
			var setting = settings[i];
			if (setting.path === 'zarafa/v1/contexts/mail/dialogs/mailcreate/use_html_editor') {
				this.contentField.setHtmlEditor(setting.value);
			}
		}
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * Signature selection combobox
	 *
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 */
	onSignatureComboSelect : function(field, record)
	{
		if (this.model) {
			var set = record.get(field.valueField);
			if (set === 0) {
				set = undefined;
			}

			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== set) {
				this.model.set(field.name, set);
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link Ext.grid.RowSelectionModel selectionModel}
	 * fires the {@link Ext.grid.RowSelectionModel#beforerowselect} event. This will check
	 * if the {@link #selectedSignature} contains {@link #hasDirtySignature modifications}.
	 * If this is the case, the function will return false to prevent the selection from being
	 * switched, and will display a {@link Ext.MessageBox MessageBox} asking the user if
	 * he wishes to save the signature (This will be handled by {@link #onSignatureBeforeRowSelectConfirm}).
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The model which fired the event
	 * @param {Number} rowIndex The row of the record which was selected
	 * @param {Boolean} keepExisting True if the already existing selection should be preserved
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	onSignatureBeforeRowSelect : function(selectionModel, rowIndex, keepExisting, record)
	{
		// Change focus, this should trigger a change event in the
		// textfield if we currently had our focus there...
		this.signaturesGrid.focus();
		if (this.hasDirtySignature()) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg : _('You have unsaved changes. Do you wish to save the changes?'),
				icon: Ext.MessageBox.QUESTION,
				fn: this.onSignatureBeforeRowSelectConfirm.createDelegate(this, [ selectionModel, rowIndex, keepExisting, record ], 1),
				buttons: Ext.MessageBox.YESNOCANCEL
			});

			return false;
		}
	},

	/**
	 * Event handler for the {@link Ext.MessageBox} as created by {@link #onSignatureBeforeRowSelect}.
	 * This will check what the user has responded, if 'cancel' then no action will be taken,
	 * when the user pressed 'yes' the {@link #selectedSignature} will be {@link #onSaveSignature saved},
	 * and if 'no' then we {@link #onRejectSignature reset the changes}. In the last 2 cases we will
	 * {@link Ext.grid.RowSelectionModel#selectRow select the requested row} again.
	 *
	 * @param {String} btn The button string which the user selected
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selectionModel which must be updated
	 * @param {Number} rowIndex The row index which should be selected
	 * @param {Boolean} keepExisting True to preserve the currently existing selection
	 * @param {Ext.data.Record} record The record which should be selected
	 * @private
	 */
	onSignatureBeforeRowSelectConfirm : function(btn, selectionModel, rowIndex, keepExisting, record)
	{
		if (btn === 'cancel') {
			return;
		}

		if (btn === 'yes') {
			this.onSaveSignature();
		} else {
			this.onRejectSignature();
		}

		selectionModel.selectRow(rowIndex, keepExisting);
	},

	/**
	 * Event handler which is fired when the {@link Ext.grid.RowSelectionModel selection model}
	 * fires the {@link Ext.grid.RowSelectionModel#selectionchange selectionchange} event. This
	 * will call {@link #doSelectSignature}.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selectionModel which fired the event
	 * @private
	 */
	onSignatureSelectionChange : function(selectionModel)
	{
		var record = selectionModel.getSelected();
		this.doSelectSignature(record);
	},

	/**
	 * This will update the UI to select the given Signature {@link Ext.data.Record record}.
	 * This will {@link Ext.form.Field#enable enable} the form fields and load the
	 * {@link Ext.form.Field#setValue values} into the forms.
	 * It will finally apply the {@link Ext.form.Field#focus focus} on the
	 * {@link Zarafa.common.ui.EditorField Content Field} to ensure the user can directly
	 * start typing
	 *
	 * @param {Ext.data.Record} record The record which is selected
	 * @private
	 */
	doSelectSignature : function(record)
	{
		if (!Ext.isEmpty(record)) {
			this.selectedSignature = record;
			this.dirtySelectedSignature = false;

			// Enable all fields, load the data into them
			// For the Editor we also toggle the editor
			// based on the isHTML flag
			this.delSignatureBtn.enable();
			this.nameField.setValue(record.get('name'));
			this.nameField.enable();
			this.contentField.bindRecord(record);
			this.contentField.setHtmlEditor(record.get('isHTML'), false);
			this.contentField.setValue(record.get('content'));
			this.contentField.enable();
			this.saveSignatureBtn.enable();

			// Allow the user to directly start editing the content
			this.contentField.focus();
		} else {
			delete this.selectedSignature;
			this.dirtySelectedSignature = false;

			this.delSignatureBtn.disable();
			this.nameField.reset();
			this.nameField.disable();
			this.contentField.bindRecord();
			this.contentField.setValue("");
			this.contentField.disable();
			this.saveSignatureBtn.disable();
			this.signaturesGrid.getSelectionModel().clearSelections();
		}
	},

	/**
	 * Event handler which is fired when the user presses the 'Add' {@link Ext.Button button}.
	 * this will check if we are currently busy {@link #selectedSignature editing a signature},
	 * if this signature {@link #dirtySelectedSignature is modified} this will {@link Ext.MessageBox ask}
	 * the user if he wishes to save the changes (this will be handled by {@link #onAddSignatureConfirm}).
	 *
	 * If nothing needs to be saved, {@link #doAddSignature} will be called.
	 * @private
	 */
	onAddSignature : function()
	{
		// Change focus, this should trigger a change event in the
		// textfield if we currently had our focus there...
		this.signaturesGrid.focus();

		if (this.hasDirtySignature()) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg : _('You have unsaved changes. Do you wish to save the changes?'),
				icon: Ext.MessageBox.QUESTION,
				fn: this.onAddSignatureConfirm.createDelegate(this),
				buttons: Ext.MessageBox.YESNOCANCEL
			});

			return;
		}

		this.doAddSignature();
	},

	/**
	 * Event handler for the {@link Ext.MessageBox} as created by {@link #onAddSignature}.
	 * If the user pressed 'cancel' no further action will be taken. If the user pressed
	 * 'yes' then the signature will be {@link #onSaveSignature}, if the user pressed 'no',
	 * then the {@link #onRejectSignature changes are reset}. In the last 2 cases, the new
	 * signature will be {@link #doAddSignature created}.
	 *
	 * @param {String} btn The button string which the user selected
	 * @private
	 */
	onAddSignatureConfirm : function(btn)
	{
		if (btn === 'cancel') {
			return;
		}

		if (btn === 'yes') {
			this.onSaveSignature();
		} else {
			this.onRejectSignature();
		}

		this.doAddSignature();
	},

	/**
	 * Create a new signature, this will create a new {@link Ext.data.Record record} which is
	 * directly {@link Ext.grid.RowSelectionModel#selectRecords selected in the grid} and
	 * will be {@link #doSelectSignature loaded into the UI}.
	 * @private
	 */
	doAddSignature : function()
	{
		var isHtmlEditor = this.contentField.isHtmlEditor();
		var store = this.signaturesGrid.getStore();
		var record = new store.recordType({
			id : new Date().getTime(),
			name : _('New signature'),
			isHTML : isHtmlEditor
		});

		store.add(record);

		// Add the signature to the settings
		if (this.model) {
			this.model.set(this.signaturesGrid.name + '/' + record.get('id'), {
				'name' : record.get('name'),
				'content' : record.get('content'),
				'isHTML' : record.get('isHTML')
			});
		}

		// Automatically select the new signature
		this.signaturesGrid.getSelectionModel().selectRecords([ record ]);
		this.doSelectSignature(record);

		/*
		 * For the first time when we initialize htmlEditor with record, for empty value
		 * editor(especially in FF) sets <br> in the field so getValue() function of
		 * editor will return <br>, so for even unchanged new signature, it will so
		 * Message Dialog that signature is edited and not saved (WA-2919).
		 * The other issues is that we are not using defaultValue config for editor field.
		 * So to avoid this situation we are setting initial editor's value in to record.
		 */
		record.set('content', this.contentField.getValue());
	},

	/**
	 * Event handler which is fired when the 'Delete' button has been pressed. This
	 * will grab the {@link #selectedSignature currently selected} {@link Ext.data.Record record}
	 * and {@link Ext.data.Store#remove remove} it.
	 * @private
	 */
	onDeleteSignature : function()
	{
		// Remove the signature from the settings
		if (this.model) {
			this.model.remove(this.signaturesGrid.name + '/' + this.selectedSignature.get('id'));
		}

		var store = this.signaturesGrid.getStore();

		// Obtain the index of the current selection
		var oldIndex = store.indexOf(this.selectedSignature);

		store.remove(this.selectedSignature);
		delete this.selectedSignature;
		this.dirtySelectedSignature = false;

		// Select the next available row, this could either be the exact same
		// rowIndex as the one which we previously deleted (this means we select
		// the "next row" or we select the last row in the grid (which means
		// we select the "previous row".
		if (oldIndex < store.getCount()) {
			this.signaturesGrid.getSelectionModel().selectRow(oldIndex);
		} else {
			this.signaturesGrid.getSelectionModel().selectLastRow();
		}
	},

	/**
	 * Event handler which is fired when the user presses the 'Save' button. This
	 * will load the data from the {@link Ext.form.Field fields} into the currently
	 * {@link #selectedSignature selected} {@link Ext.data.Record record}.
	 * @private
	 */
	onSaveSignature : function()
	{
		var record = this.selectedSignature;
		if (record) {
			record.set(this.nameField.name, this.nameField.getValue());
			record.set(this.contentField.name, this.contentField.getValue());
			record.set('isHTML', this.contentField.isHtmlEditor(), true);
			record.commit();

			// We just saved the signature, reset the dirty flag
			this.dirtySelectedSignature = false;
		}
	},

	/**
	 * Event handler which will reset all changes made to the {@link #selectedSignature selected}
	 * {@link Ext.data.Record record}. This will all data from the signature back into
	 * the [@link Ext.form.Field fields} and reset {@link #dirtySelectedSignature}.
	 * @private
	 */
	onRejectSignature : function()
	{
		var record = this.selectedSignature;
		if (record) {
			this.nameField.setValue(record.get(this.nameField.name));

			// First, remove all the content form editor to avoid conflict in changes before reset the content
			// as saved in record at its original value.
			this.contentField.setValue("");
			this.contentField.setValue(record.get(this.contentField.name));

			// We just reset the signature, reset the dirty flag
			this.dirtySelectedSignature = false;
		}
	},

	/**
	 * Event handler which is called when one of the {@link #nameField} has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onNameFieldChange : function(field, value)
	{
		if (this.selectedSignature) {
			if (this.selectedSignature.get(field.name) !== value) {
				this.dirtySelectedSignature = true;
			}
		}
	},

	/**
	 * Event handler which is called when the {@link #contentField} has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onEditorFieldChange : function(field, value)
	{
		if (this.selectedSignature) {
			if (this.selectedSignature.get(field.name) !== this.contentField.getValue()) {
				this.dirtySelectedSignature = true;
			}
		}
	},

	/**
	 * @return {Boolean} True when there are {@link #dirtySelectedSignature changes}
	 * made to the {@link #selectedSignatuer selected signature} or if any of the
	 * form fields still have pending changes.
	 */
	hasDirtySignature : function()
	{
		if (this.selectedSignature) {
			// If the dirty flag is already enabled, then no
			// need to check for modifications. Otherwise check
			// all fields.
			if (this.dirtySelectedSignature !== true) {
				this.onNameFieldChange(this.nameField, this.nameField.getValue());
				this.onEditorFieldChange(this.contentField, this.contentField.getValue());
			}

			return this.dirtySelectedSignature;
		} else {
			return false;
		}
	},

	/**
	 * Event handler for the {@link Zarafa.common.ui.HtmlEditor#valuecorrection valuecorrection}
	 * event which is fired when the HTML content gets adjusted automatically by tinyMCE quirks logic
	 * after it has been set into the {@link Zarafa.common.ui.HtmlEditor}.
	 * This will apply the corrected value silently into the {@link #selectedSignature} to prevent considering this as a change.
	 * @param {Zarafa.common.ui.HtmlEditor} field The field which fired the event
	 * @param {String} value The corrected value
	 * @param {String} oldValue the original value which was applied.
	 * @private
	 */
	onValueCorrection : function(field, value, oldValue)
	{
		this.selectedSignature.data.content = value;
	}
});

Ext.reg('zarafa.settingssignatureswidget', Zarafa.mail.settings.SettingsSignaturesWidget);
