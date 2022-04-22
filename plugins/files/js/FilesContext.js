Ext.namespace('Zarafa.plugins.files');

/**
 * @class Zarafa.plugins.files.FilesContext
 * @extends Zarafa.core.Context
 *
 * This class will add a new context to the webapp. The new context
 * offers a filebrowser for the Files backend.
 */
Zarafa.plugins.files.FilesContext = Ext.extend(Zarafa.core.Context, {

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started}.
	 *
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView: undefined,

	/**
	 * When searching, this property marks the {@link Zarafa.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started}.
	 *
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode: undefined,

	/**
	 * accountsStore which contains all configured
	 * {@link Zarafa.plugins.files.data.AccountRecord accounts}.
	 *
	 * @property
	 * @type Zarafa.plugins.files.data.AccountStore
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
			current_view     : Zarafa.plugins.files.data.Views.LIST,
			current_view_mode: Zarafa.plugins.files.data.ViewModes.RIGHT_PREVIEW
		});

		this.registerInsertionPoint('context.settings.categories', this.createSettingCategories, this);
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewFilesButton, this);
		this.registerInsertionPoint('main.toolbar.actions.last', this.createMainToolbarButtons, this);
		this.registerInsertionPoint('navigation.center', this.createFilesNavigationPanel, this);

		this.registerInsertionPoint('main.attachment.method', this.createAttachmentDownloadInsertionPoint, this);
		this.registerInsertionPoint('common.contextmenu.attachment.actions', this.createAttachmentUploadInsertionPoint, this);
		this.registerInsertionPoint('context.mail.contextmenu.actions', this.createEmailUploadInsertionPoint, this);

		Zarafa.plugins.files.FilesContext.superclass.constructor.call(this, config);

		var notificationResolver = container.getNotificationResolver();
		if (Ext.isFunction(notificationResolver.addIPFNotificationModule)) {
			notificationResolver.addIPFNotificationModule("fileshierarchynotifier");
		}

		Zarafa.core.data.SharedComponentType.addProperty('zarafa.plugins.files.attachdialog');
		Zarafa.core.data.SharedComponentType.addProperty('zarafa.plugins.files.createfolderdialog');
		Zarafa.core.data.SharedComponentType.addProperty('zarafa.plugins.files.fileinfopanel');
		Zarafa.core.data.SharedComponentType.addProperty('zarafa.plugins.files.sharedialog');
		Zarafa.core.data.SharedComponentType.addProperty('zarafa.plugins.files.uploadstatusdialog');
		Zarafa.core.data.SharedComponentType.addProperty('zarafa.plugins.files.treecontextmenu');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.attachments.files');
	},

	/**
	 * Adds a new tab item to the top tab bar of the WebApp.
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
	 * This method will open the {@link Zarafa.plugins.files.ui.dialogs.AttachFromFilesContentPanel file chooser panel}.
	 *
	 * @param btn
	 */
	showFilesDownloadAttachmentDialog: function (btn)
	{
		// TODO: Move this function to action.js

		var activeMenuItem = this.menu.activeItem;
		var component = Zarafa.core.data.SharedComponentType['common.dialog.attachments.files'];
		Zarafa.core.data.UIFactory.openLayerComponent(component, this.record, {
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
			if (item.get("status") === Zarafa.plugins.files.data.AccountRecordStatus.OK) {
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
	 * Function will be called before {@link Zarafa.common.attachment.ui.AttachmentContextMenu AttachmentContextMenu} is shown
	 * so we can decide which item should be disabled.
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item context menu item
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record attachment record on which context menu is shown
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
	 * This method will open the {@link Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel folder chooser panel}.
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
		Zarafa.plugins.files.data.Actions.openSaveToFilesDialog(model, {response : configRecord});
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
	 * This method will open the {@link Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel folder chooser panel}.
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
		Zarafa.plugins.files.data.Actions.openSaveToFilesDialog(model, {response : configRecord});
	},

	/**
	 * Create the files {@link Zarafa.settings.SettingsMainCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.plugins.files.settings.SettingsFilesCategory Files Plugin}.
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
	 * @return {Zarafa.plugins.files.FilesContextModel} The files context model.
	 */
	getModel: function ()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.plugins.files.FilesContextModel({
				accountStore : this.getAccountsStore()
			});
		}
		return this.model;
	},

	/**
	 * Function will create an object of {@link Zarafa.plugins.files.data.AccountStore AccountStore} if
	 * it is not created yet.
	 * @return {Zarafa.plugins.files.data.AccountStore} return {@link Zarafa.plugins.files.data.AccountStore AccountStore}
	 * object.
	 */
	getAccountsStore : function ()
	{
		if(!Ext.isDefined(this.accountsStore)) {
			this.accountsStore = new Zarafa.plugins.files.data.AccountStore();
		}
		return this.accountsStore;
	},

	/**
	 * Bid for the given {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * This will bid on any folder of container class 'IPF.Files'.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the context is bidding.
	 * @return {Number} 1 when the contexts supports the folder, -1 otherwise.
	 */
	bid: function (folder) {

		if (folder instanceof Zarafa.plugins.files.data.FilesFolderRecord) {
			return 1;
		}

		return -1;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 *
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;

		if (Ext.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.attachdialog']:
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.fileinfopanel']:
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.sharedialog']:
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.uploadstatusdialog']:
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.treecontextmenu']:
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.createfolderdialog']:
			case Zarafa.core.data.SharedComponentType['common.dialog.attachments.savetofiles']:
				bid = 1;
				break;
			case Zarafa.core.data.SharedComponentType['common.create']:
			case Zarafa.core.data.SharedComponentType['common.view']:
			case Zarafa.core.data.SharedComponentType['common.preview']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.isMessageClass('IPM.Files', true)) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.attachments.files']:
				if (record instanceof Zarafa.core.data.IPMRecord) {
					if (record.supportsAttachments()) {
						bid = 1;
					}
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.core.data.IPMRecord && record.isMessageClass('IPM.Files', true)) {
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
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function (type, record) {
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.fileinfopanel']:
				component = Zarafa.plugins.files.ui.dialogs.FilesRecordContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.create']:
				component = Zarafa.plugins.files.ui.dialogs.FilesUploadContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.createfolderdialog']:
				component = Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.sharedialog']:
				component = Zarafa.plugins.files.ui.dialogs.ShareContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.uploadstatusdialog']:
				component = Zarafa.plugins.files.ui.dialogs.UploadStatusContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.view']:
			case Zarafa.core.data.SharedComponentType['common.preview']:
				component = Zarafa.plugins.files.ui.FilesRecordViewPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				component = Zarafa.plugins.files.ui.FilesMainContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['zarafa.plugins.files.treecontextmenu']:
				component = Zarafa.plugins.files.ui.FilesTreeContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.attachments.files']:
				component = Zarafa.plugins.files.ui.dialogs.AttachFromFilesContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.attachments.savetofiles']:
				component = Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel;
				break;
			default :
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
			xtype : 'zarafa.contextnavigation',
			context : this,
			store : this.getAccountsStore(),
			restrictToShowAllFolderList : true,
			items : [{
				xtype : 'panel',
				id: 'zarafa-navigationpanel-file-navigation',
				cls: 'zarafa-context-navigation-block',
				ref: 'filesnavigation',
				layout: 'fit',
				items : [{
					xtype : 'filesplugin.navigatortreepanel',
					id: 'zarafa-navigationpanel-files-navigation-tree',
					model: this.getModel(),
					FilesFilter: Zarafa.plugins.files.data.FileTypes.FOLDER,
					hideDeletedFolders : false,
					enableDD : true,
					enableItemDrop : true,
					deferredLoading : true
				}]
			}]
		};
	},

	/**
	 * This method creates the {@link Zarafa.plugins.files.ui.FilesMainPanel main content panel}
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
	 * {@link Ext.menu.Menu menu} in the {@link Zarafa.core.ui.MainToolbar toolbar}.
	 * This button should be shown in all {@link Zarafa.core.Context contexts} and
	 * is used to upload a new file.
	 *
	 * @returns {Object}
	 */
	createNewFilesButton: function () {
		return {
			xtype       : 'menuitem',
			text        : _('Upload file'),
			plugins     : 'zarafa.menuitemtooltipplugin',
			iconCls     : 'icon_files_category',
			newMenuIndex: 6,
			context     : this.getName(),
			handler     : function () {
				Zarafa.plugins.files.data.Actions.openCreateFilesContent(this.getModel());
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
			valueViewMode: Zarafa.plugins.files.data.ViewModes.NO_PREVIEW,
			valueDataMode: Zarafa.plugins.files.data.DataModes.ALL,
			handler      : this.onContextSelectView,
			scope        : this
		}, {
			overflowText : _('Right preview'),
			iconCls      : 'icon_previewpanel_right',
			text         : _('Right preview'),
			valueViewMode: Zarafa.plugins.files.data.ViewModes.RIGHT_PREVIEW,
			valueDataMode: Zarafa.plugins.files.data.DataModes.ALL,
			handler      : this.onContextSelectView,
			scope        : this
		}, {
			overflowText : _('Bottom preview'),
			iconCls      : 'icon_previewpanel_bottom',
			text         : _('Bottom preview'),
			valueViewMode: Zarafa.plugins.files.data.ViewModes.BOTTOM_PREVIEW,
			valueDataMode: Zarafa.plugins.files.data.DataModes.ALL,
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
					valueView   : Zarafa.plugins.files.data.Views.LIST,
					handler     : this.onSwitchView,
					scope       : this
				}, {
					text        : _('Icons'),
					overflowText: _('Icons'),
					iconCls     : 'icon_note_icon_view',
					valueView   : Zarafa.plugins.files.data.Views.ICON,
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
	 * Registers to the {@link Zarafa.core.Container#contextswitch contextswitch} event on the
	 * {@link Zarafa.core.Container container} so the visiblity of the button can be toggled
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
	 * {@link Zarafa.core.Context Context} is active. If no Context is supplied as an argument it
	 * will get that from the {@link Zarafa.core.Container container}.
	 *
	 * @param {Ext.Button} btn The button.
	 * @param {Zarafa.core.Context} activeContext (Optionial} The active Context.
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
 * This code gets executed after the WebApp has loaded.
 * It hooks the context to the WebApp.
 */
Zarafa.onReady(function () {
	if (container.getSettingsModel().get('zarafa/v1/plugins/files/enable') === true) {
		container.registerContext(new Zarafa.core.ContextMetaData({
			name             : 'filescontext',
			displayName      : _('Files'),
			allowUserVisible : false,
			pluginConstructor: Zarafa.plugins.files.FilesContext
		}));
	}
});
