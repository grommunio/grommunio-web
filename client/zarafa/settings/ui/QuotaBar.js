Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.QuotaBar
 * @extends Ext.BoxComponent
 * @xtype zarafa.quotabar
 *
 * Quotabar shows information about user's store size,
 * and denotes warning-quota, soft-quota and hard-quota information.
 *
 */
Zarafa.settings.ui.QuotaBar = Ext.extend(Ext.BoxComponent, {
	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIStoreRecord} userStore
	 * User's store on which  quota information is set.
	*/
	userStore : undefined,

	/**
	 * @cfg {String} quotaTemplate
	 * Template for quota bar.
	 */
	quotaTemplate :'<div class="zarafa-quotabar">' +
						'<div class="zarafa-quotabar-normal"></div>' +
						'<div class="zarafa-quotabar-warn"></div>' +
						'<div class="zarafa-quotabar-soft"></div>' +
						'<div class="zarafa-quotabar-hard"></div>' +
					'</div>',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Zarafa.settings.ui.QuotaBar.superclass.constructor.call(this, config);

		this.quotaTemplate = new Ext.XTemplate(this.quotaTemplate, {
			compiled: true
		});

		this.on('afterrender', this.onQuotaBarRender, this);
		if(this.userStore) {
			this.mon(this.userStore.getStore(), 'update', this.onUpdateHierarchyStore, this);
		}
	},

	/**
	 * Function will overwrites the quotaTemplate the content of el with the new node(s).
	 * @private
	 */
	onQuotaBarRender : function() {
		this.quotaTemplate.overwrite(Ext.get(this.el));
		this.updateQuotaBar();
	},

	/**
	 * Function will count the quota size from the user store,
	 * and will update/show the quotabar accordingly.
	 * @private
	 */
	updateQuotaBar : function() {
		if(this.userStore) {
			if(this.el && this.el.child('div.zarafa-quotabar')) {

				// Get quota information
				var storeSize = this.userStore.get('store_size');
				var softQuota = this.userStore.get('quota_soft');
				var hardQuota = this.userStore.get('quota_hard');
				var warnQuota = this.userStore.get('quota_warning');

				// If quota information is not set then return.
				if(!softQuota && !hardQuota && !warnQuota) {
					return;
				}

				/*
				 * Just add necessary quota information in quota variable,
				 * and remove inapropriate info like softQuota > hardQuota.
				 * There might be the case where if hardQuota is not set
				 * then in that case add soft quota to infromation variable.
				 */
				var quota = [];
				if(warnQuota && (!softQuota || warnQuota < softQuota) && (!hardQuota || warnQuota < hardQuota)) {
					quota.push({size : warnQuota, element : 'div.zarafa-quotabar-warn'});
				}

				if(softQuota && (!hardQuota || softQuota < hardQuota)) {
					quota.push({size : softQuota, element : 'div.zarafa-quotabar-soft'});
				}

				if(hardQuota) {
					quota.push({size : hardQuota, element : 'div.zarafa-quotabar-hard'});
				}


				var maxLimit = hardQuota || softQuota || warnQuota;

				if(storeSize > maxLimit) {
					// If store size has exceeded the hard_quota then set it as maxLimit
					maxLimit = storeSize;
					quota.push({size : storeSize});
				}

				// Count the factor by 'total width of qouta bar'/'max qouta limit'
				var maxAvailableWidth = this.el.child('div.zarafa-quotabar').getWidth(true);
				var factor = maxAvailableWidth/maxLimit;

				// Set blockSize
				var blockSize, totalSize = 0;
				var element = 'div.zarafa-quotabar-normal';
				for (var i = 0; i < quota.length ; i++)
				{
					blockSize = quota[i].size;
					if(storeSize <= blockSize) {
						blockSize = storeSize;
						storeSize = 0;
					}

					/*
					 * get absolute difference between qouta levels in blockSize
					 *
					 * |--------|                           first
					 * |-------------------|                second
					 * |------------------------------|     third
					 *
					 * absolute difference
					 * |--------|                           first
					 *          |----------|                second
					 *                     |----------|     third
					 */
					blockSize -= totalSize;
					totalSize += blockSize;

					if(element) {
						// Set width of the current block.
						var elementWidth = Math.round(blockSize*factor);
						elementWidth = Math.max(elementWidth, 0);

						/*
						 * Math.round sometime gives extra 1 pixel while setting width
						 * of the quotabar elements, because of the layouting is spoiled,
						 * so checked whether it doesn't exceed max limit.
						 */
						if(maxAvailableWidth < elementWidth) {
							elementWidth = maxAvailableWidth;
						}

						this.el.child(element).setWidth(elementWidth);
						maxAvailableWidth -= elementWidth;
					}

					/*
					 * Update element according to which quota is started in quotabar.
					 * This variable will maintain that which quota is till now displayed,
					 * e.g. we have set soft quota and hard quota only, then first it will
					 * draw noraml green block till soft-quota limit, then it will get
					 * element of soft quota i.e. orange element, then it will draw ornage
					 * element till hard-quota and now it reached hard quota so it will draw
					 * red element.
					 */
					element = quota[i].element;

					// set default size of every block to zero so that previous block size calculation is cleared.
					if (element) {
						this.el.child(element).setWidth(0);
					}
				}
			}
		}
	},

	/**
	 * Function is called when data is update in {@link Zarafa.hierarchy.data.HierarchyStore}.
	 * If user's default store is changed then it will update ui.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store, the hierarchy store
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord, record of the hierarchy store
	 * @param {String} op, operation string
	 * @private
	 */
	onUpdateHierarchyStore : function(store, storeRecord, op) {
		// Check whether default store is changed or not.
		if(storeRecord.isDefaultStore()){
			this.updateQuotaBar();
		}
	}
});
Ext.reg('zarafa.quotabar', Zarafa.settings.ui.QuotaBar);
