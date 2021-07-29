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
			title : _('Mobile Devices', 'plugin_mdm'),
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
					name : _('Devices', 'plugin_mdm'),
					ref : '../deviceGrid',
					height : 400,
					loadMask : true,
					store : store,
					viewConfig : {
						forceFit : true,
						deferEmptyText: false,
						emptyText: '<div class="emptytext">' + _('No devices connected to your account', 'plugin_mdm') + '</div>'
					},
					columns : [{
						dataIndex : 'devicetype',
						header : _('Device', 'plugin_mdm'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'useragent',
						header : _('User Agent', 'plugin_mdm'),
						renderer : Ext.util.Format.htmlEncode
					},/*{
						dataIndex : 'wipestatus',
						header : _('Provisioning Status', 'plugin_mdm'),
						renderer : Zarafa.plugins.mdm.ui.Renderers.provisioningStatus
					},*/{
						dataIndex : 'lastupdatetime',
						header : _('Last Update', 'plugin_mdm'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'entryid',
						header : _('Device ID', 'plugin_mdm'),
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'deviceos',
						header : _('Device OS', 'plugin_mdm'),
						hidden : true,
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'devicefriendlyname',
						header : _('Device Info', 'plugin_mdm'),
						hidden : true,
						renderer : Ext.util.Format.htmlEncode
					},{
						dataIndex : 'firstsynctime',
						header : _('First Sync time', 'plugin_mdm'),
						hidden : true,
						renderer : Ext.util.Format.htmlEncode
					}],
					buttons : [/*{
						text : _('Wipe Device', 'plugin_mdm'),
						ref : '../../../wipeBtn',
						handler : this.onWipeBtn,
						scope : this
					},*/{
						text : _('Full resync', 'plugin_mdm'),
						ref : '../../../resyncBtn',
						handler : this.onFullResync,
						scope : this
					},{
						text : _('Remove device', 'plugin_mdm'),
						ref : '../../../removeBtn',
						handler : this.onRemoveDevice,
						scope : this
					},{
						text : _('Refresh', 'plugin_mdm'),
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
	 * @param {Boolean} isAuthenticated indicates wether a User is authenicated to grommunio-sync server or not.
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
		var customCfg = this.getCustomItemsAndButtons(actionType);
		var msgbox = new Zarafa.common.dialogs.CustomMessageBox({
			title:  _('Mobile Device Manager', 'plugin_mdm'),
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
	 * @return {Object} object which contains custom items and custom buttons.
	 */
	getCustomItemsAndButtons : function(actionType)
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

		customItems = [{
			xtype: 'textfield',
			allowBlank: false,
			inputType: 'password',
			boxLabel : '',
			hideLabel : true,
			emptyText: _('Password'),
			name: 'passwordField',
			ref: 'passwordField'
		}]

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
					{ 'deviceid' : record.get('entryid'), 'password': inputValues.passwordField },
					new Zarafa.plugins.mdm.data.MDMResponseHandler({
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
	 * Remove all state data for a device, essentially resyncing it.
	 */
	onRemoveDevice : function()
	{
		var selectionModel = this.deviceGrid.getSelectionModel();
		var record = selectionModel.getSelected();
		if(record) {
			container.getRequest().singleRequest(
				'pluginmdmmodule',
				'remove',
				{ 'deviceid' : record.get('entryid') },
				new Zarafa.plugins.mdm.data.MDMResponseHandler({
					successCallback : this.removeDone.createDelegate(this, [record], true),
					failureCallback : this.checkAuthentication,
					mdmWidgetScope : this
				})
			);
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
	}
});

Ext.reg('Zarafa.plugins.mdm.mdmsettingswidget', Zarafa.plugins.mdm.settings.MDMSettingsWidget);
