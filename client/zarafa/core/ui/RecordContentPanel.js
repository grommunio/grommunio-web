Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.RecordContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.recordcontentpanel
 *
 * The {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel} extends the normal {@link Zarafa.core.ui.ContentPanel ContentPanel},
 * and should be used for any content panels which contain an {@link Zarafa.core.data.MAPIRecord MAPIRecord}.
 *
 * FIXME: Provide default buttons which are common for all content panels containing a record
 */
Zarafa.core.ui.RecordContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Boolean} autoSave Automatically save all changes on the
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} to the
	 * {@link Zarafa.core.data.IPMStore IPMStore}.
	 */
	autoSave : true,

	/**
	 * @cfg {Object} Configuration object which will be used
	 * to instantiate the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent}.
	 * See the plugin for the available configuration options.
	 */
	recordComponentPluginConfig : undefined,

	/**
	 * @cfg {Zarafa.core.data.MAPIRecord} record (See {@link Zarafa.core.plugins.RecordComponentPlugin#record}).
	 */
	record : undefined,

	/**
	 * When this panel is {@link Zarafa.core.ui.ContentPanel#isModal modal} then this property will contain the
	 * original {@link Zarafa.core.data.MAPIRecord record} which is displayed in this content panel. During
	 * {@link #setRecord} however a copy will be made which is used during editing. When the content panel is closed
	 * the changes made to {@link #record} will be merged into {@link #modalRecord}.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	modalRecord : undefined,

	/**
	 * Reference to the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent} plugin
	 * which is used to send update events to all child {@link Ext.Container containers}
	 * in this container. This field is initialized by the
	 * {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponent} itself.
	 *
	 * @property
	 * @type Zarafa.core.plugins.RecordComponentPlugin
	 */
	recordComponentPlugin : undefined,

	/**
	 * @cfg {Boolean} showLoadMask true if load mask should be shown else false.
	 */
	showLoadMask : true,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the panel is waiting for the server to respond with the desired data. This will only
	 * be set if {@link #showLoadMask} is true.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @cfg {Boolean} showMaskMask true if a message should be shown to indicating if the
	 * message is being saved.
	 */
	showInfoMask : true,

	/**
	 * @cfg {String/Object} savingText When {@link #showInfoMask} is true, then this text
	 * will be shown when the message is being saved. When an object is provided which contains
	 * the 'msg' and 'title' fields respectively.
	 */
	savingText : { msg : _('Saving') + '...' },

	/**
	 * @cfg {String/Object} savingDoneText When {@link #showInfoMask} is true, then this text
	 * will be shown when the message has been saved. When an object is provided which contains
	 * the 'msg' and 'title' fields respectively.
	 */
	savingDoneText :{ title: _('Saved'), msg :  _('Saved successfully') },

	/**
	 * When {@link #showInfoMask} is true, then we should check if any save request
	 * is fired internally and we should not show {@link #savingText} and {@link #savingDoneText}. This is handled by
	 * maintaing an array of {@link Zarafa.core.data.MAPIRecord#actions message actions} that will be matched with message action
	 * actually set on record to show or not show info mask.
	 * @property
	 * @type Array
	 */
	internalActions : undefined,

	/**
	 * Indicates if the panel is currently busy saving data to the server.
	 * @property
	 * @type Boolean
	 */
	isSaving : false,

	/**
	 * The reference as returned by {@link Zarafa.core.ui.notifier.Notifier#notify} to reference the
	 * message in order to remove the message as soon as the save was completed.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	savingEl : undefined,

	/**
	 * @cfg {Boolean} closeOnSave Config option to close the panel when client recieves confirmation of message is saved.
	 */
	closeOnSave : false,

	/**
	 * @cfg {Boolean} confirmClose Option to launch a confirmation dialog when closing this panel with an unsaved record.
	 * This option is only used when the {@link Zarafa.settings.SettingsModel setting} 'zarafa/v1/main/confirm_close_dialog'
	 * is enabled.
	 */
	confirmClose : false,

	/**
	 * @cfg {Boolean} removeRecordOnCancel config to remove modal record from
	 * {@link Zarafa.core.data.MAPIStore MAPIStore} when user has not changed anything and closed
	 * the {@link Zarafa.core.data.UIFactoryLayer UIFactoryLayer}.
	 */
	removeRecordOnCancel : false,

	/**
	 * If set to true when the component is layed out, the loading mask will be displayed
	 * @property
	 * @type Boolean
	 */
	showLoadMaskOnStart : false,

	/**
	 * @cfg {Boolean} showModalWithoutParent Config option set to true when the dialog is modal dialog and
	 * It's doesn't have the parent dialog.
	 * @property
	 * @type Boolean
	 */
	showModalWithoutParent : false,

	/**
	 * @cfg {String} unSaveWarningMessage When {@link #record} has any unsaved changes
	 * And user trying to close separate window or tab if that is the case, then confirm dialog will show with this text
	 */
	unSaveWarningMessage : _('You will lose all unsaved work. Are you sure you want to close this window?'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Kopano Content Panel')
		});

		// Modal dialogs that will edit the record must work inside the shadowStore.
		if (config.recordComponentPluginConfig && config.recordComponentPluginConfig.allowWrite && config.modal) {
			config.recordComponentPluginConfig.useShadowStore = true;
		}

		// The confirmClose option depends on the settings
		if (config.confirmClose && !container.getSettingsModel().get('zarafa/v1/main/confirm_close_dialog')) {
			delete config.confirmClose;
		}

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push(Ext.applyIf(config.recordComponentPluginConfig || {}, {
			ptype: 'zarafa.recordcomponentplugin'
		}));

		config.plugins.push({
			ptype: 'zarafa.recordcomponentupdaterplugin'
		});

		this.addEvents(
			/**
			 * @event beforesaverecord
			 * Fires when the record of this {@link Zarafa.core.ui.RecordContentPanel contentpanel} is about to
			 * be saved to the server. Listening to this event can be used to update the record
			 * with the latest data from the {@link Ext.Component components}. The callback function
			 * can return false to prevent the {@link Zarafa.core.data.MAPIRecord MAPIRecord} to be saved.
			 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel to which the record belongs
			 * @param {Zarafa.core.data.MAPIRecord} record The record which is being saved
			 * @return {Boolean} false to cancel the save action
			 */
			'beforesaverecord',
			/**
			 * @event saverecord
			 * Fires when the record of this {@link Zarafa.core.ui.RecordContentPanel contentpanel} is being
			 * saved to the server. Listening to this event can be used for the final updates to
			 * the record before the actual saving takes place.
			 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel to which the record belongs
			 * @param {Zarafa.core.data.MAPIRecord} record The record which is being saved
			 */
			'saverecord',
			/**
			 * @event aftersaverecord
			 * Fires after the record has been saved successfully.
			 * This follows the {@link #updaterecord} event when the server responded to the save action
			 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel from where the record is saved
			 * @param {Zarafa.core.data.IPMRecord} record The record which has been saved
			 */
			'aftersaverecord'
		);

		this.internalActions = [];

		Zarafa.core.ui.RecordContentPanel.superclass.constructor.call(this, config);

		if (Ext.isString(this.savingText)) {
			this.savingText = { title : '', msg : this.savingText };
		}
		if (Ext.isString(this.savingDoneText)) {
			this.savingDoneText = { title : '', msg : this.savingDoneText };
		}

		this.initEvents();

		if (this.record) {
			this.setRecord(this.record);
		}
	},

	/**
	 * Initialize all {@link Zarafa.core.data.MAPIRecord record} related events
	 * for this {@link Zarafa.core.ui.RecordContentPanel contentpanel}.
	 * @private
	 */
	initEvents : function()
	{
		this.mon(this, {
			'setrecord' : this.onSetRecord,
			'beforeloadrecord' : this.onBeforeLoadRecord,
			'loadrecord' : this.onLoadRecord,
			'updaterecord' : this.onUpdateRecord,
			'writerecord' : this.onWriteRecord,
			'exceptionrecord' : this.onExceptionRecord,
			'afterlayout' : this.onAfterLayout,
			'scope' : this
		});
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display
	 * the {@link #loadMask}.
	 * @param {Boolean} errorMask True to show an error mask instead of the loading mask.
	 * @protected
	 */
	displayLoadMask : function(errorMask)
	{
		if (this.showLoadMask === false) {
			return;
		}

		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.el);
		}

		if (errorMask) {
			this.loadMask.showError();
		} else {
			this.loadMask.show();
		}
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #displayLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the
	 * loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.showLoadMask === false) {
			return;
		}

		if (this.loadMask) {
			this.loadMask.hide();
		}
	},

	/**
	 * If {@link showInfoMask} is enabled, this will display the {@link #savingText} to the user.
	 * @protected
	 */
	displayInfoMask : function()
	{
		if (this.showInfoMask === false) {
			return;
		}

		// Don't display save notification while system is marking the record as unread
		// which 'belongs to ShadowStore' and 'only message_flags gets modified'.
		// This happens when unread mail gets popped out.
		var modifications = this.record.modified;
		var isModifiedOnlyFlags = (modifications && Object.keys(modifications).length === 1 && Ext.isDefined(modifications.message_flags));
		var isShadowStore = (this.record.getStore() === container.getShadowStore());
		if (isModifiedOnlyFlags && isShadowStore) {
			return;
		}

		this.savingEl = container.getNotifier().notify('info.saving', this.savingText.title, this.savingText.msg, {
			container : this.getEl()
		});
	},

	/**
	 * If {@link #showInfoMask} is enabled, and {@link #displayInfoMask} has been called, this
	 * will remove the notification again. When saving has been successfull, a new notification
	 * will be shown to display the {@link #savingDoneText}.
	 * @param {Boolean} success false to disable the display of {@link #savingDoneText}.
	 * @protected
	 */
	hideInfoMask : function(success)
	{
		if (this.showInfoMask === false) {
			return;
		}

		if (this.savingEl) {
			container.getNotifier().notify('info.saving', null, null, {
				container : this.getEl(),
				destroy : true,
				reference : this.savingEl
			});
			delete this.savingEl;

			if (success !== false) {
				container.getNotifier().notify('info.saved', this.savingDoneText.title, this.savingDoneText.msg);
			}
		}
	},

	/**
	 * See {@link Zarafa.core.plugins.RecordComponentPlugin#setRecord}.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to set
	 */
	setRecord : function(record)
	{
		var cheapCopy; // Default value

		if (this.recordComponentPlugin) {
			// When write support is enabled, we have to check what our exact action should be.
			// When this is a modal, we must copy the record and make sure we reset
			// the unique identifier. This is required because this modal dialog
			// will be the second dialog with the same record (even though they
			// are copies, the entryid will be the same for both), and when removing
			// them from the ShadowStore will cause random() behavior.
			// When the record is opened in a separate dialog, we only need to copy the
			// record when it is not a phantom (e.g. it already exists on the server).
			// This is because a phantom record is only opened within this Dialog,
			// and unlikely to be available anywhere else, while a real Record can
			// be displayed in many UI components.
			if (this.recordComponentPlugin.allowWrite === true) {

				// Check if the record is created but not saved on the server yet, but is attached to a store.
				// In that case we must wait until the record is saved before we can start working with it.
				// This can happen when creating a quick appointment in the calendar. (Select a timeslot,
				// start typing, press [ENTER], immediately double-click on the appointment)
				// (The store_entryid must be checked because the jasmine tests create filled in phantom records
				// that are not being saved. But these records don't have a store_entryid)
				if ( record.phantom === true && Ext.isDefined(record.store) && record.store.isSaving ){
					// Show a loading mask either immediately or when the panel has been layed out)
					if ( this.el ){
						this.displayLoadMask();
					}else {
						this.showLoadMaskOnStart = true;
					}
					record.store.on('save', Ext.createDelegate(this.onStoreSave, this, [record]), this, {single: true});

					return;
				}

				if (this.isModal() && !this.showModalWithoutParent) {

					this.modalRecord = record;
					record = record.copy('modal-' + record.id);
					record.isModalDialogRecord = true;

					// We already copied the record, don't copy it again.
					cheapCopy = true;
				}
			}

			this.recordComponentPlugin.setRecord(record, cheapCopy);
		}
	},

	/**
	 * Event listener that is used when the panel is opened with a record that is being saved.
	 * This can happen when the user creates a quick appointment and opens it before the save
	 * request has returned. When the record has been saved it will call setRecord again,
	 * so it will create a copy with all the necessary entryids.

	 * @param {Zarafa.core.data.MAPIRecord} record The record that is being saved
	 */
	onStoreSave : function(record)
	{
		// Hide the loading mask (or make sure we don't show it)
		this.showLoadMaskOnStart = false;
		if ( this.el ){
			this.hideLoadMask();
		}
		this.setRecord(record);
	},

	/**
	 * Save all changes made to the {@link #record} to the server.
	 * @param {Boolean} storeSave (optional) False to only update the record,
	 * but not save the changes to the store.
	 * @return {Boolean} false if the record could not be saved
	 * @protected
	 */
	saveRecord : function(storeSave)
	{
		// Check if saving is allowed, and if by chance we aren't
		// saving already.
		if (this.recordComponentPlugin.allowWrite === false || this.isSaving === true) {
			return false;
		}

		if (this.fireEvent('beforesaverecord', this, this.record) === false) {
			return false;
		}

		// Check if the record is valid before saving.
		if (!this.record.isValid()) {
			return false;
		}

		this.fireEvent('saverecord', this, this.record);

		if (Ext.isDefined(this.modalRecord)) {
			this.modalRecord.applyData(this.record);
		}

		if (storeSave !== false) {
			var record = this.modalRecord || this.record;

			// Check if the record has actual modifications which
			// we can save to the server. record.save() will do
			// nothing if the store doesn't have the record in
			// the modifications array. So we must prevent going
			// any further here when there are not modifications.
			if (record.getStore().modified.indexOf(record) < 0) {
				if (this.closeOnSave === true) {
					this.close();
				}
				return;
			}

			// When the HTML body has been modified we must also send the isHTML property
			// with the save request because otherwise the backend will think this is an
			// plaintext record. (See Conversion::mapXML2MAPI())
			if ( record.isModified('html_body') ){
				record.set('isHTML', record.get('isHTML'), true);
			}

			record.save();
		}
	},

	/**
	 * This will delete the {@link #record} from its store. If {@link #modalRecord}
	 * is present, this record will be used for the delete action. When the record
	 * has been deleted, the dialog will be automatically closed.
	 * @protected
	 */
	deleteRecord : function()
	{
		if (this.recordComponentPlugin.allowWrite === false) {
			return;
		}

		if (this.recordComponentPlugin.isChangedByUser === true) {
			Ext.MessageBox.show({
				title: _('Delete item'),
				msg: _('This item has been changed. Are you sure you want to delete it?'),
				buttons: Ext.MessageBox.YESNO,
				fn: this.onConfirmDelete,
				scope: this
			});
		} else {
			Zarafa.common.Actions.deleteRecords(this.modalRecord || this.record);
		}
		return;
	},

	/**
	 * Event handler for the Delete confirmation dialog.
	 * If the user pressed 'yes' the record will be deleted by {@link Zarafa.common.Actions#deleteRecords}.
	 * @param {String} btn The text of the button on which the user clicked
	 * @private
	 */
	onConfirmDelete : function(btn)
	{
		if (btn === 'yes') {
			Zarafa.common.Actions.deleteRecords(this.modalRecord || this.record);
		}
	},

	/**
	 * Event handler that will make sure that the loadmask is shown when the panel is rendered
	 * and the {#link showLoadMaskOnStart} property has been set to true.
	 */
	onAfterLayout : function()
	{
		if ( this.showLoadMaskOnStart === true ) {
			this.displayLoadMask();
		}
	},

	/**
	 * Fires when a record has been added to the {@link #field}.
	 * No event handler may modify any properties inside the provided record (if this
	 * is needed for the Panel initialization, use the {@link #beforesetrecord} event).
	 * @param {Ext.Container} panel The panel to which the record was set
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was set
	 * @param {Zarafa.core.data.MAPIRecord} oldrecord The oldrecord which was previously set
	 */
	onSetRecord : function(panel, record, oldrecord)
	{
		if (!record) {
			return;
		}

		// Update the record, we might already have this.record set, but the recordcomponent might
		// have created a copy of that record. Hence we need to update our references now.
		this.record = record;

		// Add a beforesave handler to the store, this catches any saves from modal dialogs
		// and ensures we can still show the infomask in those cases.
		this.mon(this.record.getStore(), 'beforesave', this.onBeforeSaveRecord, this);
	},

	/**
	 * Event which is fired when the {@link #record} is going to be loaded.
	 * This will {@link #displayLoadMask display the loadmask}. This will be removed
	 * again during {@link #onLoadRecord}.
	 *
	 * @param {Ext.Container} panel The panel to which the record was set
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
	 * @private
	 */
	onBeforeLoadRecord : function(panel, record)
	{
		this.displayLoadMask();
	},

	/**
	 * Event which is fired when the {@link #record} has been completely loaded.
	 * This will {@link #hideLoadMask hide the loadmask}.
	 *
	 * @param {Ext.Container} panel The panel to which the record was set
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
	 * @private
	 */
	onLoadRecord : function(panel, record)
	{
		this.hideLoadMask();
	},

	/**
	 * Event handler which is fired when the the {@link Ext.data.Store store} for the {@link #record}
	 * fires the {@link Ext.data.Store#beforesave} event. This will check if the event was really regarding
	 * {@link #record} and will update the {@link #isSaving} property and {@link #displayInfoMask display the infobox}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Object} data The object data which is being saved to the server
	 * @private
	 */
	onBeforeSaveRecord : function(store, data)
	{
		var record = this.record.isModalDialogRecord ? this.modalRecord : this.record;
		if (data &&
			((data.update && data.update.indexOf(record) >= 0) ||
			 (data.create && data.create.indexOf(record) >= 0))) {
			this.isSaving = true;

			if(!this.hasInternalAction()) {
				this.displayInfoMask();
			}
		}
	},

	/**
	 * Fired when the {@link #updaterecord} event has been fired. If {@link #showInfoMask} is enabled,
	 * this will display the {@link #savingText} to indicate the saving is in progress.
	 *
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The record which fired the event
	 * @param {String} action write Action that ocurred. Can be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 */
	onUpdateRecord : function(contentpanel, action, record)
	{
		if (this.isSaving === true && action == Ext.data.Record.COMMIT) {

			if (!this.hasInternalAction()) {
				this.hideInfoMask(true);
			}

			this.isSaving = false;
			this.fireEvent('aftersaverecord', this, this.record);

			if (this.closeOnSave) {
				this.close();
				// We closed the panel, stop the event propagation as there is
				// no longer an UI that can be updated.
				return false;
			}
		}
	},

	/**
	 * Fired when the {@link #exceptionrecord} event has been fired. Will reset {@link #isSaving}.
	 *
	 * @param {String} type See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {String} action See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} options See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} response See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was subject of the request
	 * that encountered an exception.
	 * @param {String} error (Optional) Passed when a thrown JS Exception or JS Error is
	 * @private
	 */
	onExceptionRecord : function(proxy, type, action, options, response, args)
	{
		if (!this.hasInternalAction()) {
			if (type === "open") {
				this.displayLoadMask(true);
			} else {
				this.hideInfoMask(false);
				this.isSaving = false;
			}
		}
	},

	/**
	 * Action handler when the user presses the "Ok" button.
	 * This will call {@link #saveRecord} with the {@link #autoSave} argument.
	 */
	onOk : function()
	{
		if (this.saveRecord(this.autoSave) !== false) {
			if (this.closeOnSave !== true) {
				this.close();
			}
		}
	},

	/**
	 * Action handler when the user presses the "Cancel" button.
	 * This will close the panel without saving.
	 */
	onCancel : function()
	{
		this.removePhantomRecord();

		this.close();
	},

	/**
	 * Function will be called when user clicks on close tool on the {@link Ext.Window}
	 * and should remove phantom record if needed.
	 */
	closeWrap : function()
	{
		this.removePhantomRecord();

		Zarafa.core.ui.RecordContentPanel.superclass.closeWrap.apply(this, arguments);
	},

	/**
	 * Function is used to remove {@link Zarafa.core.data.MAPIRecord MAPIRecord} from
	 * {@link Zarafa.core.data.MAPIStore MAPIStore} when {@link #removeRecordOnCancel}
	 * is true and user has closed the dialog without saving it.
	 * @protected
	 */
	removePhantomRecord : function()
	{
		// check we should remove record on cancel or not
		if(!this.removeRecordOnCancel) {
			return false;
		}

		// for modal dialogs we need to remove original record not clone of the record
		// which is added in shadowstore
		var record = this.modalRecord;

		if(record) {
			var store = record.getStore();

			if(store) {
				store.remove(record);
			}
		}
	},

	/**
	 * Event handler will be called when the {@link Zarafa.core.plugins.RecordComponentPlugin RecordComponentPlugin}
	 * has fired a writerecord event.
	 * RecordComponentPlugin fires it if write event is fired on record.
	 *
	 * @param {Ext.data.Store} store
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy]
	 * @param {Object} result The 'data' picked-out out of the response for convenience.
	 * @param {Ext.Direct.Transaction} res
	 * @param {Zarafa.core.data.IPMRecord} record Store's record, on which write event is fired
	 * @protected
	 */
	onWriteRecord : function(store, action, result, res, record)
	{
		if(action == Ext.data.Api.actions.destroy) {
			this.close();
			return false;
		}
	},

	/**
	 * Override the doClose function to add support for the {@link #confirmClose}
	 * configuration option. This will check if the {@link #record} has any unsaved
	 * changes. And if that is the case, will show a confirmation dialog warning
	 * the user that he will lose all changes.
	 * @private
	 * @override
	 */
	doClose : function()
	{
		// If a confirmation is requested before closing, check if the record has a store,
		// if it doesn't the record is deleted and there are no unsaved changes. Otherwise
		// the 'dirty' flag will warn us about unsaved changes.
		if (this.confirmClose && this.recordComponentPlugin.isChangedByUser === true) {
			return Ext.MessageBox.show({
				title: _('Unsaved changes'),
				cls: Ext.MessageBox.WARNING_CLS,
				msg: this.unSaveWarningMessage,
				buttons: Ext.MessageBox.YESNO,
				fn: this.onConfirmClose,
				scope: this
			});
		}
		Zarafa.core.ui.RecordContentPanel.superclass.doClose.call(this);
	},

	/**
	 * Event handler for the Close confirmation dialog as created during {@link #onBeforeClose}.
	 * If the user pressed 'yes' the panel will be {@link #close closed}.
	 * @param {String} btn The text of the button on which the user clicked
	 * @private
	 */
	onConfirmClose : function(btn)
	{
		if (btn === 'yes') {
			this.record.reject();
			Zarafa.core.ui.RecordContentPanel.superclass.doClose.call(this);
		}
	},

	/**
	 * Update the components with the given record.
	 * Empty function in order to prevent {@link Ext.Container#update} from being called
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : Ext.emptyFn,

	/**
	 * Function will add sub action type to list of {@link internalActions} that will be used when
	 * showing info mask.
	 * @param {String} name name of the sub action type.
	 */
	addInternalAction : function(name)
	{
		this.internalActions.push(name);
	},

	/**
	 * Function will remove sub action type to list of {@link internalActions} that will be used when
	 * showing info mask.
	 * @param {String} name name of the sub action type.
	 */
	deleteInternalAction : function(name)
	{
		this.internalActions.splice(this.internalActions.indexOf(name), 1);
	},

	/**
	 * Function will return list of sub action types that will be used when showing info mask.
	 * @return {Array} array of all internal actions.
	 */
	getInternalActions : function()
	{
		return this.internalActions;
	},

	/**
	 * When sending/saving the record we need to check if we want to show info mask for this action,
	 * so this function will return boolean value to indicate that show mask should be shown or not.
	 * @return {Boolean} boolean to indicate that we are performing save on internal action or not.
	 */
	hasInternalAction : function()
	{
		var isInternalAction = false;
		var messageActions = this.record.getMessageActions();
		var internalActions = this.getInternalActions();

		Ext.iterate(messageActions, function(key, value) {
			if(internalActions.indexOf(key) > -1) {
				isInternalAction = true;

				// break loop
				return false;
			}
		}, this);

		return isInternalAction;
	},

	/**
	 * Function will check if the {@link #record} has any unsaved changes
	 * And user trying to close separate window if that is the case,
	 * will show a confirmation dialog warning the user that he will lose all changes.
	 * @return {String} warning message which will show in the leave requester dialog.
	 */
	onBeforeUnload : function()
	{
		if (this.fireEvent('beforeclose', this) !== false) {
			if(this.recordComponentPlugin.isChangedByUser && this.record.dirty){
				return this.unSaveWarningMessage;
			}
		}
	}
});

Ext.reg('zarafa.recordcontentpanel', Zarafa.core.ui.RecordContentPanel);
