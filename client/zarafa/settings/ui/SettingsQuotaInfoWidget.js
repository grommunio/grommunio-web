Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsQuotaInfoWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsquotainfowidget
 *
 * The Quota Info widget which shows usage of mailbox and quota bar.
 */
Zarafa.settings.ui.SettingsQuotaInfoWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.settingswidget',
			title : _('Mailbox Usage'),
			layout : 'form',
			items : [{
						xtype : 'zarafa.quotabar',
						width : 400,
						hidden: true,
						ref : 'quotaBar',
						userStore : container.getHierarchyStore().getDefaultStore()
					},{
						xtype : 'displayfield',
						width : 400,
						hideLabel : true,
						ref : 'unavailableQuotaInfo',
						hidden: true,
						value : _("Quota information is not set on the user's store.")
					},{
						xtype : 'displayfield',
						hideLabel : true,
						width : 400,
						ref : 'quotaInfo'
					}]
		});

		Zarafa.settings.ui.SettingsQuotaInfoWidget.superclass.constructor.call(this, config);

		this.on('afterrender', this.updateQuotaInfo, this);
		this.mon(container.getHierarchyStore(), 'update', this.onUpdateHierarchyStore, this);
	},

	/**
	 * Function sets information in quota bar widget,
	 * it updates quota bar and information string aswell.
	 * @private
	 */
	updateQuotaInfo : function()
	{
		var defaultMesageStore = container.getHierarchyStore().getDefaultStore();
		var storeSize = defaultMesageStore.get('store_size');
		var softQuota = defaultMesageStore.get('quota_soft');
		var hardQuota = defaultMesageStore.get('quota_hard');
		var warnQuota = defaultMesageStore.get('quota_warning');

		// Create quota-info string to display in displayfield.
		var quotaInfo = String.format(_('{0} of mailbox space is used.'), Ext.util.Format.fileSize(storeSize * 1024));
		var quotaInfoHTML = '<span class="zarafa-quota-string">' + quotaInfo + '</span>';

		if(softQuota || hardQuota || warnQuota) {
			// If soft or hard quota is set then show quotabar.
			this.quotaBar.setVisible(true);
			this.unavailableQuotaInfo.setVisible(false);

			// Add soft or hard quota info in quota-info string.
			quotaInfo = this.getQuotaSuggestionString(softQuota, hardQuota, storeSize);
			if(!Ext.isEmpty(quotaInfo)) {
				quotaInfoHTML += ' ' + quotaInfo;
			}
		} else {
			// If any of the soft or hard quota is not set then show message.
			this.quotaBar.setVisible(false);
			this.unavailableQuotaInfo.setVisible(true);
		}

		this.quotaInfo.setValue(quotaInfoHTML);
	},

	/**
	 * Function returns info/warning message according to
	 * store's usage and quota information.
	 * @param {Int} softQuota soft quota limit for user
	 * @param {Int} hardQuota hard quota limit for user
	 * @param {Int} storeSize size of user's store
	 * @return {String} info/warning message.
	 * @private
	 */
	getQuotaSuggestionString : function(softQuota, hardQuota, storeSize)
	{
		if(!Ext.isDefined(storeSize)) {
			return;
		}

		// If softQuota is greater then hardQuota then ignore softQuota
		if (hardQuota && softQuota >= hardQuota) {
			softQuota = null;
		}

		/*
		 * There are seven cases for displaying messages.
		 * 1) store-size < soft-quota < hard-quota
		 * 2) soft-quota < store-size < hard-quota
		 * 3) soft-quota < hard-quota < store-size
		 * 4) soft-quota is not set and store-size < hard-quota
		 * 5) soft-quota is not set and hard-quota < store-size
		 * 6) hard-quota is not set and store-size < soft-quota
		 * 7) hard-quota is not set and soft-quota < store-size
		 */
		if (hardQuota && storeSize > hardQuota) {
			// Case 3,5
			return _('You have exceeded hard quota, you can not send or recieve mails.');
		} else if (softQuota && storeSize < softQuota) {
			// Case 1,6
			return String.format(_("At {0} you won't be able to send mails."), Ext.util.Format.fileSize(softQuota * 1024));
		} else if (softQuota && hardQuota && softQuota < storeSize && storeSize < hardQuota) {
			// Case 2
			return String.format(_("You can not send mails as you have exceeded soft quota, at {0} you won't be able to recieve mails."), Ext.util.Format.fileSize(hardQuota * 1024));
		} else if (!softQuota && hardQuota && storeSize < hardQuota) {
			// Case 4
			return String.format(_("At {0} you won't be able to send or recieve mails."), Ext.util.Format.fileSize(hardQuota * 1024));
		} else if (softQuota && !hardQuota && softQuota < storeSize) {
			// Case 7
			return _('You can not send mails as you have exceeded soft quota.');
		}
	},

	/**
	 * Function is called when data is update in {@link Zarafa.hierarchy.data.HierarchyStore}.
	 * If user's default store is changed then it will update quotabar ui.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store, the hierarchy store
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord, record of the hierarchy store
	 * @param {String} op, operation string
	 * @private
	 */
	onUpdateHierarchyStore : function(store, storeRecord, op) {
		// Check whether default store is changed or not.
		if(storeRecord.isDefaultStore()){
			this.updateQuotaInfo();
		}
	}
});

Ext.reg('zarafa.settingsquotainfowidget', Zarafa.settings.ui.SettingsQuotaInfoWidget);
