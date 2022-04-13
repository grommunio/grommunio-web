Ext.namespace('Zarafa.plugins.smime.settings');

/**
 * @class Zarafa.plugins.smime.settings.PublickeyGrid
 * @extends Ext.grid.GridPanel
 * @xtype smime.publickeygrid
 *
 * {@link Zarafa.plugins.smime.settings.PublickeyGrid PublickeyGrid} will be used to display
 * public certificates of the current user.
 */
Zarafa.plugins.smime.settings.PublickeyGrid = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!config.store) {
			config.store = new Zarafa.plugins.smime.data.SmimeCertificateStore();
		}
	
		Ext.applyIf(config, {
			xtype : 'smime.publickeygrid',
			store : config.store,
			viewConfig : {
				forceFit : true,
                deferEmptyText : false,
				emptyText : '<div class=\'emptytext\'>' + _('No certificates imported, please upload your private certificate', 'plugin_smime') + '</div>'
			},
			loadMask : this.initLoadMask(),
			columns : this.initColumnModel(),
			selModel : this.initSelectionModel(),
			listeners : {
				viewready : this.onViewReady,
				scope : this
			}
		});

		Zarafa.plugins.smime.settings.PublickeyGrid.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the grid panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.smime.settings.PublickeyGrid.superclass.initEvents.call(this);

		// select first certificate when store has finished loading
		this.mon(this.store, 'load', this.onViewReady, this, {single : true});
	},

	/**
	 * Creates a column model object, used in {@link #colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return [{
			dataIndex : 'email',
			header : _('Email', 'plugin_smime'),
			sortable: true,
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'validfrom',
			sortable: true,
			header : _('Valid from', 'plugin_smime'),
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'validto',
			sortable: true,
			header : _('Expires', 'plugin_smime'),
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'type',
			sortable: true,
			header : _('Type', 'plugin_smime'),
			renderer : Ext.util.Format.htmlEncode
		}];
	},

	/**
	 * Creates a selection model object, used in {@link #selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect : true
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 *
	 * @return {Object} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading certificates', 'plugin_smime') + '...'
		};
	},

	/**
	 * Event handler which is fired when the gridPanel is ready. This will automatically
	 * select the first row in the grid.
	 * @private
	 */
	onViewReady : function()
	{
		this.getSelectionModel().selectFirstRow();
	},



	/**
	 * Function will be called to remove a certificate.
	 */
	removeCertificate : function()
	{
		var selectionModel = this.getSelectionModel();
		var certificate = selectionModel.getSelected();

		if(!certificate) {
			Ext.MessageBox.show({
				title: _('S/MIME Plugin', 'plugin_smime'),
				msg: _('Please select a certificate.', 'plugin_smime'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.INFO
			});
			return;
		} else if(certificate.get('type') === 'private') {
			Ext.MessageBox.show({
				title: _('S/MIME Plugin', 'plugin_smime'),
				msg :_('Do you really want to remove your private certificate? If you remove your certificate you will not be able to sign or decrypt S/MIME emails.', 'plugin_smime'),
				icon: Ext.MessageBox.WARNING,
				fn: this.onRemoveCertificate,
				scope: this,
				buttons: Ext.MessageBox.YESNO
			});
		} else {
			this.onRemoveCertificateHelper();
		}
	},	
	
	/**
	 * Handler for removing private certificate dialog
	 * @param {String} btn 
	 */
	onRemoveCertificate : function(btn)
	{
		if(btn === 'yes') {
			this.onRemoveCertificateHelper();
		}
	},

	/**
	 * Helper function to avoid code duplication in onRemoveCertificate and removeCertificate
	 */
	onRemoveCertificateHelper : function()
	{
		var selectionModel = this.getSelectionModel();
		var certificate = selectionModel.getSelected();
		// before removing record we should select next available record,
		// because deleting record will remove selection
		if (selectionModel.hasNext()) {
			selectionModel.selectNext();
		} else if (selectionModel.hasPrevious()) {
			selectionModel.selectPrevious();
		}

		this.store.remove(certificate);
	},

	/**
	 * Function will be called to show details of a certificate
	 */
	showDetails : function()
	{
		var selectionModel = this.getSelectionModel();
		var certificate = selectionModel.getSelected();
		if(Ext.isDefined(certificate)) {
			// TODO: use ExtJS form?
			
			var text = "Email: " + certificate.get('email') + "</br>" +
				"Serial: " + certificate.get('serial') + "</br>" +
				"Issued by: " + certificate.get('issued_by') + "</br>" +
				"Issued to: " + certificate.get('issued_to') + "</br>" +
				"SHA1 Fingerprint: " + certificate.get('fingerprint_sha1') + "</br>" +
				"MD5 Fingerprint: " + certificate.get('fingerprint_md5') + "</br>";
			Ext.Msg.alert(_('Certificate details', 'plugin_smime'), text);
		}
	}

});

Ext.reg('smime.publickeygrid', Zarafa.plugins.smime.settings.PublickeyGrid);
