Ext.namespace('Grommunio.settings.data');

/**
 * @class Grommunio.settings.data.SettingsDefaultValue
 * Singleton holding the default settings array for the entire client
 * @singleton
 */
Grommunio.settings.data.SettingsDefaultValue = function(){
	return {
		/**
		 * Gets the array of default values
		 * @public
		 * @return {Array} The array of default values
		 */
		getDefaultValues: function() {
			return {
				'grommunio': {
					'v1': {
						'main': {
							/**
							 * grommunio/v1/main/default_context
							 * @property
							 * @type String
							 */
							'default_context': 'mail',
							/**
							 * grommunio/v1/main/language
							 * @property
							 * @type String
							 */
							'language': 'en_GB',
							/**
							 * grommunio/v1/main/base_content_layer
							 * @property
							 * @type String
							 */
							'base_content_layer': 'tabs',
							/**
							 * grommunio/v1/main/confirm_close_dialog
							 * @property
							 * @type Boolean
							 */
							'confirm_close_dialog': true,
							/**
							 * grommunio/v1/main/week_start
							 * @property
							 * @type Number
							 */
							'week_start': 1,
							/**
							 * grommunio/v1/main/working_days
							 * @property
							 * @type Number[]
							 */
							'working_days': [ 1, 2, 3, 4, 5 ],
							/**
							 * grommunio/v1/main/start_working_hour 9
							 * @property
							 * @type Boolean
							 */
							'start_working_hour': 9 * 60,
							/**
							 * grommunio/v1/main/end_working_hour
							 * @property
							 * @type Boolean
							 */
							'end_working_hour': 17 * 60,

							/**
							 * grommunio/v1/main/datetime_display_format
							 * Format to use when displaying a date and/or time in a grid.
							 * Can be 'long' or 'short'
							 * @property
							 * @type String
							 */
							'datetime_display_format': 'short',

							/**
							 * grommunio/v1/main/datetime_time_format
							 * Format to use when displaying time in a grid.
							 * Can be 'g:i A' or 'G:i'
							 * @property
							 * @type String
							 */
							'datetime_time_format': 'G:i',

							/**
							 * grommunio/v1/main/default_font
							 * Default font for writing email
							 * @property
							 * @type String
							 */
							'default_font': 'tahoma,arial,helvetica,sans-serif',

							/**
							 * grommunio/v1/main/default_font_size
							 * Default font size for writing email
							 * possible values are {@link Grommunio.common.ui.htmleditor.FontSize#fontSizes}
							 * @property
							 * @type Number
							 */
							'default_font_size': '2.1',

							/**
							 * grommunio/v1/main/keycontrols
							 * Keycontrol options, possible values are
							 * {@link Grommunio.settings.data.KeyboardSettings}.
							 * @property
							 * @type String
							 */
							'keycontrols': Grommunio.settings.data.KeyboardSettings.BASIC_KEYBOARD_SHORTCUTS,

							/**
							 * grommunio/v1/main/page_size
							 * Default page size for single page.
							 * @property
							 * @type Number
							 */
							'page_size': 50,

							/**
							 * grommunio/v1/main/unread_borders
							 * Show borders for unread items
							 * @property
							 * @type Boolean
							 */
							'unread_borders': true,

							/**
							 * grommunio/v1/main/density
							 * List spacing, 'comfortable' or 'compact'
							 * @property
							 * @type String
							 */
							'density': 'comfortable',

							'notifier': {
								/**
								 * grommunio/v1/main/notifier/default
								 * Default plugin for user notifications without a plugin configured
								 * @property
								 * @type String
								 */
								'default': 'toast',

								'pagination': {
									/**
									 * grommunio/v1/main/notifier/pagination/paging/value
									 * Default plugin for the {@link Grommunio.common.ui.PagingToolbar PagingToolbar} slider.
									 * @property
									 * @type String
									 */
									'paging': {
										'value': 'pagingslider'
									},

									/**
									 * grommunio/v1/main/notifier/pagination/livescroll/value
									 * Default plugin for the live scroll loaded information slider.
									 * @property
									 * @type String
									 */
									'livescroll': {
										'value': 'livescrollslider'
									}

								},

								'error': {
									/**
									 * grommunio/v1/main/notifier/error/value
									 * Default plugin for the "Error" user notifications
									 * @property
									 * @type String
									 */
									'value': 'toast',

									'connection': {
										/**
										 * grommunio/v1/main/notifier/error/connection/value
										 * Default plugin for the "Connection loss" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},

									'license': {
										/**
										 * grommunio/v1/main/notifier/error/license/value
										 * Default plugin for the "Expired or over used license" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},

									'hierarchy': {

										'defaultfolder': {
											/**
											 * grommunio/v1/main/notifier/error/hierarchy/defaultfolder/value
											 * Default plugin for the "Missing Default folder" user notifications
											 * @property
											 * @type String
											 */
											'value': 'toast'
										}
									},

									'proxy': {
										/**
										 * grommunio/v1/main/notifier/error/proxy/value
										 * Default plugin for the "Error" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									}
								},

								'warning': {
									/**
									 * grommunio/v1/main/notifier/warning/value
									 * Default plugin for the "Warning" user notifications
									 * @property
									 * @type String
									 */
									'value': 'toast',

									'console': {
										/**
										 * grommunio/v1/main/notifier/warning/console/value
										 * Default plugin for the "Warning" console notifications
										 * @property
										 * @type String
										 */
										'value': 'console'
									}
								},

								'info': {
									/**
									 * grommunio/v1/main/notifier/info/value
									 * Default plugin for the "Info" user notifications
									 * @property
									 * @type String
									 */
									'value': 'toast',

									'reminder': {
										/**
										 * grommunio/v1/main/notifier/info/reminder/value
										 * Default plugin for the "Reminder" user notifications
										 * @property
										 * @type String
										 */
										'value': 'none'
									},

									'newmail': {
										/**
										 * grommunio/v1/main/notifier/info/newmail/value
										 * Default plugin for the "New Mail" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast',

										'folders': {
											/**
											 * grommunio/v1/main/notifier/info/newmail/folders/scope
											 * Which folders raise a new mail notification, one of
											 * 'all', 'own' or 'selected'
											 * @property
											 * @type String
											 */
											'scope': 'all',

											/**
											 * grommunio/v1/main/notifier/info/newmail/folders/selected
											 * Entryids of the folders which raise a new mail
											 * notification when the scope is 'selected',
											 * separated by a semicolon
											 * @property
											 * @type String
											 */
											'selected': ''
										}
									},

									'import': {
										/**
										 * grommunio/v1/main/notifier/info/import/value
										 * Default plugin for the "Import" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},

									'sent': {
										/**
										 * grommunio/v1/main/notifier/info/sent/value
										 * Default plugin for the "Sent" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},
									'saved': {
										/**
										 * grommunio/v1/main/notifier/info/saved/value
										 * Default plugin for the "Saved" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},
									'mailsaved': {
										/**
										 * grommunio/v1/main/notifier/info/mailsaved/value
										 * Default plugin for the "Saved Mail" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toolbarnotifierplugin'
									},
									'sending': {
										/**
										 * grommunio/v1/main/notifier/info/sending/value
										 * Default plugin for the "sending" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},

									'saving': {
										/**
										 * grommunio/v1/main/notifier/info/saving/value
										 * Default plugin for the "saving" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},

									'mailsaving': {
										/**
										 * grommunio/v1/main/notifier/info/mailsaving/value
										 * Default plugin for the "Saving Mail" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value': 'toolbarnotifierplugin'
									},

									'unresolved_recipients': {
										/**
										 * grommunio/v1/main/notifier/info/unresolved_recipients/value
										 * Default plugin for the "unresolved_recipients" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value': 'toast'
									},

									'meeting': {
										/**
										 * grommunio/v1/main/notifier/info/meeting/value
										 * Default plugin for the "meeting" user notifications
										 * @property
										 * @type String
										 */
										'value': 'toast'
									}

								}
							},

							'reminder': {
								/**
								 * grommunio/v1/main/reminder/polling_interval
								 * (in seconds)
								 * @property
								 * @type Number
								 */
								'polling_interval': 30,
								/**
								 * grommunio/v1/main/reminder/default_snooze_time
								 * (in minutes)
								 * @property
								 * @type Number
								 */
								'default_snooze_time': 5
							},

							'new_features_dialog': {
								/**
								 * grommunio/v1/main/new_features_dialog/show
								 * Whether or not the dialog with new feature info should be shown
								 * @property
								 * @type Boolean
								 */
								'show': true,

								'last_version': {
									/**
									 * grommunio/v1/main/last_version/webapp
									 * The version of grommunio Web for which the What's new dialog was shown last time
									 * @property
									 * @type String
									 */
									'webapp': '0'
								}
							},

							/**
							 * grommunio/v1/main/kdeveloper_tool
							 */
							'kdeveloper_tool': {
								/**
								 * grommunio/v1/main/kdeveloper_tool/kdeveloper
								 */
								'kdeveloper': false,

								/**
								 * grommunio/v1/main/kdeveloper_tool/itemdata
								 */
								'itemdata': false
							},

							/**
							 * grommunio/v1/main/help_manual
							 */
							'help_manual': {
								/**
								 * grommunio/v1/main/help_manual/show
								 * Whether or not the 'help' button in top-right corner should be shown
								 * @property
								 * @type Boolean
								 */
								show: true
							},

							/**
							 * grommunio/v1/main/title_counter
							 */
							'title_counter': {
								/**
								 * grommunio/v1/main/title_counter/show
								 * Whether or not the unread mail counter in application title should be shown
								 * @property
								 * @type Boolean
								 */
								show: true
							},

							/**
							 * grommunio/v1/main/desktop_notification
							 */
							'desktop_notification': {
									/**
									 * grommunio/v1/main/desktop_notification/autohide_enable
									 * Whether or not desktop notification should hide after some time.
									 * @property
									 * @type Boolean
									 */
								'autohide_enable': false,

									/**
									 * grommunio/v1/main/desktop_notification/autohide_time
									 * Time after which desktop notification should be hidden.
									 * @property
									 * @type Number
									 */
								'autohide_time': 5,

									/**
									 * grommunio/v1/main/desktop_notification/disable_sound
									 * Whether or not sound for the desktop notification should be disable.
									 * @property
									 * @type Boolean
									 */
								'disable_sound': false
							},

							/**
							 * grommunio/v1/main/file_previewer
							 *
							 */
							'file_previewer': {
								/**
								 * grommunio/v1/main/file_previewer/enable
								 *
								 * @property
								 * @type Boolean
								 */
								'enable': true,

								/**
								 * grommunio/v1/main/file_previewer/pdf_zoom
								 * Default zoom mode for PDF documents. (default: page-width) [Allowed: "auto", "page-actual", "page-width"]
								 */
								'pdf_zoom': 'page-width',

								/**
								 * grommunio/v1/main/file_previewer/odf_zoom
								 * Default zoom mode for ODF documents. (default: auto) [Allowed: "auto", "page-actual", "page-width"]
								 */
								'odf_zoom': 'page-width',

								/**
								 * grommunio/v1/main/file_previewer/target
								 * Where a preview opens. (default: dialogs) [Allowed: "dialogs", "tabs", "separateWindows"]
								 * The values are layer types of Grommunio.core.data.UIFactory.
								 */
								'target': 'dialogs'
							},

							/**
							 * grommunio/v1/main/undo_redo
							 *
							 */
							'undo_redo': {
								/**
								 * grommunio/v1/main/undo_redo/enable
								 * Whether undo/redo of message actions is available.
								 * Disabled by default: recording undo information
								 * adds overhead to every message action.
								 * @property
								 * @type Boolean
								 */
								'enable': false
							}
						},

						'contexts': {
							'hierarchy': {
								/**
								 * grommunio/v1/contexts/hierarchy/polling_interval
								 * (in seconds)
								 * @property
								 * @type Number
								 */
								'polling_interval': 60 * 5,

								/**
								 * grommunio/v1/contexts/hierarchy/hide_favorites
								 * @property
								 * @type Boolean
								 */
								'hide_favorites': false,

								/**
								 * grommunio/v1/contexts/hierarchy/scroll_favorites
								 * @property
								 * @type Boolean
								 */
								'scroll_favorites': false,

								/**
								 * grommunio/v1/contexts/hierarchy/show_favorites_in_context
								 * One of 'none', 'same_type' or 'all_types'.
								 * @property
								 * @type String
								 */
								'show_favorites_in_context': 'none',

								/**
								 * grommunio/v1/contexts/hierarchy/store_order
								 * The order in which the shared mailboxes are shown in the
								 * hierarchy, as a list of user names. Empty means the shared
								 * mailboxes are sorted alphabetically. See
								 * {@link Grommunio.hierarchy.data.StoreOrder}.
								 * @property
								 * @type Array
								 */
								'store_order': []
							},

							'search': {
								/**
								 * grommunio/v1/contexts/search/updatesearch_timeout (in ms)
								 * defer timeout to triggered update search if searching is running.
								 * @property
								 * @type Number
								 */
								'updatesearch_timeout': 500,

								/**
								 * grommunio/v1/contexts/search/search_criteria
								 * Object which holds search tool box information for
								 * saved search folder.
								 * @property
								 * @type Object
								 */
								'search_criteria': {}
							},

							'calendar': {
								/**
								 * grommunio/v1/contexts/calendar/default_merge_state
								 * True when the folders should be merged together
								 * @property
								 * @type Boolean
								 */
								'default_merge_state': false,
								/**
								 * grommunio/v1/contexts/calendar/default_zoom_level
								 * The default zoom level (in minutes) to be used in the calendar,
								 * should be either 5, 6, 10, 15, 30 or 60.
								 */
								'default_zoom_level': 30,
								/**
								 * grommunio/v1/contexts/calendar/default_appointment_period
								 * @property
								 * @type Number
								 */
								'default_appointment_period': 30,
								/**
								 * grommunio/v1/contexts/calendar/default_allday_busy_status
								 * The default busy status to be used while creating new all day events.
								 * default value is {@link Grommunio.core.mapi.BusyStatus#FREE}.
								 *
								 * @property
								 * @type Number
								 */
								'default_allday_busy_status': 0,
								/**
								 * grommunio/v1/contexts/calendar/remove_meetingrequest_on_calendar_response
								 * Move the request mail out of the inbox when the meeting is
								 * answered from the calendar. Off by default.
								 * @property
								 * @type Boolean
								 */
								'remove_meetingrequest_on_calendar_response': false,
								/**
								 * grommunio/v1/contexts/calendar/default_reminder
								 * @property
								 * @type Boolean
								 */
								'default_reminder': true,
								/**
								 * grommunio/v1/contexts/calendar/default_reminder_time
								 * @property
								 * @type Number
								 */
								'default_reminder_time': 15,
								/**
								 * grommunio/v1/contexts/calendar/default_allday_reminder_time
								 * @property
								 * @type Number
								 */
								'default_allday_reminder_time': 18 * 60,
								/**
								 * grommunio/v1/contexts/calendar/datepicker_show_busy
								 * @property
								 * @type Boolean
								 */
								 'datepicker_show_busy': true
							},

							'contact': {
								/**
								 * grommunio/v1/contexts/contact/show_name_dialog
								 * @property
								 * @type Boolean
								 */
								'show_name_dialog': true,
								/**
								 * grommunio/v1/contexts/contact/show_address_dialog
								 * @property
								 * @type Boolean
								 */
								'show_address_dialog': true
							},

							'mail': {
								/**
								 * grommunio/v1/contexts/mail/sendas
								 * @property
								 * @type Array
								 */
								'sendas': [],

								/**
								 * grommunio/v1/contexts/mail/enable_live_scroll
								 * @property
								 * @type Boolean
								 */
								'enable_live_scroll': true,

								/**
								 * grommunio/v1/contexts/mail/enable_conversation_view
								 * @property
								 * @type Boolean
								 */
								'enable_conversation_view': false,

								/**
								 * grommunio/v1/contexts/mail/hover_actions
								 * Show quick actions over the hovered message
								 * @property
								 * @type Boolean
								 */
								'hover_actions': true,

								/**
								 * grommunio/v1/contexts/mail/expand_single_conversation
								 * @property
								 * @type Boolean
								 */
								'expand_single_conversation': false,

								/**
								 * grommunio/v1/contexts/mail/enable_conversation_preview
								 * @property
								 * @type Boolean
								 */
								'enable_conversation_preview': true,

								/**
								 * grommunio/v1/contexts/mail/readreceipt_handling
								 * @property
								 * @type Number
								 */
								'readreceipt_handling': 'ask',

								/**
								 * grommunio/v1/contexts/mail/always_request_readreceipt
								 * @property
								 * @type Boolean
								 */
								'always_request_readreceipt': false,

								/**
								 * grommunio/v1/contexts/mail/autosave_enable
								 * @property
								 * @type Boolean
								 */
								'autosave_enable': true,

								/**
								 * grommunio/v1/contexts/mail/autosave_time
								 * Default timer (in seconds) to auto save mails periodically
								 * @property
								 * @type Number
								 */
								'autosave_time': 60,

								/**
								 * grommunio/v1/contexts/mail/autosave_encrypted_enable
								 * Keep autosaving while S/MIME or OpenPGP encryption is
								 * selected, although autosaved drafts are stored unencrypted.
								 * @property
								 * @type Boolean
								 */
								'autosave_encrypted_enable': false,

								/**
								 * grommunio/v1/contexts/mail/readflag_time_enable
								 * @property
								 * @type Boolean
								 */
								'readflag_time_enable': true,


								/**
								 * grommunio/v1/contexts/mail/readflag_time
								 * Default timer to wait for before marking msg as read when opened in previewpane
								 * main/readreceipt_handling
								 * @property
								 * @type Number
								 */
								'readflag_time': 0,

								/**
								 * grommunio/v1/contexts/mail/from_address_list
								 * @property
								 * @type Array
								 */
								'from_address_list': [],

								/**
								 * grommunio/v1/contexts/mail/block_external_content
								 * @property
								 * @type Boolean
								 */
								'block_external_content': true,

								/**
								 * grommunio/v1/context/mail/use_english_abbreviations
								 * @property
								 * @type Boolean
								 */
								'use_english_abbreviations': true,

								/**
								 * grommunio/v1/contexts/mail/close_on_respond
								 * @property
								 * @type Boolean
								 */
								'close_on_respond': true,

								/**
								 * grommunio/v1/contexts/mail/delegate_wastebasket_style
								 * @property
								 * @type Number
								 */
								'delegate_wastebasket_style': 8,

								/**
								 * grommunio/v1/contexts/mail/enable_grouping
								 * @property
								 * @type Boolean
								 */
								'enable_grouping': false,

								/**
								 * grommunio/v1/contexts/mail/html_editor
								 * @property
								 * @type string
								 */
								'html_editor': 'full_tinymce',

								// Small hack, the server determines these defaults
								// but we copy them here so the user can press
								// 'revert to defaults' safely.
								'outofoffice': {
									/**
									 * grommunio/v1/contexts/mail/outofoffice/set
									 * @property
									 * @type Number
									 */
									'set' : 0,
									/**
									 * grommunio/v1/contexts/mail/outofoffice/timerange
									 * @property
									 * @type Number
									 */
									'timerange' : 0,
									/**
									 * grommunio/v1/contexts/mail/outofoffice/internal_reply
									 * @property
									 * @type String
									 */
									'internal_reply' : '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/internal_subject
									 * @property
									 * @type String
									 */
									'internal_subject' : '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/external_reply
									 * @property
									 * @type String
									 */
									'external_reply' : '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/external_subject
									 * @property
									 * @type String
									 */
									'external_subject' : '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/from
									 * @property
									 * @type String
									 */
									'from': '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/until
									 * @property
									 * @type String
									 */
									'until' : '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/allow_external
									 * @property
									 * @type Boolean
									 */
									'allow_external' : '',
									/**
									 * grommunio/v1/contexts/mail/outofoffice/external_audience
									 * @property
									 * @type Boolean
									 */
									'external_audience' : ''
								},

								/**
								 * grommunio/v1/contexts/mail/signatures
								 * Signatures to be used when creating new mail or when creating reply/forward mail.
								 * @property
								 * @type Object
								 */
								'signatures': {
									/**
									 * grommunio/v1/contexts/mail/signatures/all
									 * This is an object of all signatures with unique ids as its keys. For each key
									 * you will have an object that is contains the following properties.
									 * <ul>
									 * <li>name ({@link String}) The name of the signature</li>
									 * <li>content ({@link String}) The body of the signature</li>
									 * <li>isHTML({@link Boolean}) Whether the signature has an HTML body</li>
									 * </ul>
									 * @property
									 * @type Object
									 */
									'all': {},

									/**
									 * grommunio/v1/contexts/mail/signatures/new_message
									 * id of the signature that will be used when creating new mail
									 * @property
									 * @type Number
									 */
									'new_message': undefined,

									/**
									 * grommunio/v1/contexts/mail/signatures/replyforward_message
									 * id of the signature that will be used when creating reply/forward mails
									 * @property
									 * @type Number
									 */
									'replyforward_message': undefined
								},

								'dialogs': {
									'mailcreate': {
										/**
										 * grommunio/v1/contexts/mail/dialogs/mailcreate/use_html_editor
										 * @property
										 * @type Boolean
										 */
										'use_html_editor': true
									}
								},

								/**
								 * grommunio/v1/contexts/mail/cc_recipients
								 * @property
								 * @type Array
								 */
								'cc_recipients':[],

								/**
								 * grommunio/v1/contexts/mail/delegate_sent_items_style
								 * @property
								 * @type String
								 */
								'delegate_sent_items_style': 'delegate',

								/**
								 * grommunio/v1/contexts/mail/use_html_email_preview
								 * @property
								 * @type Boolean
								 */
								'use_html_email_preview': true,

								/**
								 * grommunio/v1/contexts/mail/attachment_reminder_enable
								 * @property
								 * @type Boolean
								 */
								'attachment_reminder_enable': false
							},

							'task': {
								/**
								 * grommunio/v1/contexts/task/default_task_period
								 * @property
								 * @type Number
								 */
								'default_task_period': 0,
								/**
								 * grommunio/v1/contexts/task/default_reminder
								 * @property
								 * @type Boolean
								 */
								'default_reminder': false,
								/**
								 * grommunio/v1/contexts/task/default_reminder_time
								 * @property
								 * @type Number
								 */
								'default_reminder_time': 9 * 60,
								/**
								 * grommunio/v1/contexts/task/reminder_time_stepping
								 * incrementor or decrementor value in minutes for
								 * time field of reminder in task dialog.
								 * @property
								 * @type Number
								 */
								'reminder_time_stepping': 30
							},

							'today': {
								/**
								 * grommunio/v1/contexts/today/num_columns
								 * @property
								 * @type Number
								 */
								'num_columns': 3
							}
						},

						'widgets': {

							'sidebar': {
								/**
								 * grommunio/v1/widgets/sidebar/hide_widgetpanel
								 * @property
								 * @type Boolean
								 */
								'hide_widgetpanel': false
							}
						}
					}
				}
			};
		}
	};
}();
