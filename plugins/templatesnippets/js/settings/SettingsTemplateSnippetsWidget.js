Ext.namespace('Zarafa.plugins.templatesnippets.settings');

/**
 * @class Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingstemplatesnippetswidget
 *
 * Widget for managing user-defined and viewing system-provided template snippets.
 *
 * ref semantics in ExtJS 3: each path segment (incl. name) traverses one ownerCt.
 *   'foo' = parent,  '../foo' = grandparent,  '../../foo' = great-grandparent
 */
Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	dirtySelectedTemplate: false,
	selectedTemplate: undefined,
	isAdmin: false,
	editorVisible: false,
	/** @private True after system templates have been loaded into the grid for the first time */
	_systemTemplatesLoaded: false,

	constructor: function(config) {
		config = config || {};

		this.isAdmin = container.getSettingsModel().get('zarafa/v1/plugins/templatesnippets/is_admin') === true;

		var systemStore = {
			xtype: 'jsonstore',
			fields: [
				{ name: 'key' }, { name: 'name' }, { name: 'html' },
				{ name: 'text' }, { name: 'source', defaultValue: 'system' }
			],
			sortInfo: { field: 'name', direction: 'ASC' },
			autoDestroy: true
		};

		var userStore = {
			xtype: 'jsonstore',
			fields: [
				{ name: 'key' }, { name: 'name' }, { name: 'html' },
				{ name: 'text' }, { name: 'source', defaultValue: 'user' }
			],
			sortInfo: { field: 'name', direction: 'ASC' },
			autoDestroy: true
		};

		// Always show buttons for consistent grid height; disable for non-admins
		var systemGridButtons = [{
			text: _('New'),
			disabled: !this.isAdmin,
			handler: this.onAddSystemTemplate,
			scope: this
		},{
			text: _('Delete'),
			itemId: 'delSystemBtn',
			disabled: true,
			handler: this.onDeleteSystemTemplate,
			scope: this
		}];

		Ext.applyIf(config, {
			title: _('Template Snippets'),
			// Keep the base class so we inherit rounded borders, padding, shadow
			cls: 'zarafa-settings-widget k-settings-templatesnippets-widget',
			items: [{
				xtype: 'displayfield',
				cls: 'k-templatesnippets-section-title',
				hideLabel: true,
				value: _('System Templates') +
					(this.isAdmin ? '' : ' <span class="k-settings-label-minor">(' + _('read-only') + ')</span>')
			},{
				xtype: 'grid',
				ref: 'systemTemplatesGrid',
				cls: 'k-templatesnippets-grid',
				height: 128,
				store: systemStore,
				hideHeaders: true,
				viewConfig: {
					forceFit: true,
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No system templates available') + '</div>'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true,
					listeners: {
						selectionchange: this.onSystemSelectionChange,
						scope: this
					}
				}),
				columns: [{
					dataIndex: 'name',
					header: '&#160;',
					renderer: Ext.util.Format.htmlEncode
				}],
				buttons: systemGridButtons
			},{
				xtype: 'displayfield',
				cls: 'k-templatesnippets-section-title',
				hideLabel: true,
				value: _('User Templates')
			},{
				xtype: 'grid',
				ref: 'userTemplatesGrid',
				cls: 'k-templatesnippets-grid',
				height: 128,
				store: userStore,
				hideHeaders: true,
				viewConfig: {
					forceFit: true,
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No user templates defined') + '</div>'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true,
					listeners: {
						beforerowselect: this.onBeforeRowSelect,
						selectionchange: this.onUserSelectionChange,
						scope: this
					}
				}),
				columns: [{
					dataIndex: 'name',
					header: '&#160;',
					renderer: Ext.util.Format.htmlEncode
				}],
				buttons: [{
					text: _('New'),
					handler: this.onAddUserTemplate,
					scope: this
				},{
					text: _('Delete'),
					itemId: 'delUserBtn',
					disabled: true,
					handler: this.onDeleteUserTemplate,
					scope: this
				}]
			},{
				xtype: 'container',
				ref: 'editorPanel',
				cls: 'k-templatesnippets-editor-panel',
				hidden: true,
				layout: 'anchor',
				defaults: { anchor: '100%' },
				items: [
				// Row: template name + save button
				{
					xtype: 'container',
					anchor: '100%',
					cls: 'k-templatesnippets-name-row',
					items: [{
						xtype: 'textfield',
						ref: '../../nameField',
						hideLabel: true,
						cls: 'k-templatesnippets-name-input',
						emptyText: _('Template name')
					},{
						xtype: 'button',
						ref: '../../saveTemplateBtn',
						text: _('Save Template'),
						cls: 'k-templatesnippets-save-btn',
						handler: this.onSaveTemplate,
						scope: this
					}]
				},
				// HTML editor
				{
					xtype: 'displayfield',
					hideLabel: true,
					cls: 'k-templatesnippets-section-title',
					value: _('HTML Content')
				},{
					xtype: 'zarafa.editorfield',
					ref: '../htmlEditorField',
					cls: 'k-templatesnippets-html-editor',
					hideLabel: true,
					name: 'html',
					htmlName: 'html',
					plaintextName: 'html',
					anchor: '100%',
					height: 250,
					useHtml: true
				},
				// Convert buttons between HTML and plain text
				{
					xtype: 'container',
					anchor: '100%',
					cls: 'k-templatesnippets-convert-row',
					layout: 'column',
					items: [{
						xtype: 'button',
						ref: '../../convertHtmlBtn',
						text: _('Convert HTML to Plain Text'),
						handler: this.onConvertHtmlToText,
						scope: this
					},{
						xtype: 'button',
						ref: '../../convertTextBtn',
						text: _('Convert Plain Text to HTML'),
						style: 'margin-left: 8px',
						handler: this.onConvertTextToHtml,
						scope: this
					}]
				},
				// Plain text editor
				{
					xtype: 'displayfield',
					hideLabel: true,
					cls: 'k-templatesnippets-section-title',
					value: _('Plain Text Content')
				},{
					xtype: 'textarea',
					ref: '../textEditorField',
					hideLabel: true,
					name: 'text',
					anchor: '100%',
					height: 200
				}]
			}]
		});

		Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsWidget.superclass.constructor.call(this, config);
	},

	getGridButton: function(grid, itemId) {
		if (!grid || !grid.getFooterToolbar) { return undefined; }
		var fbar = grid.getFooterToolbar();
		return fbar ? fbar.getComponent(itemId) : undefined;
	},

	/**
	 * Generate a unique template name by appending (2), (3), etc. if a duplicate exists.
	 * Checks both system and user template stores.
	 * @param {String} baseName The desired name
	 * @param {Ext.data.Record} excludeRecord Optional record to exclude from duplicate check
	 * @return {String} A unique name
	 */
	getUniqueName: function(baseName, excludeRecord) {
		var allRecords = this.systemTemplatesGrid.getStore().getRange()
			.concat(this.userTemplatesGrid.getStore().getRange());
		var names = {};
		for (var i = 0; i < allRecords.length; i++) {
			if (excludeRecord && allRecords[i] === excludeRecord) { continue; }
			names[allRecords[i].get('name')] = true;
		}
		if (!names[baseName]) { return baseName; }
		var n = 2;
		while (names[baseName + ' (' + n + ')']) { n++; }
		return baseName + ' (' + n + ')';
	},

	/**
	 * Write the current system templates grid state into the settings model
	 * so the compose toolbar dropdown reflects changes immediately.
	 * Safe to call at any time — update() guards against reloading the grid
	 * once _systemTemplatesLoaded is true.
	 * @private
	 */
	syncSystemTemplatesToSettings: function() {
		var records = this.systemTemplatesGrid.getStore().getRange();
		var data = {};
		for (var i = 0; i < records.length; i++) {
			var rec = records[i];
			data[rec.get('key')] = {
				name: rec.get('name'), html: rec.get('html'), text: rec.get('text')
			};
		}
		var settingsModel = container.getSettingsModel();
		if (records.length > 0) {
			settingsModel.set('zarafa/v1/plugins/templatesnippets/system_templates', data);
		} else {
			settingsModel.remove('zarafa/v1/plugins/templatesnippets/system_templates');
		}
	},

	update: function(settingsModel) {
		this.model = settingsModel;
		this.doDeselectTemplate();

		// System templates: load from settings only once (on first render).
		// After that the grid store is the session truth — admin CRUD
		// operations modify it directly and persist to disk via the PHP module.
		// The settings model snapshot is stale after admin edits and must not
		// overwrite the grid.
		if (!this._systemTemplatesLoaded) {
			var systemTemplates = settingsModel.get('zarafa/v1/plugins/templatesnippets/system_templates', true) || {};
			var systemArray = [];
			for (var skey in systemTemplates) {
				if (systemTemplates.hasOwnProperty(skey)) {
					systemArray.push(Ext.apply({}, systemTemplates[skey], { key: skey, source: 'system' }));
				}
			}
			this.systemTemplatesGrid.getStore().loadData(systemArray);
			this._systemTemplatesLoaded = true;
		}

		// User templates: always reload from settings (they are persisted
		// through the normal settings save cycle via updateSettings).
		var userTemplates = settingsModel.get('zarafa/v1/plugins/templatesnippets/user_templates', true) || {};
		var userArray = [];
		for (var ukey in userTemplates) {
			if (userTemplates.hasOwnProperty(ukey)) {
				userArray.push(Ext.apply({}, userTemplates[ukey], { key: ukey, source: 'user' }));
			}
		}
		this.userTemplatesGrid.getStore().loadData(userArray);
	},

	updateSettings: function(settingsModel) {
		this.onSaveTemplate();
		settingsModel.beginEdit();

		// Sync system templates into settings so the framework sees them
		// as part of the save and the compose dropdown stays current.
		var sysRecords = this.systemTemplatesGrid.getStore().getRange();
		var sysTemplates = {};
		for (var j = 0; j < sysRecords.length; j++) {
			var sr = sysRecords[j];
			sysTemplates[sr.get('key')] = {
				name: sr.get('name'), html: sr.get('html'), text: sr.get('text')
			};
		}
		if (sysRecords.length > 0) {
			settingsModel.set('zarafa/v1/plugins/templatesnippets/system_templates', sysTemplates);
		} else {
			settingsModel.remove('zarafa/v1/plugins/templatesnippets/system_templates');
		}

		// User templates
		var records = this.userTemplatesGrid.getStore().getRange();
		var userTemplates = {};
		for (var i = 0; i < records.length; i++) {
			var rec = records[i];
			userTemplates[rec.get('key')] = {
				name: rec.get('name'), html: rec.get('html'), text: rec.get('text')
			};
		}
		if (records.length > 0) {
			settingsModel.set('zarafa/v1/plugins/templatesnippets/user_templates', userTemplates);
		} else {
			settingsModel.remove('zarafa/v1/plugins/templatesnippets/user_templates');
		}
		settingsModel.endEdit();
	},

	// =====================================================================
	// Selection and editing
	// =====================================================================

	doDeselectTemplate: function() {
		delete this.selectedTemplate;
		this.dirtySelectedTemplate = false;
		this.editorVisible = false;
		if (this.editorPanel) { this.editorPanel.hide(); }
		var delUserBtn = this.getGridButton(this.userTemplatesGrid, 'delUserBtn');
		if (delUserBtn) { delUserBtn.disable(); }
		var delSysBtn = this.getGridButton(this.systemTemplatesGrid, 'delSystemBtn');
		if (delSysBtn) { delSysBtn.disable(); }
	},

	doSelectTemplate: function(record, readOnly) {
		this.selectedTemplate = record;
		this.dirtySelectedTemplate = false;
		this.editorVisible = true;

		this.editorPanel.show();
		this.editorPanel.doLayout();

		this.nameField.setValue(record.get('name'));
		this.textEditorField.setValue(record.get('text') || '');
		(function() {
			if (this.htmlEditorField) {
				this.htmlEditorField.setValue(record.get('html') || '');
			}
		}).createDelegate(this).defer(200);

		if (readOnly) {
			this.nameField.disable();
			this.htmlEditorField.disable();
			this.textEditorField.disable();
			this.saveTemplateBtn.disable();
			this.convertHtmlBtn.disable();
			this.convertTextBtn.disable();
		} else {
			this.nameField.enable();
			this.htmlEditorField.enable();
			this.textEditorField.enable();
			this.saveTemplateBtn.enable();
			this.convertHtmlBtn.enable();
			this.convertTextBtn.enable();
		}
	},

	onBeforeRowSelect: function(selectionModel, rowIndex) {
		if (this.hasDirtyTemplate()) {
			Ext.MessageBox.show({
				title: _('Unsaved changes'),
				msg: _('You have unsaved changes. Do you wish to save the changes?'),
				fn: this.onBeforeRowSelectConfirm.createDelegate(this, [selectionModel, rowIndex], 1),
				buttons: Ext.MessageBox.YESNOCANCEL
			});
			return false;
		}
	},

	onBeforeRowSelectConfirm: function(btn, selectionModel, rowIndex) {
		if (btn === 'cancel') { return; }
		if (btn === 'yes') { this.onSaveTemplate(); }
		else { this.dirtySelectedTemplate = false; }
		selectionModel.selectRow(rowIndex);
	},

	hasDirtyTemplate: function() {
		if (!this.selectedTemplate) { return false; }
		if (this.dirtySelectedTemplate) { return true; }
		if (this.nameField && this.nameField.rendered &&
			this.selectedTemplate.get('name') !== this.nameField.getValue()) { return true; }
		return false;
	},

	// =====================================================================
	// Grid selection handlers
	// =====================================================================

	onSystemSelectionChange: function(sm) {
		var record = sm.getSelected();
		if (!record) {
			// Only deselect if not triggered by cross-grid clearSelections
			if (!this._clearing) { this.doDeselectTemplate(); }
			return;
		}
		this._clearing = true;
		this.userTemplatesGrid.getSelectionModel().clearSelections();
		this._clearing = false;
		var delUserBtn = this.getGridButton(this.userTemplatesGrid, 'delUserBtn');
		if (delUserBtn) { delUserBtn.disable(); }
		if (this.isAdmin) {
			var db = this.getGridButton(this.systemTemplatesGrid, 'delSystemBtn');
			if (db) { db.enable(); }
		}
		this.doSelectTemplate(record, !this.isAdmin);
	},

	onUserSelectionChange: function(sm) {
		var record = sm.getSelected();
		if (!record) {
			if (!this._clearing) { this.doDeselectTemplate(); }
			return;
		}
		this._clearing = true;
		this.systemTemplatesGrid.getSelectionModel().clearSelections();
		this._clearing = false;
		if (this.isAdmin) {
			var db = this.getGridButton(this.systemTemplatesGrid, 'delSystemBtn');
			if (db) { db.disable(); }
		}
		var delUserBtn = this.getGridButton(this.userTemplatesGrid, 'delUserBtn');
		if (delUserBtn) { delUserBtn.enable(); }
		this.doSelectTemplate(record, false);
	},

	// =====================================================================
	// User template CRUD
	// =====================================================================

	onAddUserTemplate: function() {
		if (this.hasDirtyTemplate()) {
			Ext.MessageBox.show({
				title: _('Unsaved changes'),
				msg: _('You have unsaved changes. Do you wish to save the changes?'),
				fn: function(btn) {
					if (btn === 'cancel') { return; }
					if (btn === 'yes') { this.onSaveTemplate(); }
					else { this.dirtySelectedTemplate = false; }
					this.doAddUserTemplate();
				}.createDelegate(this),
				buttons: Ext.MessageBox.YESNOCANCEL
			});
			return;
		}
		this.doAddUserTemplate();
	},

	doAddUserTemplate: function() {
		var store = this.userTemplatesGrid.getStore();
		var record = new store.recordType({
			key: String(new Date().getTime()),
			name: this.getUniqueName(_('New template')),
			html: '', text: '', source: 'user'
		});
		store.add(record);
		this._clearing = true;
		this.systemTemplatesGrid.getSelectionModel().clearSelections();
		this._clearing = false;
		this.userTemplatesGrid.getSelectionModel().selectRecords([record]);
		this.doSelectTemplate(record, false);
		this.nameField.focus(true, 200);
	},

	onDeleteUserTemplate: function() {
		if (!this.selectedTemplate || this.selectedTemplate.get('source') !== 'user') { return; }
		var store = this.userTemplatesGrid.getStore();
		var idx = store.indexOf(this.selectedTemplate);
		store.remove(this.selectedTemplate);
		this.doDeselectTemplate();
		if (idx < store.getCount()) { this.userTemplatesGrid.getSelectionModel().selectRow(idx); }
		else if (store.getCount() > 0) { this.userTemplatesGrid.getSelectionModel().selectLastRow(); }
	},

	// =====================================================================
	// System template admin CRUD
	// =====================================================================

	onAddSystemTemplate: function() {
		if (this.hasDirtyTemplate()) {
			Ext.MessageBox.show({
				title: _('Unsaved changes'),
				msg: _('You have unsaved changes. Do you wish to save the changes?'),
				fn: function(btn) {
					if (btn === 'cancel') { return; }
					if (btn === 'yes') { this.onSaveTemplate(); }
					else { this.dirtySelectedTemplate = false; }
					this.doAddSystemTemplate();
				}.createDelegate(this),
				buttons: Ext.MessageBox.YESNOCANCEL
			});
			return;
		}
		this.doAddSystemTemplate();
	},

	doAddSystemTemplate: function() {
		var store = this.systemTemplatesGrid.getStore();
		var record = new store.recordType({
			key: 'new_' + new Date().getTime(),
			name: this.getUniqueName(_('New system template')),
			html: '', text: '', source: 'system'
		});
		store.add(record);
		this._clearing = true;
		this.userTemplatesGrid.getSelectionModel().clearSelections();
		this._clearing = false;
		this.systemTemplatesGrid.getSelectionModel().selectRecords([record]);
		this.doSelectTemplate(record, false);
		this.nameField.focus(true, 200);
	},

	onDeleteSystemTemplate: function() {
		var record = this.systemTemplatesGrid.getSelectionModel().getSelected();
		if (!record) { return; }
		Ext.MessageBox.confirm(
			_('Delete system template'),
			String.format(_('Are you sure you want to delete the system template "{0}"? This affects all users.'),
				Ext.util.Format.htmlEncode(record.get('name'))),
			function(btn) {
				if (btn !== 'yes') { return; }
				container.getRequest().singleRequest(
					'templatesnippetsmodule', 'delete', { key: record.get('key') },
					new Zarafa.plugins.templatesnippets.TemplateSnippetsResponseHandler({
						successCallback: function() {
							this.systemTemplatesGrid.getStore().remove(record);
							this.doDeselectTemplate();
							this.syncSystemTemplatesToSettings();
						},
						scope: this
					})
				);
			}, this
		);
	},

	// =====================================================================
	// Save / Convert
	// =====================================================================

	onSaveTemplate: function() {
		var record = this.selectedTemplate;
		if (!record || !this.editorVisible) { return; }
		var name = this.getUniqueName(this.nameField.getValue(), record);
		this.nameField.setValue(name);
		var htmlContent = this.htmlEditorField.getValue();
		var textContent = this.textEditorField.getValue();
		record.set('name', name);
		record.set('html', htmlContent);
		record.set('text', textContent);
		record.commit();
		this.dirtySelectedTemplate = false;
		if (record.get('source') === 'system') {
			container.getRequest().singleRequest(
				'templatesnippetsmodule', 'save',
				{ key: record.get('key'), name: name, html: htmlContent, text: textContent },
				new Zarafa.plugins.templatesnippets.TemplateSnippetsResponseHandler({
					successCallback: function(response) {
						if (response && response.item && response.item[0] && response.item[0].key) {
							var updatedKey = response.item[0].key;
							if (updatedKey !== record.get('key')) {
								record.set('key', updatedKey);
								record.commit();
							}
						}
						this.syncSystemTemplatesToSettings();
					},
					scope: this
				})
			);
		}
	},

	onConvertHtmlToText: function() {
		var v = this.htmlEditorField.getValue();
		if (v) {
			this.textEditorField.setValue(Zarafa.core.HTMLParser.convertHTMLToPlain(v));
			this.dirtySelectedTemplate = true;
		}
	},

	onConvertTextToHtml: function() {
		var v = this.textEditorField.getValue();
		if (v) {
			this.htmlEditorField.setValue(Zarafa.core.HTMLParser.convertPlainToHTML(v));
			this.dirtySelectedTemplate = true;
		}
	}
});

Ext.reg('zarafa.settingstemplatesnippetswidget', Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsWidget);
