Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.AutoSaveMessagePlugin
 * @extends Object
 * @ptype zarafa.autosavemessageplugin
 *
 * Special plugin which must be used in combination with the
 * {@link Zarafa.core.plugins.RecordComponentPlugin}. This will
 * save message periodically after certain time.
 */
Zarafa.core.plugins.AutoSaveMessagePlugin = Ext.extend(Object, {
	/**
	 * The component which has been {@link #init initialized} on
	 * this plugin.
	 * @property
	 * @type Ext.Component
	 */
	field : undefined,

	/**
	 * The record which has been {@link #onSetRecord set} on the
	 * {@link #field}.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	record : undefined,

	/**
	 * Timer that is used to save message after specified minutes
	 * @property
	 * @type Number
	 */
	messageAutoSaveTimer : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.Component} field The component on which the plugin is installed
	 */
	init : function(field)
	{
		this.field = field;
		field.messageAutoSavePlugin = this;

		this.field.on('render', this.onRender, this);
	},

	/**
	 * Event handler for the {@link Ext.Component#render render} event
	 * on the {@link #field}. This will register the event handlers which
	 * are needed to listen for record changes.
	 */
	onRender : function()
	{
		// Initialize necessary events based on ContentPanel and RecordComponentPlugin.
		this.field.on({
			'setrecord' : this.onSetRecord,
			'userupdaterecord' : this.onUserUpdateRecord,
			'saverecord' : this.onSaveRecord,
			'close' : this.onDestroy,
			'destroy' : this.onDestroy,
			'scope' : this
		});

		var fields = this.field.find('enableKeyEvents', true);

		// Register keypress event on every input field of the ContentPanel.
		Ext.each(fields, function(inputField) {
			this.field.mon(inputField, {
				'keypress' : this.onFieldKeyPress,
				'scope' : this
			});
		}, this);
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#setrecord setrecord} event
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The new record which is being set
	 * @param {Zarafa.core.data.MAPIRecord} oldrecord The old record which was previously set
	 * @private
	 */
	onSetRecord : function(field, record, oldrecord)
	{
		// Only IPMRecords will be handled by this plugin,
		// all other records will be discarded.
		if (record instanceof Zarafa.core.data.IPMRecord) {
			this.record = record;
		} else {
			this.record = undefined;
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#userupdaterecord userupdaterecord} event
	 * on the {@link #field}. This will {@link #startMessageAutoSaveTimer start} the {@link #messageAutoSaveTimer}.
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
	 * @param {Boolean} isChangedByUser Indicates if the record has been changed by the user since it has been loaded.
	 * @private
	 */
	onUserUpdateRecord : function(field, record, isChangedByUser)
	{
		if (isChangedByUser) {
			this.startMessageAutoSaveTimer();
		}
	},

	/**
	 * Event handler for the input fields of the {@link #field}.
	 * This will {@link #startMessageAutoSaveTimer start} the {@link #messageAutoSaveTimer}.
	 * @param {HtmlElement} element The target of the event
	 * @param {Ext.EventObject} event The Ext.EventObject encapsulating the DOM event
	 * @param {Object} options The options configuration passed to the addListener call
	 * @private
	 */
	onFieldKeyPress : function(element, event, options)
	{
		this.startMessageAutoSaveTimer();
	},

	/**
	 * Start the {@link #messageAutoSaveTimer} if it was not yet started already.
	 * This will check the settings for the desired interval, and delay the call
	 * to {@link #messageAutoSave} as configured.
	 * @private
	 */
	startMessageAutoSaveTimer : function()
	{
		if (!this.messageAutoSaveTimer && this.record && this.record.isUnsent()) {
			var timeout = container.getSettingsModel().get('zarafa/v1/contexts/mail/autosave_time') * 1000;
			this.messageAutoSaveTimer = this.messageAutoSave.defer(timeout, this);
		}
	},

	/**
	 * Stop the {@link #messageAutoSaveTimer} if it is still pending.
	 * This will clear the interval and delete the {@link #messageAutoSaveTimer} making it
	 * available again for rescheduling.
	 * @private
	 */
	resetMessageAutoSaveTimer : function()
	{
		if (this.messageAutoSaveTimer) {
			window.clearTimeout(this.messageAutoSaveTimer);
			this.messageAutoSaveTimer = null;
		}
	},

	/**
	 * Event handler for the {@link #messageAutoSaveTimer}, this will
	 * {@link Zarafa.common.Actions.messageAutoSave autosave} the {@link #record}.
	 * @private
	 */
	messageAutoSave : function()
	{
		if (this.record) {

			// Check if the response received after resolve-attempt is ambiguous or not, if this is the case then "check names" dialog is still opened,
			// just halt the auto-saving mechanism until user select any record from suggestion.
			var recipientSubStore = this.record.getSubStore('recipients');
			var ambiguityDetected = false;
			recipientSubStore.each(function(record){
				if(record.resolveAttemptAmbiguous) {
					ambiguityDetected = true;
				}
			});

			if(!ambiguityDetected){
				this.field.saveRecord();
			} else {
				this.resetMessageAutoSaveTimer();
				this.startMessageAutoSaveTimer();
			}
		}
	},

	/**
	 * When the record is about to be saved on the {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel}
	 * we should {@link #resetMessageAutoSaveTimer cancel} {@link #messageAutoSaveTimer}
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel which invoked the event
	 * @param {Zarafa.core.data.IPMRecord} record The record which is being saved.
	 * @private
	 */
	onSaveRecord : function(contentpanel, record)
	{
		this.resetMessageAutoSaveTimer();
	},

	/**
	 * Event handler for the {@link Ext.Container#destroy destroy} event.
	 * This will {@link #resetMessageAutoSaveTimer cancel} the {@link #messageAutoSaveTimer}
	 * @private
	 */
	onDestroy : function()
	{
		this.resetMessageAutoSaveTimer();
		this.record = undefined;
	}
});

Ext.preg('zarafa.autosavemessageplugin', Zarafa.core.plugins.AutoSaveMessagePlugin);
