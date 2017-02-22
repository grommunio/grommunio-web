Ext.namespace('Zarafa.common');

/**
 * @class Zarafa.common.CommonContext
 * @extends Zarafa.core.Context
 */
Zarafa.common.CommonContext = Ext.extend(Zarafa.core.Context, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar : false,
			hasContentPanel : false
		});

		Zarafa.common.CommonContext.superclass.constructor.call(this, config);

		// Register categories for the settings
		this.registerInsertionPoint('context.settings.categories', this.createDelegateSettingsCategory, this);
		this.registerInsertionPoint('context.settings.categories', this.createSendAsSettingsCategory, this);
		this.registerInsertionPoint('context.settings.categories', this.createRuleSettingsCategory, this);

		// Register common specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.copymoverecords');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.recurrence');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.categories');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.widgets');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.checknames');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.restoreitems');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.reminder');
		Zarafa.core.data.SharedComponentType.addProperty('common.contextmenu.previewpanel.extrainfo');
		Zarafa.core.data.SharedComponentType.addProperty('common.contextmenu.importance');
		Zarafa.core.data.SharedComponentType.addProperty('common.contextmenu.freebusy');
		Zarafa.core.data.SharedComponentType.addProperty('common.contextmenu.freebusy.timelinebody');
		Zarafa.core.data.SharedComponentType.addProperty('common.contextmenu.freebusy.timelineheader');
		Zarafa.core.data.SharedComponentType.addProperty('common.contextmenu.reminder.remindergrid');
		Zarafa.core.data.SharedComponentType.addProperty('common.printer.renderer');
		Zarafa.core.data.SharedComponentType.addProperty('common.rules.dialog.ruleswordsedit');
		Zarafa.core.data.SharedComponentType.addProperty('common.attachment.dialog.attachitem');
		Zarafa.core.data.SharedComponentType.addProperty('common.attachment.dialog.mixattachitem');
		Zarafa.core.data.SharedComponentType.addProperty('common.attachment.dialog.attachitem.columnmodel');
		Zarafa.core.data.SharedComponentType.addProperty('common.attachment.dialog.attachitem.textrenderer');
		Zarafa.core.data.SharedComponentType.addProperty('common.sendas.dialog.sendaseditcontentpanel');
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
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
			case Zarafa.core.data.SharedComponentType['common.dialog.copymoverecords']:
			case Zarafa.core.data.SharedComponentType['common.dialog.recurrence']:
			case Zarafa.core.data.SharedComponentType['common.dialog.categories']:
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem']:
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.mixattachitem']:
			case Zarafa.core.data.SharedComponentType['common.dialog.widgets']:
			case Zarafa.core.data.SharedComponentType['common.dialog.checknames']:
			case Zarafa.core.data.SharedComponentType['common.dialog.restoreitems']:
			case Zarafa.core.data.SharedComponentType['common.dialog.reminder']:
			case Zarafa.core.data.SharedComponentType['common.contextmenu.previewpanel.extrainfo']:
			case Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy.timelinebody']:
			case Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy.timelineheader']:
			case Zarafa.core.data.SharedComponentType['common.contextmenu.importance']:
			case Zarafa.core.data.SharedComponentType['common.contextmenu.reminder.remindergrid']:
			case Zarafa.core.data.SharedComponentType['common.rules.dialog.ruleswordsedit']:
			case Zarafa.core.data.SharedComponentType['common.sendas.dialog.sendaseditcontentpanel']:
				bid = 1;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord || record instanceof Zarafa.core.data.IPMAttachmentRecord) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.create']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord) {
					bid = 1;
				} else if(record instanceof Zarafa.common.delegates.data.DelegateRecord) {
					bid = 1;
				} else if(record instanceof Zarafa.common.rules.data.RulesRecord) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.view']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord) {
					bid = 1;
				} else if(record instanceof Zarafa.core.data.IPMAttachmentRecord) {
					bid = 0;
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.dialog.copymoverecords']:
				component = Zarafa.common.dialogs.CopyMoveContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.recurrence']:
				component = Zarafa.common.recurrence.dialogs.RecurrenceContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.categories']:
				component = Zarafa.common.categories.dialogs.CategoriesContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem']:
				component = Zarafa.common.attachment.dialogs.AttachItemContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.attachment.dialog.mixattachitem']:
				component = Zarafa.common.attachment.dialogs.MixAttachItemContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.widgets']:
				component = Zarafa.core.ui.widget.WidgetContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.checknames']:
				component = Zarafa.common.checknames.dialogs.CheckNamesContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.restoreitems']:
				component = Zarafa.common.restoreitem.dialogs.RestoreItemContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.dialog.reminder']:
				component = Zarafa.common.reminder.dialogs.ReminderContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.rules.dialog.ruleswordsedit']:
				component = Zarafa.common.rules.dialogs.RulesWordsEditContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.sendas.dialog.sendaseditcontentpanel']:
				component = Zarafa.common.sendas.dialogs.SendAsEditContentPanel;
				break;

			case Zarafa.core.data.SharedComponentType['common.create']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord) {
					component = Zarafa.common.recipientfield.ui.EditRecipientContentPanel;
				} else if(record instanceof Zarafa.common.delegates.data.DelegateRecord) {
					component = Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel;
				} else if(record instanceof Zarafa.common.rules.data.RulesRecord) {
					component = Zarafa.common.rules.dialogs.RulesEditContentPanel;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.view']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord) {
					component = Zarafa.common.recipientfield.ui.ViewRecipientContentPanel;
				} else if (record instanceof Zarafa.core.data.IPMAttachmentRecord){
					component = this;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.previewpanel.extrainfo']:
				component = Zarafa.common.ui.messagepanel.ExtraInfoContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy']:
				component = Zarafa.common.freebusy.ui.FreebusyContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy.timelinebody']:
				component = Zarafa.common.freebusy.ui.FreebusyTimelineBodyContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy.timelineheader']:
				component = Zarafa.common.freebusy.ui.FreebusyTimelineHeaderContextMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.core.data.IPMRecipientRecord) {
					component = Zarafa.common.recipientfield.ui.RecipientContextMenu;
				}
				else if (record instanceof Zarafa.core.data.IPMAttachmentRecord){
					component = Zarafa.common.attachment.ui.AttachmentContextMenu;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.importance']:
				component = Zarafa.common.ui.ImportanceMenu;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu.reminder.remindergrid']:
				component = Zarafa.common.reminder.dialogs.ReminderGridContextMenu;
				break;
		}
		return component;
	},

	/**
	 * Default doOpen that will be called if no other context wins the bid
	 *
	 * @param {Zarafa.core.data.IPMAttachmentRecord} records The record to be opened
	 */
	doOpen: function(record)
	{
		Zarafa.common.Actions.downloadAttachment(record);
	},

	/**
	 * Create the delegate {@link Zarafa.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.calendar.ui.SettingsDelegatesCategory Delegate}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Zarafa.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Zarafa.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createDelegateSettingsCategory : function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype : 'zarafa.settingsdelegatecategory',
			settingsContext : settingsContext
		};
	},
	
	/**
	 * Create the send as {@link Zarafa.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.calendar.ui.SettingsSendAsCategory SendAs}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Zarafa.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Zarafa.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSendAsSettingsCategory : function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype : 'zarafa.settingssendascategory',
			settingsContext : settingsContext
		};
	},

	/**
	 * Create the Rule {@link Zarafa.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.calendar.ui.SettingsRuleCategory Rules}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Zarafa.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Zarafa.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createRuleSettingsCategory : function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype : 'zarafa.settingsrulecategory',
			settingsContext : settingsContext
		};
	}
});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'default',
		allowUserVisible : false,
		pluginConstructor : Zarafa.common.CommonContext
	}));
});
