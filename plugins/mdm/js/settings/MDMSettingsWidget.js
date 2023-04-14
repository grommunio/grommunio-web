Ext.namespace('Zarafa.plugins.mdm.settings');

/**
 * @class Zarafa.plugins.mdm.settings.MDMSettingsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 */
Zarafa.plugins.mdm.settings.MDMSettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.plugins.mdm.data.MDMDeviceStore();
		Ext.applyIf(config, {
			title : _('Mobile Devices'),
			items : [{
				xtype : 'panel',
				layout: 'fit',
				tbar : {
					layout : 'fit',
					height : '30',
					items: [{
						xtype : 'button',
						name : 'authErrorBtn',
						hidden : true,
						cls: 'mdm-autherror-bar',
						ref : '../../authErrorBtn',
						text : String.format(_('Unable to connect to the grommunio-sync server. Click {0} to enter your credentials'), "here".bold()),
						listeners : {
							scope: this,
							click : this.onAuthErrorClickHandler
						}
					}]
				},
				items : [{
					xtype : 'grid',
					name : _('Devices'),
					ref : '../deviceGrid',
					height : 400,
					loadMask : true,
					store : store,
					viewConfig : {
						forceFit : true,
						deferEmptyText: false,
						emptyText: '<div class="emptytext">' + _('No devices connected to your account') + '</div>'
					},
					columns : [{
						dataIndex : 'devicetype',
						header : _('Device'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'useragent',
						header : _('User Agent'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'wipestatus',
						header : _('Provisioning Status'),
						renderer : Zarafa.plugins.mdm.ui.Renderers.provisioningStatus
					},{
						dataIndex : 'lastupdatetime',
						header : _('Last Update'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'entryid',
						header : _('Device ID'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'deviceos',
						header : _('Device OS'),
						hidden : true,
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'devicefriendlyname',
						header : _('Device Info'),
						hidden : true,
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'firstsynctime',
						header : _('First Sync time'),
						hidden : true,
						renderer : Ext.util.Format.htmlEncode
					}],
					buttons : [{
						text : _('Wipe Device'),
						ref : '../../../wipeBtn',
						handler : this.onWipeBtn,
						scope : this
					},{
						text : _('Full resync'),
						ref : '../../../resyncBtn',
						handler : this.onFullResync,
						scope : this
					},{
						text : _('Remove device'),
						ref : '../../../removeBtn',
						handler : this.onRemoveBtn,
						scope : this
					},{
						text : _('Refresh'),
						ref : '../../../refresh',
						handler : this.onRefresh,
						scope : this
					}],
					listeners   : {
						rowdblclick: this.onRowDblClick,
						rowclick: this.onRowClick,
						render: this.onGridRender,
						scope: this
					}
				}]
			}]
		});
		Zarafa.plugins.mdm.settings.MDMSettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the panel.
	 * @private
	 */
	initEvents : function()
	{
		this.deviceGrid.mon(this.deviceGrid.getStore(),'beforeloadrecord', this.checkAuthentication, this, {buffer: 50});
		Zarafa.plugins.mdm.settings.MDMSettingsWidget.superclass.initEvents.apply(this, arguments);
	},

	/**
	 * Called when the grid is rendered.
	 * @private
	 */
	onGridRender : function()
	{
		this.deviceGrid.getStore().load();
	},

	/**
	 * This is a callback function for 'authenticate', 'resync', 'wipe', 'remove' actions and
	 * handler for 'beforeloadrecord' event of {@link Zarafa.plugins.mdm.data.MDMDeviceStore store}.
	 * It will show or hide "authentication red bar" button on the basis of response.
	 * This will be called from  {@link Zarafa.plugins.mdm.data.MDMResponseHandler MDMResponseHandler}
	 * @param {Boolean} isAuthenticated indicates whether a User is authenticated to grommunio-sync server or not.
	 */
	checkAuthentication : function(isAuthenticated)
	{
		this.authErrorBtn.setVisible(!isAuthenticated);
		if (isAuthenticated) {
			this.deviceGrid.getStore().load();
		}
	},

	/**
	 * Function which handles the click event on the "authentication red bar" button, displays
	 * a MessageBox for the user to enter password. The authenticate action is handled by
	 * the {@link #onPasswordSubmit} function.
	 */
	onAuthErrorClickHandler : function()
	{
		this.showPasswordMessageBox(_('Please enter your username and password'), this.onPasswordSubmit, 'authenticate');
	},

	/**
	 * General {@link Zarafa.common.dialogs.CustomMessageBox CustomMessageBox} for this component.
	 * @param {String} message message which needs to be shown in the messagebox.
	 * @param {Function} callbackFn callback function on click of buttons of this messagebox.
	 * @param {String} actionType action for which message dialog is needed to be shown.
	 */
	showPasswordMessageBox : function(message, callbackFn, actionType)
	{
		var customCfg = this.getCustomItemsAndButtons(actionType, this);
		new Zarafa.common.dialogs.CustomMessageBox({
			title:  _('Mobile Device Manager'),
			msg: message,
			buttonAlign: 'left',
			cls: 'k-show-more-details',
			width : 320,
			customItems: [{
				xtype: 'form',
				border: false,
				ref: '../inputForm',
				style: 'margin-top: 15px',
				items : customCfg.customItems
			}],
			customButtons: customCfg.customButtons,
			fn: callbackFn,
			mdmWidgetScope : this
		});
	},

	/**
	 * Helper function which will return custom items and custom buttons for {@link Zarafa.common.dialogs.CustomMessageBox CustomMessageBox}
	 * based on actiontype.
	 *
	 * @param {String} actionType action for which message dialog is needed to be shown.
	 * @param {Object} scope scope of the action.
	 * @return {Object} object which contains custom items and custom buttons.
	 */
	getCustomItemsAndButtons : function(actionType, scope)
	{
		var customCfg = {};
		var isAuthenticateAction = actionType === 'authenticate';
		customCfg['customButtons'] = [{
			name: isAuthenticateAction ? 'ok' : 'yes',
			cls: 'zarafa-action',
			text: isAuthenticateAction ? _('Ok') : _('Yes'),
			keepOpenWindow: true
		}, {
			name: isAuthenticateAction ? 'cancel' : 'no',
			text: isAuthenticateAction ? _('Close') : _('No')
		}];

		let customItems = [{
			xtype: 'textfield',
			allowBlank: false,
			inputType: 'password',
			boxLabel : '',
			hideLabel : true,
			emptyText: _('Password'),
			name: 'passwordField',
			ref: 'passwordField'
		}];

		var asVersion = scope?.deviceGrid?.getSelectionModel()?.getSelected()?.get('asversion');
		if (asVersion !== undefined && parseFloat(asVersion) >= 16.1 && actionType === 'wipe') {
			customItems.push(
				{
					xtype: 'radiogroup',
					name: 'wipeType',
					ref: 'wipeType',
					columns: 1,
					hideLabel: true,
					style: 'margin-top: 8px',
					value: 'accountonly',
					items: [{
						xtype: 'radio',
						name: 'wipeType',
						inputValue: 'accountonly',
						boxLabel: _('Wipe only data related to this account'),
					},{
						xtype: 'radio',
						name: 'wipeType',
						inputValue: 'alldata',
						boxLabel: _('Wipe all data')
					}],
					listeners: {
						change: scope.onRadioChange,
						scope: this
					}
				}
			);
		}

		// For 'authenticate' action username is required in messagebox.
		if (isAuthenticateAction) {
			customItems.unshift({
				xtype : 'textfield',
				allowBlank : false,
				emptyText: _('Username'),
				boxLabel : '',
				hideLabel : true,
				name : 'userNameField',
				ref : 'userNameField'
			});
		}

		customCfg['customItems'] = customItems;
		return customCfg;
	},

	/**
	 * Function which handles the confirmation button in the "authentication" messagebox.
	 * Sends an authenticate request to PHP.
	 *
	 * @param {Ext.Button} button button from the messagebox
	 */
	onPasswordSubmit : function(button)
	{
		if (button.name === "ok") {
			var inputForm = this.dlgItemContainer.inputForm.getForm();
			if (!inputForm.isValid()) {
				return;
			}

			var inputValues = inputForm.getValues();
			container.getRequest().singleRequest(
				'pluginmdmmodule',
				'authenticate',
				{
					'username': inputValues.userNameField,
					'password': inputValues.passwordField
				},
				new Zarafa.plugins.mdm.data.MDMResponseHandler({
					successCallback : this.mdmWidgetScope.checkAuthentication,
					mdmWidgetScope : this.mdmWidgetScope
				})
			);

			this.close();
		}
	},

	/**
	 * Function which handles the click event on the "Wipe Device" button, displays
	 * a MessageBox for the user to confirm the wipe action. The wipe action is
	 * handled by the onWipeDevice function.
	 */
	onWipeBtn : function()
	{
		var message = _('Do you really want to wipe your device?\n Enter your password to confirm.');
		this.showPasswordMessageBox(message, this.onWipeDevice, 'wipe');
	},

	/**
	 * Function which handles the confirmation button in the "wipe device" messagebox.
	 * Sends a wipe request to PHP for the selected device in the grid.
	 *
	 * @param {Ext.Button} button button from the messagebox
	 */
	onWipeDevice : function(button)
	{
		if (button.name === 'yes') {
			var inputForm = this.dlgItemContainer.inputForm.getForm();
			if (!inputForm.isValid()) {
				return;
			}

			var inputValues = inputForm.getValues();
			var mdmWidgetScope = this.mdmWidgetScope;
			var selectionModel = mdmWidgetScope.deviceGrid.getSelectionModel();
			var record = selectionModel.getSelected();
			if (record) {
				container.getRequest().singleRequest(
					'pluginmdmmodule',
					'wipe',
					{
						'deviceid' : record.get('entryid'),
						'password': inputValues.passwordField,
						'wipetype': inputValues.wipeType == 'accountonly' ?
							Zarafa.plugins.mdm.data.ProvisioningStatus.WIPE_PENDING_ACCOUNT_ONLY :
							Zarafa.plugins.mdm.data.ProvisioningStatus.WIPE_PENDING
					},
					new Zarafa.plugins.mdm.data.MDMResponseHandler({
						successCallback : mdmWidgetScope.refreshGrid,
						failureCallback : mdmWidgetScope.checkAuthentication,
						mdmWidgetScope : mdmWidgetScope
					})
				);
			}
			this.close();
		}
	},

	/**
	 * Function which handles the click event on the "Full resync" button, sends a
	 * full resync request to PHP.
	 */
	onFullResync : function()
	{
		var selectionModel = this.deviceGrid.getSelectionModel();
		var record = selectionModel.getSelected();
		if(record) {
			container.getRequest().singleRequest(
				'pluginmdmmodule',
				'resync',
				{ 'deviceid' : record.get('entryid') },
				new Zarafa.plugins.mdm.data.MDMResponseHandler({
					failureCallback : this.checkAuthentication,
					mdmWidgetScope : this
				})
			);
		}
	},
	/**
	 * Function which handles the click event on the "Remove Device" button, displays
	 * a MessageBox for the user to confirm the remove action. The remove action is
	 * handled by the onRemoveDevice function.
	 */
	onRemoveBtn : function()
 {
	 var message = _('Do you really want to remove your device?\n Enter your password to confirm.');
	 this.showPasswordMessageBox(message, this.onRemoveDevice, 'remove');
 },

	/**
	 * Remove all state data for a device, essentially resyncing it. Also resets
	 * the wipe status of the device to 0.
	 *
	 * @param {Ext.Button} button button from the messagebox
	 */
	onRemoveDevice : function(button)
	{
		if (button.name === 'yes') {
			var inputForm = this.dlgItemContainer.inputForm.getForm();
			if (!inputForm.isValid()) {
				return;
			}

			var inputValues = inputForm.getValues();
			var mdmWidgetScope = this.mdmWidgetScope;
			var selectionModel = mdmWidgetScope.deviceGrid.getSelectionModel();
			var record = selectionModel.getSelected();
			if (record) {
				container.getRequest().singleRequest(
					'pluginmdmmodule',
					'remove',
					{ 'deviceid' : record.get('entryid'), 'password': inputValues.passwordField },
					new Zarafa.plugins.mdm.data.MDMResponseHandler({
						successCallback : mdmWidgetScope.removeDone.createDelegate(this, [record], true),
						failureCallback : mdmWidgetScope.checkAuthentication,
						mdmWidgetScope : mdmWidgetScope
					})
				);
			}
			this.close();
		}
	},

	/**
	 * Callback function triggers when device was successfully removed from the grommunio-sync server.
	 * we have to remove that device from {@link Zarafa.plugins.mdm.data.MDMDeviceStore store}.
	 * @param {Zarafa.plugins.mdm.data.MDMDeviceRecord} record {@link Zarafa.core.data.IPMRecord record} object
	 */
	removeDone : function(record)
	{
		record.getStore().remove(record);
	},

	/**
	 * Function which refreshes the store records from the server.
	 */
	onRefresh : function()
	{
		this.deviceGrid.getStore().load();
	},
	/**
	 * Function which refreshes the store records from the server after remote
	 * wipe of a device.
	 */
	refreshGrid : function()
	{
		this.mdmWidgetScope.deviceGrid.getStore().load();
	},

	/**
	 * Function is called if a row in the grid gets double clicked.
	 * Which is use to show a dialog with detail device information
	 * @param {Ext.grid.GridPanel} grid The Grid on which the user double-clicked
	 * @param {Number} rowIndex The Row number on which was double-clicked.
	 */
	onRowDblClick : function (grid, rowIndex)
	{
		var record = grid.getStore().getAt(rowIndex);
		record.opened = false;
		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['mdm.dialog.mdmdevicecontentpanel'], undefined, {
			manager : Ext.WindowMgr,
			record : record
		});
	},

	/**
	 * Function is called if a row in the grid gets clicked.
	 * Which is use to disabled wipe button if wipe status is not available.
	 * @param {Ext.grid.GridPanel} grid The Grid on which the user clicked
	 * @param {Number} rowIndex The Row number on which was clicked.
	 */
	onRowClick : function (grid, rowIndex)
	{
		var record = grid.getStore().getAt(rowIndex);
		this.wipeBtn.setDisabled(!Ext.isDefined(record.get('wipestatus')));
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.Radio} in the
	 * {@link Ext.form.RadioGroup} has been changed. This will set the value
	 * selected by user in settingsModel.
	 * @param {Ext.form.RadioGroup} group The radio group which fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	onRadioChange: function(group, radio)
	{
		if (this.model && (this.model.get(group.name) !== radio.inputValue)) {
			this.model.set(group.name, radio.inputValue);
		}
	}
});

Ext.reg('Zarafa.plugins.mdm.mdmsettingswidget', Zarafa.plugins.mdm.settings.MDMSettingsWidget);
