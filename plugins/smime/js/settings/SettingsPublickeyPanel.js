Ext.namespace('Zarafa.plugins.smime.settings');

/**
 * @class Zarafa.plugins.smime.settings.SettingsPublickeyPanel
 * @extends Ext.Panel
 * @xtype smime.publiccertificatespanel
 * Will generate UI for the {@link Zarafa.plugins.smime.settings.SettingsPublickeyWidget SettingsPublickeyWidget}.
 */
Zarafa.plugins.smime.settings.SettingsPublickeyPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.plugins.smime.data.SmimeCertificateStore} store Certificate store that will be used to load public certificates
	 */
	store : undefined,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the dialog is waiting for the server to respond with the desired data.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!config.store) {
			config.store = new Zarafa.plugins.smime.data.SmimeCertificateStore();
		}

		Ext.applyIf(config, {
			xtype : 'smime.publiccertificatespanel',
			border : false,
			layout : {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : this.createPanelItems(config.store)
		});

		Zarafa.plugins.smime.settings.SettingsPublickeyPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Zarafa.plugins.smime.data.SmimeCertificateStore SmimeCertificateStore}
	 * @return {Array} array of items that should be added to panel.
	 * @param {Zarafa.plugins.smime.data.SmimeCertificateStore} store store that will be used to load public certificates.
	 * @private
	 */
	createPanelItems : function(store)
	{
		var certStore = store;
		return [{
			xtype : 'displayfield',
			value : _('Below you can view and delete public & private certificate(s) stored on the server.', 'plugin_smime'),
			fieldClass : 'x-form-display-field zarafa-settings-widget-extrainfo'
		}, {
			xtype : 'container',
			flex : 1,
			layout : {
				type : 'hbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : [{
				xtype : 'smime.publickeygrid',
				ref : '../publickeyGrid',
				store : store,
				flex : 1
			}, {
				xtype : 'container',
				width : 160,
				defaults : {
					width : 140
				},
				layout : {
					type : 'vbox',
					align : 'center',
					pack  : 'start'
				},
				items : [{
					xtype : 'displayfield',
					value : _('Filter on Email', 'plugin_smime')
				}, {
					xtype : 'textfield',
					listeners : {
						specialkey: function(f, e) {
							if(e.getKey() == e.ENTER){
								certStore.filter('email', f.getValue());
							}
						}
					}
				}, {
					xtype : 'spacer',
					height : 20
				}, {
					xtype : 'button',
					width : 84,
					text : _('Remove', 'plugin_smime'),
					disabled : true,
					ref : '../../removeButton',
					handler : this.onCertificateRemove,
					scope : this
				}, {
					xtype : 'spacer',
					height : 20
				}, {
					xtype : 'button',
					width : 84,
					text : _('Details', 'plugin_smime'),
					disabled : true,
					ref : '../../detailButton',
					handler : this.onDetailButton,
					scope : this

				}]
			}]
		}];
	},

	/**
	 * initialize events for the panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.smime.settings.SettingsPublickeyPanel.superclass.initEvents.call(this);

		// register event to enable/disable buttons
		this.mon(this.publickeyGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display the {@link #loadMask}.
	 * @protected
	 */
	showLoadMask : function()
	{
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.el);
		}

		this.loadMask.show();
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.loadMask) {
			this.loadMask.hide();
		}
	},

	/**
	 * Event handler will be called when selection in {@link Zarafa.plugins.smime.settings.PublickeyGrid PublickeyGrid}
	 * has been changed
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 */
	onGridSelectionChange : function(selectionModel)
	{
		var noSelection = (selectionModel.hasSelection() === false);

		this.removeButton.setDisabled(noSelection);
		this.detailButton.setDisabled(noSelection);
	},

	/**
	 * Handler function will be called when user clicks on 'Remove' button,
	 * this will remove currently selected certificate from certificates list.
	 * @private
	 */
	onCertificateRemove : function()
	{
		this.publickeyGrid.removeCertificate();
	},

	/**
	 * Handler function will be called when user clicks on 'Details' button,
	 * this will open the details dialog.
	 * @private
	 */
	onDetailButton : function()
	{
		this.publickeyGrid.showDetails();
	},

	/**
	 * Function will be used to reload data in the {@link Zarafa.plugins.smime.data.SmimeCertificateStore SmimeCertificateStore}
	 */
	discardChanges : function()
	{
		this.store.load();
	},

	/**
	 * Function will be used to save changes in the {@link Zarafa.plugins.smime.data.SmimeCertificateStore SmimeCertificateStore}
	 */
	saveChanges : function()
	{
		this.store.save();
	}
});

Ext.reg('smime.publiccertificatespanel', Zarafa.plugins.smime.settings.SettingsPublickeyPanel);
