Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.FolderSuggestions
 * @extends Object
 * @singleton
 *
 * Remembers in which folder the messages of a sender were filed, so the Copy/Move
 * dialog can offer those folders again. Only entryids are kept, at most
 * {@link #maxFolders} per sender and {@link #maxSenders} senders in total.
 */
Zarafa.common.data.FolderSuggestions = Ext.extend(Object, {
	/**
	 * @cfg {String} settingsPath The setting which holds the remembered folders
	 */
	settingsPath: 'zarafa/v1/state/folder_suggestions',

	/**
	 * @cfg {Number} maxFolders How many folders are remembered per sender
	 */
	maxFolders: 3,

	/**
	 * @cfg {Number} maxSenders How many senders are remembered
	 */
	maxSenders: 25,

	/**
	 * Remember the folder the given messages were filed into.
	 * @param {Zarafa.core.data.IPMRecord[]} records The messages which were moved
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder they went to
	 */
	remember: function(records, folder)
	{
		var keys = this.getKeys(records);
		var entryid = folder ? folder.get('entryid') : undefined;
		if (Ext.isEmpty(keys) || Ext.isEmpty(entryid)) {
			return;
		}

		var settings = container.getSettingsModel();
		var stored = settings.get(this.settingsPath, true) || {};
		var updated = {};

		// Rebuilding the object keeps the senders in the order they were last used
		Ext.iterate(stored, function(key, value) {
			if (keys.indexOf(key) === -1 && Array.isArray(value)) {
				updated[key] = value;
			}
		}, this);

		Ext.each(keys, function(key) {
			var folders = (stored[key] || []).filter(function(id) {
				return !Zarafa.core.EntryId.compareEntryIds(id, entryid);
			});
			folders.unshift(entryid);
			updated[key] = folders.slice(0, this.maxFolders);
		}, this);

		var names = Object.keys(updated);
		if (names.length > this.maxSenders) {
			Ext.each(names.slice(0, names.length - this.maxSenders), function(name) {
				delete updated[name];
			});
		}

		settings.set(this.settingsPath, updated);
	},

	/**
	 * The folders in which messages of this sender were filed before.
	 * @param {Zarafa.core.data.IPMRecord[]} records The messages which are being moved
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord[]} the folders, most recent first
	 */
	get: function(records)
	{
		var stored = container.getSettingsModel().get(this.settingsPath, true) || {};
		var hierarchy = container.getHierarchyStore();
		var folders = [];

		Ext.each(this.getKeys(records), function(key) {
			Ext.each(stored[key] || [], function(entryid) {
				var folder = hierarchy.getFolder(entryid);
				var known = folders.some(function(other) {
					return Zarafa.core.EntryId.compareEntryIds(other.get('entryid'), entryid);
				});
				if (folder && !known) {
					folders.push(folder);
				}
			}, this);
		}, this);

		return folders.slice(0, this.maxFolders);
	},

	/**
	 * The keys under which the folders of these messages are remembered: the address
	 * of the sender and its domain, so mail of a colleague is suggested by address and
	 * mail of a shop by domain.
	 * @param {Zarafa.core.data.IPMRecord[]} records The messages
	 * @return {String[]} the keys, the most specific one first
	 * @private
	 */
	getKeys: function(records)
	{
		var record = Array.isArray(records) ? records[0] : records;
		if (!record || !Ext.isFunction(record.get)) {
			return [];
		}

		var address = record.get('sent_representing_email_address') || record.get('sender_email_address') || '';
		address = String(address).toLowerCase().trim();
		var at = address.indexOf('@');
		if (at < 1) {
			return [];
		}

		return [address, address.substring(at + 1)];
	}
});

Zarafa.common.data.FolderSuggestions = new Zarafa.common.data.FolderSuggestions();
