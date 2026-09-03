Ext.namespace('Zarafa.common.attachment');

/**
 * @class Zarafa.common.attachment.AttachmentFolderSaver
 * Writes attachments to a folder the user picks, through the File System Access
 * API.
 *
 * This exists because of a limit on the drag: a drag can hand the operating
 * system at most one file, so a selection of several cannot be dropped onto
 * Explorer or the desktop (see
 * {@link Zarafa.common.ui.messagepanel.AttachmentLinks#onAttachmentDragStart}).
 * Asking for a folder is the one way a page can put several loose files on
 * disk, and it is the counterpart of "Download all as ZIP" for the case where
 * the user wants the files themselves rather than an archive of them.
 *
 * Availability matches the drag-out: <tt>showDirectoryPicker()</tt> is Chromium
 * only and needs a secure context, so the menu item is hidden elsewhere rather
 * than failing once it is used.
 * @singleton
 */
Zarafa.common.attachment.AttachmentFolderSaver = {
	/**
	 * Characters which may not go into a file name. Windows rejects all of them,
	 * and the picker rejects any name holding a path separator.
	 * @property
	 * @type RegExp
	 */
	// eslint-disable-next-line no-control-regex
	invalidFileNameChars: /[\\/:*?"<>|\x00-\x1f]/g,

	/**
	 * How many times a name may be stepped over before giving up, so a folder
	 * which somehow answers "exists" forever cannot spin.
	 * @property
	 * @type Number
	 */
	maxNameAttempts: 200,

	/**
	 * @return {Boolean} True when this browser can be asked for a folder
	 */
	isSupported: function()
	{
		return Ext.isFunction(window.showDirectoryPicker) && window.isSecureContext !== false;
	},

	/**
	 * The attachments of a selection which can be written to disk. Embedded
	 * messages are excluded for the same reason as in the drag: they are not
	 * backed by a single downloadable file.
	 * @param {Zarafa.core.data.IPMAttachmentRecord|Zarafa.core.data.IPMAttachmentRecord[]} records
	 * @return {Zarafa.core.data.IPMAttachmentRecord[]} The writable attachments
	 */
	getSaveableRecords: function(records)
	{
		var list = Ext.isArray(records) ? records : [records];
		var saveable = [];

		for (var i = 0; i < list.length; i++) {
			var record = list[i];
			if (!record || !Ext.isFunction(record.getAttachmentUrl)) {
				continue;
			}
			if (Ext.isFunction(record.isEmbeddedMessage) && record.isEmbeddedMessage()) {
				continue;
			}
			if (Ext.isEmpty(record.getAttachmentUrl())) {
				continue;
			}

			saveable.push(record);
		}

		return saveable;
	},

	/**
	 * Asks for a folder and writes the given attachments into it.
	 *
	 * A full success is silent: the user chose the folder and the files are in
	 * it. Anything which did not make it is named, so a partial result is never
	 * mistaken for a complete one.
	 *
	 * @param {Zarafa.core.data.IPMAttachmentRecord[]} records The attachments to write
	 */
	save: function(records)
	{
		var self = this;
		var saveable = this.getSaveableRecords(records);
		if (Ext.isEmpty(saveable) || !this.isSupported()) {
			return;
		}

		var written = 0;
		var failed = [];

		window.showDirectoryPicker({ mode: 'readwrite' }).then(function(dirHandle) {
			// One after another: the names are resolved against what the folder
			// already holds, so the writes cannot be independent, and a mailbox
			// is no place to open a dozen parallel downloads.
			var chain = Promise.resolve();
			var taken = {};

			saveable.forEach(function(record) {
				chain = chain.then(function() {
					return self.writeAttachment(dirHandle, record, taken).then(function() {
						written++;
					}, function() {
						failed.push(record.get('name') || _('Untitled'));
					});
				});
			});

			return chain;
		}).then(function() {
			if (!Ext.isEmpty(failed)) {
				self.showResult(written, failed);
			}
		}, function(err) {
			// Dismissing the folder picker is a choice, not a failure.
			if (err && err.name === 'AbortError') {
				return;
			}

			self.showResult(written, failed);
		});
	},

	/**
	 * Fetches one attachment and writes it into the chosen folder under a name
	 * which is free both within this run and in the folder itself. A write which
	 * fails part way takes its own half-written file with it.
	 * @param {FileSystemDirectoryHandle} dirHandle The folder chosen by the user
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment to write
	 * @param {Object} taken The lower-cased names already used by this run
	 * @return {Promise} Resolved once the file is closed
	 * @private
	 */
	writeAttachment: function(dirHandle, record, taken)
	{
		var self = this;

		return window.fetch(record.getAttachmentUrl(), { credentials: 'include' }).then(function(response) {
			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}

			return response.blob();
		}).then(function(blob) {
			return self.reserveFileName(dirHandle, record.get('name'), taken).then(function(name) {
				return dirHandle.getFileHandle(name, { create: true }).then(function(fileHandle) {
					return fileHandle.createWritable();
				}).then(function(writable) {
					return writable.write(blob).then(function() {
						return writable.close();
					}, function(err) {
						// Discard the writes and remove the entry this call
						// created: an empty file carrying an attachment's name
						// reads as a saved attachment and is not one.
						return writable.abort().catch(function() {
							// An unabortable stream still must not keep the file.
						}).then(function() {
							return dirHandle.removeEntry(name).catch(function() {
								// Nothing more can be done about the leftover.
							});
						}).then(function() {
							throw err;
						});
					});
				});
			});
		});
	},

	/**
	 * A file name which is free within this run and absent from the folder.
	 *
	 * The folder belongs to the user and may already hold a file of this name,
	 * so a taken name is stepped over ("report (2).pdf") rather than written
	 * through: <tt>getFileHandle</tt> with <tt>create</tt> would truncate their
	 * file without a word.
	 *
	 * @param {FileSystemDirectoryHandle} dirHandle The folder chosen by the user
	 * @param {String} rawName The attachment name as it arrived in the message
	 * @param {Object} taken The lower-cased names already used by this run
	 * @return {Promise} Resolved with the name to write
	 * @private
	 */
	reserveFileName: function(dirHandle, rawName, taken)
	{
		var base = this.sanitizeFileName(rawName);
		var dot = base.lastIndexOf('.');
		var stem = dot > 0 ? base.substring(0, dot) : base;
		var ext = dot > 0 ? base.substring(dot) : '';
		var limit = this.maxNameAttempts;

		var attempt = function(n) {
			if (n > limit) {
				return Promise.reject(new Error('no free file name for ' + base));
			}

			var name = n === 1 ? stem + ext : stem + ' (' + n + ')' + ext;
			if (taken[name.toLowerCase()] === true) {
				return attempt(n + 1);
			}

			return dirHandle.getFileHandle(name).then(function() {
				// It resolved, so the folder already holds this name.
				return attempt(n + 1);
			}, function(err) {
				if (err && err.name === 'NotFoundError') {
					taken[name.toLowerCase()] = true;
					return name;
				}

				throw err;
			});
		};

		return attempt(1);
	},

	/**
	 * Reduces an attachment name, which is sender controlled, to something a
	 * folder will accept: the basename only, no character a file system rejects,
	 * no leading dot and no trailing dot or space (Windows drops those, which
	 * would silently change the name).
	 * @param {String} name The attachment name
	 * @return {String} A usable file name, never empty
	 * @private
	 */
	sanitizeFileName: function(name)
	{
		var clean = String(name || '')
			.replace(/^.*[\\/]/, '')
			.replace(this.invalidFileNameChars, '_')
			.replace(/^\.+/, '_')
			.replace(/[. ]+$/, '')
			.substring(0, 200);

		return Ext.isEmpty(clean) ? _('Untitled') : clean;
	},

	/**
	 * Names what did not reach the folder. Only ever shown when something
	 * failed, so it always carries news.
	 * @param {Number} written How many attachments were written
	 * @param {String[]} failed The names which were not
	 * @private
	 */
	showResult: function(written, failed)
	{
		var msg;
		if (Ext.isEmpty(failed)) {
			msg = _('The attachments could not be saved.');
		} else {
			msg = String.format(
				ngettext('{0} attachment was saved. This one could not be: {1}',
					'{0} attachments were saved. These could not be: {1}', written),
				written, Ext.util.Format.htmlEncode(failed.join(', ')));
		}

		Ext.MessageBox.show({
			title: _('Save attachments'),
			msg: msg,
			cls: Ext.MessageBox.ERROR_CLS,
			buttons: Ext.MessageBox.OK
		});
	}
};
