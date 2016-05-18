/**
 * @class Zarafa.common.ui.LoadMask
 * @extends Ext.LoadMask
 * 
 * This custom loadmask is created to handle search requests. When {@link Zarafa.core.data.MAPIStore MAPIStore}
 * starts search it is started as incremental search so search results are updated periodically.
 * but everytime search results are updated we shouldn't show loadmask, so this custom loadmask handles
 * this situation and doesn't show load mask when load event is fired for updating search results.
 */
Zarafa.common.ui.LoadMask = Ext.extend(Ext.LoadMask, {
	/**
	 * @cfg {String} msg message that will be displayed in {@link Zarafa.common.ui.LoadMask LoadMask}
	 * when the {@link Zarafa.core.data.MAPIStore MAPIStore} is loading data.
	 */
	msg : _('Loading...'),

	/**
	 * @cfg {Boolean} isLoading it was by default false which represent that loading mask 
	 * was not warp on dummy row of grid.
	 */
	isLoading : false,

	/**
	 * @cfg {String} failureMsg message that will be displayed in {@link Zarafa.common.ui.LoadMask LoadMask}
	 * when the {@link Zarafa.core.data.MAPIStore MAPIStore} has fired an exception.
	 */
	failureMsg : _('Failed'),

	/**
	 * @cfg {String} failureMsgCls The CSS class to be applied on the {@link Zarafa.common.ui.LoadMask LoadMask}
	 * when the {@link Zarafa.core.data.MAPIStore MAPIStore} has fired an exception.
	 */
	failureMsgCls : 'x-mask-error',

	/**
	 * Function will be called whenever {@link Zarafa.core.data.MAPIStore MAPIStore}'s
	 * {@link Zarafa.core.data.MAPIStore#load} is fired, and will hide the loadmask.
	 * 
	 * @param {Zarafa.core.data.IPMStore} store The store which has loaded
	 * @param {Zarafa.core.data.IPMRecord/Array} records The records which have loaded
	 * @param {Object} options The options object used for loading the store.
	 * @private
	 */
	onLoad : function(store, records, options)
	{
		if(options && (options.actionType === Zarafa.core.Actions['updatesearch'] || options.actionType === Zarafa.core.Actions['updatelist'])) {
			// don't do anything here, as we are just updating the search or live scroll results
			// so loadmask shoudn't be removed
			return;
		}

		Zarafa.common.ui.LoadMask.superclass.onLoad.apply(this, arguments);
	},

	/**
	 * Function will be called whenever {@link Zarafa.core.data.MAPIStore MAPIStore}'s
	 * {@link Zarafa.core.data.MAPIStore#beforeload} is fired, and will show the loadmask.
	 *
	 * @param {Zarafa.core.data.IPMStore} store the Store which is going to be loaded
	 * @param {Object} options The options object which is used for loading the store
	 * @private
	 */
	onBeforeLoad : function(store, options)
	{
		if(options && (options.actionType === Zarafa.core.Actions['updatesearch'] || options.actionType === Zarafa.core.Actions['updatelist'])){
			// don't do anything here, as we are just updating the search or live scroll results 
			// so loadmask shoudn't be shown
			return;
		}

		Zarafa.common.ui.LoadMask.superclass.onBeforeLoad.apply(this, arguments);
	},

	/**
	 * Show the {@link #failureMsg} using the {@link #failureMsgCls}.
	 */
	showError : function()
	{
		this.el.unmask(false);
		this.el.mask(this.failureMsg, this.failureMsgCls);
	}
});
