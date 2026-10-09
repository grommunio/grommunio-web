/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recipientfield.data');

/**
 * @class Grommunio.common.recipientfield.data.SuggestionListStore
 * @extends Ext.data.Store
 * @xtype grommunio.suggestionliststore
 *
 * The main store which holds the suggestions as shown inside the
 * {@link Grommunio.common.recipientfield.ui.RecipientField RecipientField}.
 */
Grommunio.common.recipientfield.data.SuggestionListStore = Ext.extend(Ext.data.Store, {
	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Grommunio.core.Actions Actions}, default value is 'list'.
	 */
	actionType: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			batch: true,
			autoSave: true,
			remoteSort: false,
			actionType: Grommunio.core.Actions['list'],
			proxy: new Grommunio.common.recipientfield.data.SuggestionListProxy(),
			writer: new Grommunio.common.recipientfield.data.SuggestionListJsonWriter(),
			reader: new Ext.data.JsonReader({
				root: 'result',
				id: 'id'
			}, Grommunio.common.recipientfield.data.SuggestionListRecord)
		});

		Grommunio.common.recipientfield.data.SuggestionListStore.superclass.constructor.call(this, config);

		this.directoryMisses = [];
		this.on('load', this.onSuggestionsLoad, this);

		// Use multi-sorting on the suggestions,
		// we can't apply this in the configuration object
		// so we have to do it here.
		this.sort([{
			field: 'display_name',
			direction: 'ASC'
		},{
			field: 'smtp_address',
			direction: 'ASC'
		},{
			field: 'email_address',
			direction: 'ASC'
		}]);
	},

	/**
	 * Load all data from the store
	 * @param {Object} options Additional options
	 */
	load: function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// By default 'load' must cancel the previous request.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		if (!Ext.isDefined(options.actionType)) {
			options.actionType = this.actionType;
		}

		// The combo box passes the query through baseParams.
		var query = Ext.value(options.params.query, this.baseParams.query);
		if (!this.isDirectoryUseful(query)) {
			options.params.directory = false;
		}

		Grommunio.common.recipientfield.data.SuggestionListStore.superclass.load.call(this, options);
	},

	/**
	 * The directory is searched by substring, so a query that contains an earlier
	 * query without directory hits cannot have any either.
	 * @param {String} query The text to search for
	 * @return {Boolean} false when the server should skip the directory lookup
	 * @private
	 */
	isDirectoryUseful: function(query)
	{
		if (!container.getServerConfig().isDirectorySuggestionsEnabled() ||
		    !container.getSettingsModel().get('grommunio/v1/contexts/mail/suggest_from_directory')) {
			return false;
		}

		query = String(query || '').trim().toLowerCase();
		return !this.directoryMisses.some(function(miss) {
			return query.indexOf(miss) !== -1;
		});
	},

	/**
	 * Remember queries for which the server searched the directory without a hit.
	 * @param {Ext.data.Store} store The store
	 * @param {Ext.data.Record[]} records The loaded records
	 * @param {Object} options The load options
	 * @private
	 */
	onSuggestionsLoad: function(store, records, options)
	{
		if (!options || options.directorySearched !== true || !options.params) {
			return;
		}

		var hit = records.some(function(record) {
			return record.get('source') === 'directory';
		});
		// A full list may have cut directory entries off, so only an unfilled one proves a miss.
		if (!hit && records.length < 10) {
			this.directoryMisses.push(String(options.params.query).trim().toLowerCase());
		}
	}
});

Ext.reg('grommunio.suggestionliststore', Grommunio.common.recipientfield.data.SuggestionListStore);
