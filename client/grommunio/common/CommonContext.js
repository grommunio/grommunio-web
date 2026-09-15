Ext.namespace('Grommunio.common');

/**
 * @class Grommunio.common.CommonContext
 * @extends Grommunio.core.Context
 */
Grommunio.common.CommonContext = Ext.extend(Grommunio.core.Context, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar: false,
			hasContentPanel: false
		});

		Grommunio.common.CommonContext.superclass.constructor.call(this, config);

		// Register categories for the settings
		this.registerInsertionPoint('context.settings.categories', this.createDelegateSettingsCategory, this);
		this.registerInsertionPoint('context.settings.categories', this.createSendAsSettingsCategory, this);
		this.registerInsertionPoint('context.settings.categories', this.createRuleSettingsCategory, this);
		//this.registerInsertionPoint('context.settings.categories', this.createNotificationSettingsCategory, this);

		// Register common specific dialog types
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.copymoverecords');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.recurrence');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.categories');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.widgets');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.checknames');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.restoreitems');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.reminder');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.previewpanel.extrainfo');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.importance');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.category');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.categories');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.freebusy');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.freebusy.timelinebody');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.freebusy.timelineheader');
		Grommunio.core.data.SharedComponentType.addProperty('common.contextmenu.flags');
		Grommunio.core.data.SharedComponentType.addProperty('common.printer.renderer');
		Grommunio.core.data.SharedComponentType.addProperty('common.rules.dialog.ruleswordsedit');
		Grommunio.core.data.SharedComponentType.addProperty('common.attachment.dialog.attachitem');
		Grommunio.core.data.SharedComponentType.addProperty('common.attachment.dialog.mixattachitem');
		Grommunio.core.data.SharedComponentType.addProperty('common.attachment.dialog.attachitem.columnmodel');
		Grommunio.core.data.SharedComponentType.addProperty('common.attachment.dialog.attachitem.textrenderer');
		Grommunio.core.data.SharedComponentType.addProperty('common.attachment.dialog.importtofolder');
		Grommunio.core.data.SharedComponentType.addProperty('common.sendas.dialog.sendaseditcontentpanel');
		Grommunio.core.data.SharedComponentType.addProperty('common.managecc.dialog.managecceditcontentpanel');
		Grommunio.core.data.SharedComponentType.addProperty('common.categories.dialogs.newcategory');
		Grommunio.core.data.SharedComponentType.addProperty('common.categories.dialogs.renamecategory');
		Grommunio.core.data.SharedComponentType.addProperty('common.flags.dialogs.customflag');
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Array.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			// Bid for common dialogs
			case Grommunio.core.data.SharedComponentType['common.dialog.copymoverecords']:
			case Grommunio.core.data.SharedComponentType['common.dialog.recurrence']:
			case Grommunio.core.data.SharedComponentType['common.dialog.categories']:
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem']:
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.mixattachitem']:
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.importtofolder']:
			case Grommunio.core.data.SharedComponentType['common.dialog.widgets']:
			case Grommunio.core.data.SharedComponentType['common.dialog.checknames']:
			case Grommunio.core.data.SharedComponentType['common.dialog.restoreitems']:
			case Grommunio.core.data.SharedComponentType['common.dialog.reminder']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.previewpanel.extrainfo']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy.timelinebody']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy.timelineheader']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.importance']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.category']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.flags']:
			case Grommunio.core.data.SharedComponentType['common.contextmenu.categories']:
			case Grommunio.core.data.SharedComponentType['common.rules.dialog.ruleswordsedit']:
			case Grommunio.core.data.SharedComponentType['common.sendas.dialog.sendaseditcontentpanel']:
			case Grommunio.core.data.SharedComponentType['common.managecc.dialog.managecceditcontentpanel']:
			case Grommunio.core.data.SharedComponentType['common.categories.dialogs.newcategory']:
			case Grommunio.core.data.SharedComponentType['common.categories.dialogs.renamecategory']:
			case Grommunio.core.data.SharedComponentType['common.flags.dialogs.customflag']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord ||
					record instanceof Grommunio.core.data.IPMAttachmentRecord ||
					record instanceof Grommunio.common.manageCc.data.IPMCcRecipientRecord) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.create']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					bid = 1;
				} else if(record instanceof Grommunio.common.delegates.data.DelegateRecord) {
					bid = 1;
				} else if(record instanceof Grommunio.common.rules.data.RulesRecord) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.view']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					bid = 1;
				} else if(record instanceof Grommunio.core.data.IPMAttachmentRecord) {
					bid = 0;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.hovercard']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					bid = 1;
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.dialog.copymoverecords']:
				component = Grommunio.common.dialogs.CopyMoveContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.recurrence']:
				component = Grommunio.common.recurrence.dialogs.RecurrenceContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.categories']:
				component = Grommunio.common.categories.dialogs.CategoriesContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem']:
				component = Grommunio.common.attachment.dialogs.AttachItemContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.mixattachitem']:
				component = Grommunio.common.attachment.dialogs.MixAttachItemContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.importtofolder']:
				component = Grommunio.common.attachment.dialogs.ImportToFolderContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.widgets']:
				component = Grommunio.core.ui.widget.WidgetContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.checknames']:
				component = Grommunio.common.checknames.dialogs.CheckNamesContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.restoreitems']:
				component = Grommunio.common.restoreitem.dialogs.RestoreItemContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.dialog.reminder']:
				component = Grommunio.common.reminder.dialogs.ReminderContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.rules.dialog.ruleswordsedit']:
				component = Grommunio.common.rules.dialogs.RulesWordsEditContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.managecc.dialog.managecceditcontentpanel']:
				component = Grommunio.common.manageCc.dialogs.ManageCcEditContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.sendas.dialog.sendaseditcontentpanel']:
				component = Grommunio.common.sendas.dialogs.SendAsEditContentPanel;
				break;

			case Grommunio.core.data.SharedComponentType['common.create']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					component = Grommunio.common.recipientfield.ui.EditRecipientContentPanel;
				} else if(record instanceof Grommunio.common.delegates.data.DelegateRecord) {
					component = Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel;
				} else if(record instanceof Grommunio.common.rules.data.RulesRecord) {
					component = Grommunio.common.rules.dialogs.RulesEditContentPanel;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.view']:
				if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					component = Grommunio.common.recipientfield.ui.ViewRecipientContentPanel;
				} else if (record instanceof Grommunio.core.data.IPMAttachmentRecord) {
					if (Grommunio.common.Actions.isSupportedDocument(record.get('name')) && Grommunio.common.Actions.isFilePreviewerEnabled()) {
						component = Grommunio.common.previewer.ui.ViewerContainer;
					} else {
						component = this;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.previewpanel.extrainfo']:
				component = Grommunio.common.ui.messagepanel.ExtraInfoContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy']:
				component = Grommunio.common.freebusy.ui.FreebusyContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy.timelinebody']:
				component = Grommunio.common.freebusy.ui.FreebusyTimelineBodyContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy.timelineheader']:
				component = Grommunio.common.freebusy.ui.FreebusyTimelineHeaderContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if(record instanceof Grommunio.common.manageCc.data.IPMCcRecipientRecord){
					component = Grommunio.common.manageCc.ui.ManageCcGridContextMenu;
				} else if (record instanceof Grommunio.core.data.IPMRecipientRecord) {
					component = Grommunio.common.recipientfield.ui.RecipientContextMenu;
				} else if (record instanceof Grommunio.core.data.IPMAttachmentRecord) {
					component = Grommunio.common.attachment.ui.AttachmentContextMenu;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.importance']:
				component = Grommunio.common.ui.ImportanceMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.category']:
				component = Grommunio.common.categories.ui.CategoryContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.categories']:
				component = Grommunio.common.categories.ui.CategoriesContextMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu.flags']:
				component = Grommunio.common.flags.ui.FlagsMenu;
				break;
			case Grommunio.core.data.SharedComponentType['common.categories.dialogs.newcategory']:
				component = Grommunio.common.categories.dialogs.NewCategoryPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.categories.dialogs.renamecategory']:
				component = Grommunio.common.categories.dialogs.RenameCategoryPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.flags.dialogs.customflag']:
				component = Grommunio.common.flags.dialogs.CustomFlagContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.hovercard']:
				component = Grommunio.common.recipientfield.ui.RecipientHoverCardView;
				break;
		}
		return component;
	},

	/**
	 * Default doOpen that will be called if no other context wins the bid
	 *
	 * @param {Grommunio.core.data.IPMAttachmentRecord} records The record to be opened
	 */
	doOpen: function(record)
	{
		Grommunio.common.Actions.downloadAttachment(record);
	},

	/**
	 * Create the delegate {@link Grommunio.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.calendar.ui.SettingsDelegatesCategory Delegate}
	 * in the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Grommunio.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Grommunio.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createDelegateSettingsCategory: function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype: 'grommunio.settingsdelegatecategory',
			settingsContext: settingsContext
		};
	},

	/**
	 * Create the send as {@link Grommunio.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.calendar.ui.SettingsSendAsCategory SendAs}
	 * in the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Grommunio.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Grommunio.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSendAsSettingsCategory: function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype: 'grommunio.settingssendascategory',
			settingsContext: settingsContext
		};
	},

	/**
	 * Create the Rule {@link Grommunio.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.calendar.ui.SettingsRuleCategory Rules}
	 * in the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Grommunio.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Grommunio.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createRuleSettingsCategory: function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype: 'grommunio.settingsrulecategory',
			settingsContext: settingsContext
		};
	},

	/**
	 * Create the Notification {@link Grommunio.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.common.settings.SettingsNotificationsCategory Notifications}
	 * in the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Grommunio.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Grommunio.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createNotificationSettingsCategory: function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
      xtype: 'grommunio.settingsnotificationscategory',
      settingsContext: settingsContext
    };
	}
});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'default',
		allowUserVisible: false,
		pluginConstructor: Grommunio.common.CommonContext
	}));
});
