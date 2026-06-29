Ext.namespace('Zarafa.plugins.ai');

/**
 * @class Zarafa.plugins.ai.SmartActions
 * @singleton
 *
 * Executes a suggested smart action by opening a PREFILLED dialog the user
 * reviews and confirms — nothing is committed without an explicit save. Uses
 * the same record-creation paths the application itself uses.
 */
Zarafa.plugins.ai.SmartActions = {

	/**
	 * Dispatch an action to its handler.
	 * @param {Object} action The sanitized action object from the server.
	 * @param {Zarafa.core.data.IPMRecord} record The source mail record.
	 */
	execute: function(action, record)
	{
		switch (action.type) {
			case 'meeting':
				this.createMeeting(action);
				break;
			case 'task':
				this.createTask(action);
				break;
			case 'contact':
				this.createContact(action);
				break;
			case 'reply':
				this.draftReply(action, record);
				break;
		}
	},

	/**
	 * The default folder record for a hierarchy key (calendar/task/contact).
	 * @param {String} key
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord|undefined}
	 * @private
	 */
	defaultFolder: function(key)
	{
		var hierarchy = container.getHierarchyStore();
		return hierarchy ? hierarchy.getDefaultFolder(key) : undefined;
	},

	/**
	 * Resolve a default folder, alerting the user instead of silently doing
	 * nothing when it is unavailable (e.g. a delegate-only mailbox).
	 * @param {String} key calendar | task | contact
	 * @param {String} label Human folder label for the message.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord|undefined}
	 * @private
	 */
	requireFolder: function(key, label)
	{
		var folder = this.defaultFolder(key);
		if (!folder) {
			Ext.MessageBox.alert(_('AI Assistant'),
				String.format(_('No default {0} folder is available for this account.'), label));
		}
		return folder;
	},

	/**
	 * Open a prefilled meeting request with attendees resolved by name/email.
	 * @param {Object} action
	 */
	createMeeting: function(action)
	{
		var folder = this.requireFolder('calendar', _('calendar'));
		if (!folder) {
			return;
		}

		var times = this.resolveTimes(action);
		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Appointment', {
			store_entryid: folder.get('store_entryid'),
			parent_entryid: folder.get('entryid'),
			startdate: times.start,
			duedate: times.end,
			commonstart: times.start,
			commonend: times.end,
			duration: times.minutes,
			busystatus: Zarafa.core.mapi.BusyStatus.BUSY
		});

		record.beginEdit();
		if (action.title) {
			record.set('subject', action.title);
		}
		if (action.location) {
			record.set('location', action.location);
		}
		if (action.notes) {
			record.set('body', action.notes);
		}
		record.endEdit();

		if (Ext.isFunction(record.convertToMeeting)) {
			record.convertToMeeting();
		}

		var recipientStore = record.getRecipientStore();
		var added = [];
		Ext.each(action.attendees || [], function(name) {
			if (!name) {
				return;
			}
			var recipient = recipientStore.parseRecipient(name, Zarafa.core.mapi.RecipientType.MAPI_TO);
			if (recipient) {
				recipientStore.add(recipient);
				added.push(recipient);
			}
		});
		if (added.length && Ext.isFunction(recipientStore.resolve)) {
			recipientStore.resolve(added);
		}

		Zarafa.core.data.UIFactory.openCreateRecord(record);
	},

	/**
	 * Open a prefilled task.
	 * @param {Object} action
	 */
	createTask: function(action)
	{
		var folder = this.requireFolder('task', _('tasks'));
		if (!folder) {
			return;
		}

		var data = {
			store_entryid: folder.get('store_entryid'),
			parent_entryid: folder.get('entryid')
		};
		if (action.title) {
			data.subject = action.title;
		}
		if (action.notes) {
			data.body = action.notes;
		}
		var due = this.parseDate(action.due);
		if (due) {
			data.duedate = due;
			data.startdate = due;
		}

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Task', data);
		Zarafa.core.data.UIFactory.openCreateRecord(record);
	},

	/**
	 * Open a prefilled contact.
	 * @param {Object} action
	 */
	createContact: function(action)
	{
		var folder = this.requireFolder('contact', _('contacts'));
		if (!folder) {
			return;
		}

		var data = {
			store_entryid: folder.get('store_entryid'),
			parent_entryid: folder.get('entryid')
		};
		if (action.name) {
			data.display_name = action.name;
			data.fileas = action.name;
		}
		if (action.email) {
			data.email_address_1 = action.email;
			// Without an explicit type the saved one-off entryid carries an empty
			// address type, which diverges from a normally-created contact.
			data.email_address_type_1 = 'SMTP';
		}

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Contact', data);
		this.applyContactName(record, action.name);

		Zarafa.core.data.UIFactory.openCreateRecord(record);
	},

	/**
	 * Fill a contact's structured name parts from a free-form name, using the
	 * framework's own parser (handles prefixes/suffixes/middle names) and the
	 * "Last, First" form. display_name/fileas already hold the full string, so
	 * the contact stays usable even when the parse is ambiguous.
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @param {String} name
	 * @private
	 */
	applyContactName: function(record, name)
	{
		name = (name || '').trim();
		if (!name) {
			return;
		}
		// Normalize "Surname, Given" into "Given Surname" before parsing.
		var comma = name.indexOf(',');
		if (comma > -1) {
			name = name.substring(comma + 1).trim() + ' ' + name.substring(0, comma).trim();
			name = name.trim();
		}

		var parsed;
		try {
			parsed = new Zarafa.contact.data.ContactDetailsParser().parseInfo('name', name);
		} catch (e) {
			parsed = null;
		}

		record.beginEdit();
		if (parsed) {
			Ext.each(['display_name_prefix', 'given_name', 'middle_name', 'surname', 'generation'], function(field) {
				if (parsed[field]) {
					record.set(field, parsed[field]);
				}
			});
		} else {
			// Fallback: only split when it is unambiguous (exactly two tokens).
			var parts = name.split(/\s+/);
			if (parts.length === 2) {
				record.set('given_name', parts[0]);
				record.set('surname', parts[1]);
			} else {
				record.set('given_name', name);
			}
		}
		record.endEdit();
	},

	/**
	 * Generate a reply with AI, then offer to open it as a prefilled reply.
	 * @param {Object} action carries the reply intent
	 * @param {Zarafa.core.data.IPMRecord} record The message being replied to
	 */
	draftReply: function(action, record)
	{
		if (!record) {
			return;
		}
		var client = Zarafa.plugins.ai.AIClient;
		var self = this;

		Zarafa.plugins.ai.ui.AIAssistantWindow.showFeature({
			title: _('Draft reply'),
			model: client.getModelName(),
			insertLabel: _('Open as reply'),
			insertIconCls: 'icon_reply',
			onInsert: function(text) {
				self.openReplyWithText(record, text);
			},
			runner: function(panel) {
				panel.startLoading(_('Drafting reply…'));
				client.run('draft_reply', record, { intent: action.intent || '', language: client.uiLanguageName() }, panel);
			}
		});
	},

	/**
	 * Open a reply to the message with the generated text placed above the
	 * quoted original.
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @param {String} text
	 */
	openReplyWithText: function(record, text)
	{
		var model = container.getContextByName('mail').getModel();

		var open = function() {
			var response = model.createResponseRecord(record, Zarafa.mail.data.ActionTypes.REPLY);
			if (response.get('isHTML')) {
				// Editor's default font (proportional), not monospace <pre>.
				var html = Zarafa.plugins.ai.AIClient.toEditorHtml(text);
				response.set('html_body', html + (response.get('html_body') || ''));
			} else {
				response.set('body', text + '\n\n' + (response.get('body') || ''));
			}
			Zarafa.core.data.UIFactory.openCreateRecord(response);
		};

		if (record.isOpened()) {
			open();
			return;
		}
		var store = record.getStore();
		if (!store) {
			open();
			return;
		}

		// Opening is async and can fail without ever firing 'open' (server error,
		// record removed). Bind cleanup to 'open' and 'exception', plus a timeout
		// safety net, so the listener is never leaked and the user gets feedback.
		var done = false;
		var timer, onOpen, onException, cleanup, failed;
		cleanup = function() {
			if (done) {
				return;
			}
			done = true;
			if (timer) {
				window.clearTimeout(timer);
			}
			store.un('open', onOpen, this);
			store.un('exception', onException, this);
		};
		failed = function() {
			cleanup.call(this);
			Ext.MessageBox.alert(_('Draft reply'), _('The message could not be opened to draft a reply.'));
		};
		onOpen = function(openedStore, openedRecord) {
			if (openedRecord !== record) {
				return;
			}
			cleanup.call(this);
			open();
		};
		onException = failed;
		timer = failed.defer(20000, this);

		store.on('open', onOpen, this);
		store.on('exception', onException, this);
		record.open();
	},

	/**
	 * Compute meeting start/end from an action's date/time/duration, defaulting
	 * to the next full hour for 30 minutes.
	 * @param {Object} action
	 * @return {Object} { start: Date, end: Date, minutes: Number }
	 * @private
	 */
	resolveTimes: function(action)
	{
		var minutes = action.duration_minutes > 0 ? action.duration_minutes : 30;
		var start = this.parseDate(action.date);
		if (start) {
			// Apply the time onto the valid date. A malformed time falls back to
			// 09:00 but must never throw the date away.
			var hours = 9, mins = 0;
			var match = (/^(\d{1,2}):(\d{2})$/).exec(String(action.time || '').trim());
			if (match) {
				var h = parseInt(match[1], 10), m = parseInt(match[2], 10);
				if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
					hours = h;
					mins = m;
				}
			}
			start.setHours(hours, mins, 0, 0);
		} else {
			start = this.nextHour();
		}
		return { start: start, end: new Date(start.getTime() + minutes * 60000), minutes: minutes };
	},

	/**
	 * Parse a YYYY-MM-DD string into a Date, or null.
	 * @param {String} value
	 * @return {Date|null}
	 * @private
	 */
	parseDate: function(value)
	{
		if (!value) {
			return null;
		}
		var date = new Date(value + 'T00:00');
		return isNaN(date.getTime()) ? null : date;
	},

	/**
	 * The next full hour from now.
	 * @return {Date}
	 * @private
	 */
	nextHour: function()
	{
		var date = new Date();
		date.setMinutes(0, 0, 0);
		date.setHours(date.getHours() + 1);
		return date;
	}
};
