Ext.namespace('Zarafa.settings.data');

/**
 * @class Zarafa.settings.data.SettingsDefaultValue
 * Singleton holding the default settings array for the entire client
 * @singleton
 */
Zarafa.settings.data.SettingsDefaultValue = function(){
	return {
		/**
		 * Gets the array of default values
		 * @public
		 * @return {Array} The array of default values
		 */
		getDefaultValues : function() {
			return {
				'zarafa' : {
					'v1' : {
						'main' : {
							/**
							 * zarafa/v1/main/default_context
							 * @property
							 * @type String
							 */
							'default_context' : 'mail',
							/**
							 * zarafa/v1/main/language
							 * @property
							 * @type String
							 */
							'language' : 'en_GB',
							/**
							 * zarafa/v1/main/base_content_layer
							 * @property
							 * @type String
							 */
							'base_content_layer' : 'tabs',
							/**
							 * zarafa/v1/main/confirm_close_dialog
							 * @property
							 * @type Boolean
							 */
							'confirm_close_dialog' : true,
							/**
							 * zarafa/v1/main/week_start
							 * @property
							 * @type Number
							 */
							'week_start' : 1,
							/**
							 * zarafa/v1/main/working_days
							 * @property
							 * @type Number[]
							 */
							'working_days' : [ 1, 2, 3, 4, 5 ],
							/**
							 * zarafa/v1/main/start_working_hour 9
							 * @property
							 * @type Boolean
							 */
							'start_working_hour' : 9 * 60,
							/**
							 * zarafa/v1/main/end_working_hour
							 * @property
							 * @type Boolean
							 */
							'end_working_hour' : 17 * 60,

							/**
							 * zarafa/v1/main/datetime_display_format
							 * Format to use when displaying a date and/or time in a grid.
							 * Can be 'long' or 'short'
							 * @property
							 * @type String
							 */
							'datetime_display_format' : 'short',

							/**
							 * zarafa/v1/main/default_font
							 * Default font for writing e-mail
							 * @property
							 * @type String
							 */
							'default_font' : 'tahoma,arial,helvetica,sans-serif',

							/**
							 * zarafa/v1/main/default_font_size
							 * Default font size for writing e-mail
							 * possible values are {@link Zarafa.common.ui.htmleditor.FontSize#fontSizes}
							 * @property
							 * @type Number
							 */
							'default_font_size' : 2,

							/**
							 * zarafa/v1/main/keycontrols
							 * Keycontrol options, possible values are
							 * {@link Zarafa.settings.data.KeyboardSettings}.
							 * @property
							 * @type String
							 */
							'keycontrols': Zarafa.settings.data.KeyboardSettings.BASIC_KEYBOARD_SHORTCUTS,

							/**
							 * zarafa/v1/main/page_size
							 * Default page size for single page.
							 * @property
							 * @type Number
							 */
							'page_size' : 50,

							'notifier' : {
								/**
								 * zarafa/v1/main/notifier/default
								 * Default plugin for user notifications without a plugin configured
								 * @property
								 * @type String
								 */
								'default' : 'messagebox',

								'error' : {
									/**
									 * zarafa/v1/main/notifier/error/value
									 * Default plugin for the "Error" user notifications
									 * @property
									 * @type String
									 */
									'value' : 'messagebox',

									'connection' : {
										/**
										 * zarafa/v1/main/notifier/error/connection/value
										 * Default plugin for the "Connection loss" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},

									'hierarchy' : {

										'defaultfolder' : {
											/**
											 * zarafa/v1/main/notifier/eror/hierarchy/defaultfolder/value
											 * Default plugin for the "Missing Default folder" user notifications
											 * @property
											 * @type String
											 */
											'value' : 'dropdown'
										}
									}
								},

								'warning' : {
									/**
									 * zarafa/v1/main/notifier/warning/value
									 * Default plugin for the "Warning" user notifications
									 * @property
									 * @type String
									 */
									'value' : 'messagebox'
								},

								'info' : {
									/**
									 * zarafa/v1/main/notifier/info/value
									 * Default plugin for the "Info" user notifications
									 * @property
									 * @type String
									 */
									'value' : 'popup',

									'reminder' : {
										/**
										 * zarafa/v1/main/notifier/info/reminder/value
										 * Default plugin for the "Reminder" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'none'
									},

									'newmail' : {
										/**
										 * zarafa/v1/main/notifier/info/newmail/value
										 * Default plugin for the "New Mail" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'popup'
									},

									'import' : {
										/**
										 * zarafa/v1/main/notifier/info/import/value
										 * Default plugin for the "Import" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},

									'sent' : {
										/**
										 * zarafa/v1/main/notifier/info/sent/value
										 * Default plugin for the "Sent" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},
									'saved' : {
										/**
										 * zarafa/v1/main/notifier/info/saved/value
										 * Default plugin for the "Saved" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},
									'mailsaved' : {
										/**
										 * zarafa/v1/main/notifier/info/mailsaved/value
										 * Default plugin for the "Saved Mail" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'toolbarnotifierplugin'
									},
									'sending' : {
										/**
										 * zarafa/v1/main/notifier/info/sending/value
										 * Default plugin for the "sending" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},

									'saving' : {
										/**
										 * zarafa/v1/main/notifier/info/saving/value
										 * Default plugin for the "saving" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},

									'mailsaving' : {
										/**
										 * zarafa/v1/main/notifier/info/mailsaving/value
										 * Default plugin for the "Saving Mail" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value' : 'toolbarnotifierplugin'
									},

									'unresolved_recipients' : {
										/**
										 * zarafa/v1/main/notifier/info/unresolved_recipients/value
										 * Default plugin for the "unresolved_recipients" user notifications in dialog
										 * @property
										 * @type String
										 */
										'value' : 'dropdown'
									},

									'meeting' : {
										/**
										 * zarafa/v1/main/notifier/info/meeting/value
										 * Default plugin for the "meeting" user notifications
										 * @property
										 * @type String
										 */
										'value' : 'messagebox'
									}

								}
							},

							'reminder' : {
								/**
								 * zarafa/v1/main/reminder/polling_interval
								 * (in seconds)
								 * @property
								 * @type Number
								 */
								'polling_interval' : 30,
								/**
								 * zarafa/v1/main/reminder/default_snooze_time
								 * (in minutes)
								 * @property
								 * @type Number
								 */
								'default_snooze_time' : 5
							},

							'new_features_dialog' : {
								/**
								 * zarafa/v1/main/new_features_dialog/show
								 * Whether or not the dialog with new feature info should be shown
								 * @property
								 * @type Boolean
								 */
								'show' : true,

								'last_version' : {
									/**
									 * zarafa/v1/main/last_version/webapp
									 * The version of WebApp for which the What's new dialog was shown last time
									 * @property
									 * @type String
									 */
									'webapp' : '0'
								}
							}
						},

						'contexts' : {
							'hierarchy' : {
								/**
								 * zarafa/v1/contexts/hierarchy/polling_interval
								 * (in seconds)
								 * @property
								 * @type Number
								 */
								'polling_interval' : 60 * 5
							},

							'search' : {
								/**
								 * zarafa/v1/contexts/search/updatesearch_timeout (in ms)
								 * defer timeout to triggered update search if searching is running.
								 * @property
								 * @type Number
								 */
								'updatesearch_timeout' : 500,

								/**
								 * zarafa/v1/contexts/search/search_criteria
								 * Object which holds search tool box information for
								 * saved search folder.
								 * @property
								 * @type Object
								 */
								'search_criteria' : {}
							},

							'calendar' : {
								/**
								 * zarafa/v1/contexts/calendar/default_merge_state
								 * True when the folders should be merged together
								 * @property
								 * @type Boolean
								 */
								'default_merge_state' : false,
								/**
								 * zarafa/v1/contexts/calendar/default_zoom_level
								 * The default zoom level (in minutes) to be used in the calendar,
								 * should be either 5, 6, 10, 15, 30 or 60.
								 */
								'default_zoom_level' : 30,
								/**
								 * zarafa/v1/contexts/calendar/default_appointment_period
								 * @property
								 * @type Number
								 */
								'default_appointment_period' : 30,
								/**
								 * zarafa/v1/contexts/calendar/default_reminder
								 * @property
								 * @type Boolean
								 */
								'default_reminder' : true,
								/**
								 * zarafa/v1/contexts/calendar/default_reminder_time
								 * @property
								 * @type Number
								 */
								'default_reminder_time' : 15,
								/**
								 * zarafa/v1/contexts/calendar/default_allday_reminder_time
								 * @property
								 * @type Number
								 */
								'default_allday_reminder_time' : 18 * 60,
								/**
								 * zarafa/v1/contexts/calendar/datepicker_show_busy
								 * @property
								 * @type Boolean
								 */
								 'datepicker_show_busy' : true,
								/**
								 * zarafa/v1/contexts/calendar/free_busy_range
								 * @property
								 * @type Number
								 */
								 'free_busy_range' : 2
							},

							'contact' : {
								/**
								 * zarafa/v1/contexts/contact/show_name_dialog
								 * @property
								 * @type Boolean
								 */
								'show_name_dialog' : true,
								/**
								 * zarafa/v1/contexts/contact/show_address_dialog
								 * @property
								 * @type Boolean
								 */
								'show_address_dialog' : true
							},

							'mail' : {

								/**
								 * zarafa/v1/contexts/mail/enable_live_scroll
								 * @property
								 * @type Boolean
								 */
								'enable_live_scroll' : true,

								/**
								 * zarafa/v1/contexts/mail/readreceipt_handling
								 * @property
								 * @type Number
								 */
								'readreceipt_handling' : 'ask',

								/**
								 * zarafa/v1/contexts/mail/always_request_readreceipt
								 * @property
								 * @type Boolean
								 */
								'always_request_readreceipt' : false,

								/**
								 * zarafa/v1/contexts/mail/autosave_enable
								 * @property
								 * @type Boolean
								 */
								'autosave_enable' : true,

								/**
								 * zarafa/v1/contexts/mail/autosave_time
								 * Default timer (in seconds) to auto save mails periodically
								 * @property
								 * @type Number
								 */
								'autosave_time' : 60,

								/**
								 * zarafa/v1/contexts/mail/readflag_time_enable
								 * @property
								 * @type Boolean
								 */
								'readflag_time_enable' : true,


								/**
								 * zarafa/v1/contexts/mail/readflag_time
								 * Default timer to wait for before marking msg as read when opened in previewpane
								 * main/readreceipt_handling
								 * @property
								 * @type Number
								 */
								'readflag_time' : 0,

								/**
								 * zarafa/v1/contexts/mail/from_address_list
								 * @property
								 * @type Array
								 */
								'from_address_list' : [],

								/**
								 * zarafa/v1/contexts/mail/block_external_content
								 * @property
								 * @type Boolean
								 */
								'block_external_content' : true,

								/**
								 * zarafa/v1/contexts/mail/safe_senders_list
								 * @property
								 * @type Array
								 */
								'safe_senders_list' : [],

								/**
								 * zarafa/v1/contexts/mail/close_on_respond
								 * @property
								 * @type Boolean
								 */
								'close_on_respond' : true,

								/**
								 * zarafa/v1/contexts/mail/enable_grouping
								 * @property
								 * @type Boolean
								 */
								'enable_grouping' : false,

								// Small hack, the server determines these defaults
								// but we copy them here so the user can press
								// 'revert to defaults' safely.
								'outofoffice' : {
									/**
									 * zarafa/v1/contexts/mail/outofoffice/message
									 * @property
									 * @type String
									 */
									'message' : '',
									/**
									 * zarafa/v1/contexts/mail/outofoffice/set
									 * @property
									 * @type Boolean
									 */
									'set' : false,
									/**
									 * zarafa/v1/contexts/mail/outofoffice/subject
									 * @property
									 * @type String
									 */
									'subject' : '',
									/**
									 * zarafa/v1/contexts/mail/outofoffice/from
									 * @property
									 * @type String
									 */
									'from' : '',
									/**
									 * zarafa/v1/contexts/mail/outofoffice/until
									 * @property
									 * @type String
									 */
									'until' : ''
								},

								/**
								 * zarafa/v1/contexts/mail/signatures
								 * Signatures to be used when creating new mail or when creating reply/forward mail.
								 * @property
								 * @type Object
								 */
								'signatures' : {
									/**
									 * zarafa/v1/contexts/mail/signatures/all
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
									'all' : {},

									/**
									 * zarafa/v1/contexts/mail/signatures/new_message
									 * id of the signature that will be used when creating new mail
									 * @property
									 * @type Number
									 */
									'new_message' : undefined,

									/**
									 * zarafa/v1/contexts/mail/signatures/replyforward_message
									 * id of the signature that will be used when creating reply/forward mails
									 * @property
									 * @type Number
									 */
									'replyforward_message' : undefined
								},

								'dialogs' : {
									'mailcreate' : {
										/**
										 * zarafa/v1/contexts/mail/dialogs/mailcreate/use_html_editor
										 * @property
										 * @type Boolean
										 */
										'use_html_editor' : true
									}
								}
							},

							'task' : {
								/**
								 * zarafa/v1/contexts/task/default_task_period
								 * @property
								 * @type Number
								 */
								'default_task_period' : 0,
								/**
								 * zarafa/v1/contexts/task/default_reminder
								 * @property
								 * @type Boolean
								 */
								'default_reminder' : false,
								/**
								 * zarafa/v1/contexts/task/default_reminder_time
								 * @property
								 * @type Number
								 */
								'default_reminder_time' : 9 * 60,
								/**
								 * zarafa/v1/contexts/task/reminder_time_stepping
								 * incrementor or decrementor value in minutes for
								 * time field of reminder in task dialog.
								 * @property
								 * @type Number
								 */
								'reminder_time_stepping' : 30
							},

							'today' : {
								/**
								 * zarafa/v1/contexts/today/num_columns
								 * @property
								 * @type Number
								 */
								'num_columns' : 3
							}
						}
					}
				}
			};
		}
	};
}();
