/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @class Grommunio.common.ui.LoadMask
 * @extends Ext.LoadMask
 *
 * This custom loadmask is created to handle search requests. When {@link Grommunio.core.data.MAPIStore MAPIStore}
 * starts search it is started as incremental search so search results are updated periodically.
 * but every time search results are updated we shouldn't show loadmask, so this custom loadmask handles
 * this situation and doesn't show load mask when load event is fired for updating search results.
 */
Grommunio.common.ui.LoadMask = Ext.extend(Ext.LoadMask, {
	/**
	 * @cfg {String} msg message that will be displayed in {@link Grommunio.common.ui.LoadMask LoadMask}
	 * when the {@link Grommunio.core.data.MAPIStore MAPIStore} is loading data.
	 */
	msg: _('Loading…'),

	/**
	 * @cfg {Boolean} isLoading it was by default false which represent that loading mask
	 * was not warp on dummy row of grid.
	 */
	isLoading: false,

	/**
	 * @cfg {String} failureMsg message that will be displayed in {@link Grommunio.common.ui.LoadMask LoadMask}
	 * when the {@link Grommunio.core.data.MAPIStore MAPIStore} has fired an exception.
	 */
	failureMsg: _('Message could not be loaded'),

	/**
	 * @cfg {String} failureMsgCls The CSS class to be applied on the {@link Grommunio.common.ui.LoadMask LoadMask}
	 * when the {@link Grommunio.core.data.MAPIStore MAPIStore} has fired an exception.
	 */
	failureMsgCls: 'x-mask-error',

	/**
	 * Function will be called whenever {@link Grommunio.core.data.MAPIStore MAPIStore}'s
	 * {@link Grommunio.core.data.MAPIStore#load} is fired, and will hide the loadmask.
	 *
	 * @param {Grommunio.core.data.IPMStore} store The store which has loaded
	 * @param {Grommunio.core.data.IPMRecord/Array} records The records which have loaded
	 * @param {Object} options The options object used for loading the store.
	 * @private
	 */
	onLoad: function(store, records, options)
	{
		if(options && (options.actionType === Grommunio.core.Actions['updatesearch'] || options.actionType === Grommunio.core.Actions['updatelist'])) {
			// don't do anything here, as we are just updating the search or live scroll results
			// so loadmask shouldn't be removed
			return;
		}

		Grommunio.common.ui.LoadMask.superclass.onLoad.apply(this, arguments);
	},

	/**
	 * Function will be called whenever {@link Grommunio.core.data.MAPIStore MAPIStore}'s
	 * {@link Grommunio.core.data.MAPIStore#beforeload} is fired, and will show the loadmask.
	 *
	 * @param {Grommunio.core.data.IPMStore} store the Store which is going to be loaded
	 * @param {Object} options The options object which is used for loading the store
	 * @private
	 */
	onBeforeLoad: function(store, options)
	{
		if(options && (options.actionType === Grommunio.core.Actions['updatesearch'] || options.actionType === Grommunio.core.Actions['updatelist'])){
			// don't do anything here, as we are just updating the search or live scroll results
			// so loadmask shouldn't be shown
			return;
		}

		Grommunio.common.ui.LoadMask.superclass.onBeforeLoad.apply(this, arguments);
	},

	/**
	 * Show the {@link #failureMsg} using the {@link #failureMsgCls}.
	 */
	showError: function()
	{
		this.el.unmask(false);
		this.el.mask(this.failureMsg, this.failureMsgCls);
	}
});
