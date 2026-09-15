/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files');

/**
 * @class Grommunio.plugins.files.FilesContext
 * @extends Grommunio.core.Context
 *
 * This class will add a new context to grommunio Web. The new context
 * offers a filebrowser for the Files backend.
 */
Grommunio.plugins.files.FilesContext = Ext.extend(Grommunio.core.Context, {

	/**
	 * When searching, this property marks the {@link Grommunio.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started}.
	 *
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView: undefined,

	/**
	 * When searching, this property marks the {@link Grommunio.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started}.
	 *
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode: undefined,

	/**
	 * accountsStore which contains all configured
	 * {@link Grommunio.plugins.files.data.AccountRecord accounts}.
	 *
	 * @property
	 * @type Grommunio.plugins.files.data.AccountStore
	 * @private
	 */
	accountsStore: undefined,

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			current_view     : Grommunio.plugins.files.data.Views.LIST,
			current_view_mode: Grommunio.plugins.files.data.ViewModes.RIGHT_PREVIEW
		});

		this.registerInsertionPoint('context.settings.categories', this.createSettingCategories, this);
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewFilesButton, this);
		this.registerInsertionPoint('main.toolbar.actions.last', this.createMainToolbarButtons, this);
		this.registerInsertionPoint('navigation.center', this.createFilesNavigationPanel, this);

		this.registerInsertionPoint('main.attachment.method', this.createAttachmentDownloadInsertionPoint, this);
		this.registerInsertionPoint('common.contextmenu.attachment.actions', this.createAttachmentUploadInsertionPoint, this);
		this.registerInsertionPoint('context.mail.contextmenu.actions', this.createEmailUploadInsertionPoint, this);

		Grommunio.plugins.files.FilesContext.superclass.constructor.call(this, config);

		var notificationResolver = container.getNotificationResolver();
		if (Ext.isFunction(notificationResolver.addIPFNotificationModule)) {
			notificationResolver.addIPFNotificationModule("fileshierarchynotifier");
		}

		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.attachdialog');
		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.createfolderdialog');
		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.createfiledialog');
		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.fileinfopanel');
		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.sharedialog');
		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.uploadstatusdialog');
		Grommunio.core.data.SharedComponentType.addProperty('grommunio.plugins.files.treecontextmenu');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.attachments.files');
	},

	/**
	 * Adds a new tab item to the top tab bar of grommunio Web.
	 *
	 * @returns {Object} The button for the top tab bar.
	 */
	createMainTab: function () {
		return {
			text         : this.getDisplayName(),
			tabOrderIndex: 7,
			context      : this.getName()
		};
	},

	/**
	 * This method hooks to the attachments chooser button and allows users to add files from
	 * the Files plugin to their emails.
	 *
	 * @param include
	 * @param btn
	 * @returns {Object}
	 */
	createAttachmentDownloadInsertionPoint: function (include, btn)
	{
		return {
			text: _('Add from Files'),
			handler: this.showFilesDownloadAttachmentDialog,
			scope: btn,
			context: this,
			iconCls: 'icon_files_category',
			disabled: !this.isAccountsConfigured()
		};
	},

	/**
	 * This method will open the {@link Grommunio.plugins.files.ui.dialogs.AttachFromFilesContentPanel file chooser panel}.
	 *
	 * @param btn
	 */
	showFilesDownloadAttachmentDialog: function (btn)
	{
		// TODO: Move this function to action.js

		var activeMenuItem = this.menu.activeItem;
		var component = Grommunio.core.data.SharedComponentType['common.dialog.attachments.files'];
		Grommunio.core.data.UIFactory.openLayerComponent(component, this.record, {
			title: _('Add attachment from Files'),
			modal: true,
			model: activeMenuItem.context.getModel()
		});
	},

	/**
	 * Helper function which will return false if no account is configured, True otherwise.
	 * @returns {boolean} True if accounts configured, false otherwise.
	 */
	isAccountsConfigured: function ()
	{
		var accountStore = this.getAccountsStore();
		var foundActiveStore =  accountStore.findBy(function (item) {
			if (item.get("status") === Grommunio.plugins.files.data.AccountRecordStatus.OK) {
				return true;
			}
		});
		return foundActiveStore !== -1;
	},

	/**
	 * This method hooks to the attachment context menu and allows users to store files from
	 * their emails to the  Files plugin.
	 *
	 * @param include
	 * @param btn
	 * @returns {Object}
	 */
	createAttachmentUploadInsertionPoint: function (include, btn)
	{
		return {
			text   : _('Add to Files'),
			handler: this.showFilesUploadAttachmentDialog,
			scope  : btn,
			iconCls: 'icon_files_category',
			beforeShow : this.onAttachmentUploadBeforeShow.createDelegate(this)
		};
	},

	/**
	 * Function will be called before {@link Grommunio.common.attachment.ui.AttachmentContextMenu AttachmentContextMenu} is shown
	 * so we can decide which item should be disabled.
	 * @param {Grommunio.core.ui.menu.ConditionalItem} item context menu item
	 * @param {Grommunio.core.data.IPMAttachmentRecord} record attachment record on which context menu is shown
	 */
	onAttachmentUploadBeforeShow : function(item, record) {
		// embedded messages can not be downloaded to files
		item.setDisabled(record.isEmbeddedMessage());
		// unsaved attachments can not be added to files without depending on Webapp internals (AttachmentState)
		item.setDisabled(record.isTmpFile());
		// If accounts not configured then disable it.
		item.setDisabled(!this.isAccountsConfigured());
	},

	/**
	 * This method will open the {@link Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel folder chooser panel}.
	 */
	showFilesUploadAttachmentDialog: function(button)
	{
		// TODO: Move this function to action.js
		var attachmentRecord = this.records;
		var attachmentStore = attachmentRecord.store;

		var store = attachmentStore.getParentRecord().get('store_entryid');
		var entryid = attachmentStore.getAttachmentParentRecordEntryId();
		var attachNum = [];
		if (attachmentRecord.isUploaded()) {
			attachNum[0] = attachmentRecord.get('attach_num');
		} else {
			attachNum[0] = attachmentRecord.get('tmpname');
		}
		var dialog_attachments = attachmentStore.getId();
		var filename = attachmentRecord.get('name');

		var jsonRecords = [{
			entryid           : entryid,
			store             : store,
			attachNum         : attachNum,
			dialog_attachments: dialog_attachments,
			filename          : filename
		}];

		var configRecord = {
			items: jsonRecords,
			type : "attachment",
			count: jsonRecords.length
		};

		var model = this.activeItem.plugin.getModel();
		Grommunio.plugins.files.data.Actions.openSaveToFilesDialog(model, {response : configRecord});
	},

	/**
	 * This method hooks to the email context menu and allows users to store emails from
	 * to the  Files plugin.
	 *
	 * @param include
	 * @param btn
	 * @returns {Object}
	 */
	createEmailUploadInsertionPoint: function (include, btn)
	{
		return {
			text : _('Add to Files'),
			handler: this.showFilesUploadEmailDialog,
			scope : btn,
			iconCls: 'icon_files_category',
			disabled: !this.isAccountsConfigured()
		};
	},

	/**
	 * This method will open the {@link Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel folder chooser panel}.
	 */
	showFilesUploadEmailDialog: function ()
	{
		// TODO: Move this function to action.js
		var records = this.records;
		if (!Array.isArray(records)) {
			records = [records];
		}

		var jsonRecords = [];
		for (var i = 0, len = records.length; i < len; i++) {
			var fileName = Ext.isEmpty(records[i].get('subject')) ? _('Untitled') : records[i].get('subject');
			jsonRecords[i] = {
				store   : records[i].get('store_entryid'),
				entryid : records[i].get('entryid'),
				filename: fileName + ".eml"
			};
		}

		var configRecord = {
			items: jsonRecords,
			type : "mail",
			count: jsonRecords.length
		};

		var model = this.activeItem.plugin.getModel();
		Grommunio.plugins.files.data.Actions.openSaveToFilesDialog(model, {response : configRecord});
	},

	/**
	 * Create the files {@link Grommunio.settings.SettingsMainCategory Settings Category}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.plugins.files.settings.SettingsFilesCategory Files Plugin}.
	 * @return {Object} configuration object for the categories to register
	 */
	createSettingCategories: function () {
		return {
			xtype: 'filesplugin.settingsmaincategory',
			model : this.getModel(),
			store : this.getAccountsStore()
		}
	},

	/**
	 * This method returns the context model for the files context.
	 * If the model was not yet initialized, it will create a new model.
	 *
	 * @return {Grommunio.plugins.files.FilesContextModel} The files context model.
	 */
	getModel: function ()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Grommunio.plugins.files.FilesContextModel({
				accountStore : this.getAccountsStore()
			});
		}
		return this.model;
	},

	/**
	 * Function will create an object of {@link Grommunio.plugins.files.data.AccountStore AccountStore} if
	 * it is not created yet.
	 * @return {Grommunio.plugins.files.data.AccountStore} return {@link Grommunio.plugins.files.data.AccountStore AccountStore}
	 * object.
	 */
	getAccountsStore : function ()
	{
		if(!Ext.isDefined(this.accountsStore)) {
			this.accountsStore = new Grommunio.plugins.files.data.AccountStore();
		}
		return this.accountsStore;
	},

	/**
	 * Bid for the given {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}
	 * This will bid on any folder of container class 'IPF.Files'.
	 *
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder The folder for which the context is bidding.
	 * @return {Number} 1 when the contexts supports the folder, -1 otherwise.
	 */
	bid: function (folder) {

		if (folder instanceof Grommunio.plugins.files.data.FilesFolderRecord) {
			return 1;
		}

		return -1;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 *
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;

		if (Ext.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.attachdialog']:
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.fileinfopanel']:
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.sharedialog']:
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.uploadstatusdialog']:
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.treecontextmenu']:
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.createfolderdialog']:
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.createfiledialog']:
			case Grommunio.core.data.SharedComponentType['common.dialog.attachments.savetofiles']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['common.create']:
			case Grommunio.core.data.SharedComponentType['common.view']:
			case Grommunio.core.data.SharedComponentType['common.preview']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass('IPM.Files', true)) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.attachments.files']:
				if (record instanceof Grommunio.core.data.IPMRecord) {
					if (record.supportsAttachments()) {
						bid = 1;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass('IPM.Files', true)) {
					bid = 1;
				}
				break;
			default :
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 *
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function (type, record) {
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.fileinfopanel']:
				component = Grommunio.plugins.files.ui.dialogs.FilesRecordContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.create']:
				component = Grommunio.plugins.files.ui.dialogs.FilesUploadContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.createfiledialog']:
				component = Grommunio.plugins.files.ui.dialogs.CreateFileContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.createfolderdialog']:
				component = Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.sharedialog']:
				component = Grommunio.plugins.files.ui.dialogs.ShareContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.uploadstatusdialog']:
				component = Grommunio.plugins.files.ui.dialogs.UploadStatusContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.view']:
			case Grommunio.core.data.SharedComponentType['common.preview']:
				component = Grommunio.plugins.files.ui.FilesRecordViewPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				component = Grommunio.plugins.files.ui.FilesMainContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['grommunio.plugins.files.treecontextmenu']:
				component = Grommunio.plugins.files.ui.FilesTreeContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.attachments.files']:
				component = Grommunio.plugins.files.ui.dialogs.AttachFromFilesContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.attachments.savetofiles']:
				component = Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel;
				break;
			default:
				break;
		}
		return component;
	},

	/**
	 * Creates the files tree that is shown when the user selects the files context from the
	 * button panel. It shows a tree of available files folders
	 * @private
	 */
	createFilesNavigationPanel : function()
	{
		return {
			xtype : 'grommunio.contextnavigation',
			context : this,
			store : this.getAccountsStore(),
			restrictToShowAllFolderList : true,
			items : [{
				xtype : 'panel',
				id: 'grommunio-navigationpanel-file-navigation',
				cls: 'grommunio-context-navigation-block',
				ref: 'filesnavigation',
				layout: 'fit',
				items : [{
					xtype : 'filesplugin.navigatortreepanel',
					id: 'grommunio-navigationpanel-files-navigation-tree',
					model: this.getModel(),
					FilesFilter: Grommunio.plugins.files.data.FileTypes.FOLDER,
					hideDeletedFolders : false,
					enableDD : true,
					enableItemDrop : true,
					deferredLoading : true
				}]
			}]
		};
	},

	/**
	 * This method creates the {@link Grommunio.plugins.files.ui.FilesMainPanel main content panel}
	 * which will contain the file browser.
	 *
	 * @returns {Object}
	 */
	createContentPanel: function () {
		return {
			xtype  : 'filesplugin.filesmainpanel',
			title : this.getDisplayName(),
			context: this
		};
	},

	/**
	 * Create "New File" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Grommunio.core.ui.MainToolbar toolbar}.
	 * This button should be shown in all {@link Grommunio.core.Context contexts} and
	 * is used to upload a new file.
	 *
	 * @returns {Object}
	 */
	createNewFilesButton: function () {
		return {
			xtype       : 'menuitem',
			text        : _('Upload file'),
			plugins     : 'grommunio.menuitemtooltipplugin',
			iconCls     : 'files_icon_action_upload',
			newMenuIndex: 6,
			context     : this.getName(),
			handler     : function () {
				Grommunio.plugins.files.data.Actions.openCreateFilesContent(this.getModel());
			},
			scope       : this
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.files insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Array} An array of components.
	 */
	getMainToolbarViewButtons: function () {
		var items = container.populateInsertionPoint('main.maintoolbar.view.files', this) || [];

		var defaultItems = [{
			overflowText : _('No preview'),
			iconCls      : 'icon_previewpanel_off',
			text         : _('No preview'),
			valueViewMode: Grommunio.plugins.files.data.ViewModes.NO_PREVIEW,
			valueDataMode: Grommunio.plugins.files.data.DataModes.ALL,
			handler      : this.onContextSelectView,
			scope        : this
		}, {
			overflowText : _('Right preview'),
			iconCls      : 'icon_previewpanel_right',
			text         : _('Right preview'),
			valueViewMode: Grommunio.plugins.files.data.ViewModes.RIGHT_PREVIEW,
			valueDataMode: Grommunio.plugins.files.data.DataModes.ALL,
			handler      : this.onContextSelectView,
			scope        : this
		}, {
			overflowText : _('Bottom preview'),
			iconCls      : 'icon_previewpanel_bottom',
			text         : _('Bottom preview'),
			valueViewMode: Grommunio.plugins.files.data.ViewModes.BOTTOM_PREVIEW,
			valueDataMode: Grommunio.plugins.files.data.DataModes.ALL,
			handler      : this.onContextSelectView,
			scope        : this
		}];

		defaultItems.push();

		return defaultItems.concat(items);
	},

	/**
	 * Adds buttons to the main toolbar like the view switcher button.
	 *
	 * @return {Array}
	 */
	createMainToolbarButtons: function () {
		return [{
			xtype    : 'splitbutton',
			ref      : '../../../filesSwitchViewButton',
			tooltip  : _('Switch view'),
			scale    : 'large',
			iconCls  : 'icon_viewswitch',
			handler  : function () {
				this.showMenu();
			},
			menu : {
				xtype : 'menu',
				items: [{
					text        : _('List'),
					overflowText: _('List'),
					iconCls     : 'icon_contact_list',
					valueView   : Grommunio.plugins.files.data.Views.LIST,
					handler     : this.onSwitchView,
					scope       : this
				}, {
					text        : _('Icons'),
					overflowText: _('Icons'),
					iconCls     : 'icon_note_icon_view',
					valueView   : Grommunio.plugins.files.data.Views.ICON,
					handler     : this.onSwitchView,
					scope       : this
				}]
			},
			listeners: {
				afterrender: this.onAfterRenderMainToolbarButtons,
				menuhide : function(splitBtn, viewMenu){
					viewMenu.find().forEach(function(item){
						var hasClass = item.getEl().hasClass('x-menu-item-selected');
						if(hasClass) {
							item.getEl().removeClass('x-menu-item-selected');
						}
					}, this);
				},
				menushow : function (splitBtn, viewMenu) {
					var menuItem = viewMenu.find('valueView', this.getCurrentView())[0];
					if (Ext.isDefined(menuItem)) {
						menuItem.addClass('x-menu-item-selected');
					}
				},
				scope : this
			}
		}]
	},

	/**
	 * Registers to the {@link Grommunio.core.Container#contextswitch contextswitch} event on the
	 * {@link Grommunio.core.Container container} so the visibility of the button can be toggled
	 * whenever the context is switched. We do this after the button is rendered.
	 *
	 * @param {Ext.Button} btn The button
	 */
	onAfterRenderMainToolbarButtons: function (btn) {
		btn.mon(container, 'contextswitch', function (parameters, oldContext, newContext) {
			this.setVisiblityMainToolbarButton(btn, newContext);
		}, this);

		btn.mon(this, 'viewchange', function (context, newView, oldView) {
			this.setVisiblityMainToolbarButton(btn, context);
		}, this);

		this.setVisiblityMainToolbarButton(btn);
	},

	/**
	 * Determines whether the passed button has to be shown or not based on what
	 * {@link Grommunio.core.Context Context} is active. If no Context is supplied as an argument it
	 * will get that from the {@link Grommunio.core.Container container}.
	 *
	 * @param {Ext.Button} btn The button.
	 * @param {Grommunio.core.Context} activeContext (Optional) The active Context.
	 */
	setVisiblityMainToolbarButton: function (btn, activeContext) {
		activeContext = activeContext || container.getCurrentContext();
		if (activeContext === this) {
			btn.show();
			var accountStore = this.getAccountsStore();
			btn.setDisabled(Ext.isEmpty(accountStore.getRange()));
		} else {
			btn.hide();
		}
	},

	/**
	 * Event handler which is fired when one of the view buttons has been pressed.
	 *
	 * @param {Ext.Button} button The button which was pressed
	 */
	onSwitchView: function (button) {
		var viewMode = this.getCurrentViewMode();
		this.switchView(button.valueView, viewMode);
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link #setView setView}
	 * to update the view.
	 *
	 * @param {Ext.Button} button The button which was pressed
	 */
	onContextSelectView: function (button) {
		this.getModel().setDataMode(button.valueDataMode);

		var view = button.valueView;
		var viewMode = button.valueViewMode;

		if (!Ext.isDefined(button.valueView)) {
			view = this.getCurrentView();
		}
		if (!Ext.isDefined(button.valueViewMode)) {
			viewMode = this.getCurrentViewMode();
		}

		this.switchView(view, viewMode);

		this.getModel().setPreviewRecord(undefined, true);
	}
});

/**
 * This code gets executed after grommunio Web has loaded.
 * It hooks the context to grommunio Web.
 */
Grommunio.onReady(function () {
	if (container.getSettingsModel().get('grommunio/v1/plugins/files/enable') === true) {
		container.registerContext(new Grommunio.core.ContextMetaData({
			name             : 'filescontext',
			displayName      : _('Files'),
			allowUserVisible : false,
			pluginConstructor: Grommunio.plugins.files.FilesContext
		}));
	}
});
