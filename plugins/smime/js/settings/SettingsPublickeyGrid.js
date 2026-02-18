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
				emptyText : '<div class=\'emptytext\'>' + _('No certificates imported, please upload your private certificate') + '</div>'
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
			header : _('Email'),
			sortable: true,
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'validfrom',
			sortable: true,
			header : _('Valid from'),
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'validto',
			sortable: true,
			header : _('Expires'),
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'type',
			sortable: true,
			header : _('Type'),
			renderer : Ext.util.Format.htmlEncode
		},{
			dataIndex : 'key_type',
			sortable: true,
			header : _('Key Type'),
			width : 90,
			renderer : function(value, meta, record) {
				var bits = record.get('key_bits');
				var curve = record.get('curve_name');
				if (value === 'EC' && curve) {
					return Ext.util.Format.htmlEncode(value + ' ' + curve);
				} else if (value === 'RSA' && bits > 0) {
					return Ext.util.Format.htmlEncode(value + ' ' + bits);
				}
				return Ext.util.Format.htmlEncode(value || 'unknown');
			}
		},{
			dataIndex : 'purpose',
			sortable: true,
			header : _('Purpose'),
			width : 80,
			renderer : function(value) {
				var labels = {
					'sign': _('Sign'),
					'encrypt': _('Encrypt'),
					'both': _('Sign & Encrypt'),
					'unknown': _('Unknown')
				};
				return Ext.util.Format.htmlEncode(labels[value] || value);
			}
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
			msg : _('Loading certificates') + '...'
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
				title: _('S/MIME Plugin'),
				msg: _('Please select a certificate.'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.INFO
			});
			return;
		} else if(certificate.get('type') === 'private') {
			Ext.MessageBox.show({
				title: _('S/MIME Plugin'),
				msg :_('Do you really want to remove your private certificate? If you remove your certificate you will not be able to sign or decrypt S/MIME emails.'),
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
		if (!Ext.isDefined(certificate))
			return;
		// TODO: use ExtJS form?
		
		var enc = Ext.util.Format.htmlEncode;
		var keyType = certificate.get('key_type') || 'unknown';
		var keyBits = certificate.get('key_bits') || 0;
		var curveName = certificate.get('curve_name') || '';
		var purpose = certificate.get('purpose') || 'both';

		var keyInfo = keyType;
		if (keyType === 'EC' && curveName) {
			keyInfo = keyType + ' ' + curveName;
		} else if (keyType === 'RSA' && keyBits > 0) {
			keyInfo = keyType + ' ' + keyBits + ' bits';
		}

		var purposeLabels = {
			'sign': _('Signing'),
			'encrypt': _('Encryption'),
			'both': _('Signing & Encryption'),
			'unknown': _('Unknown')
		};

		var text = _('Email') + ": " + enc(certificate.get('email')) + "<br>" +
			_('Serial') + ": " + enc(certificate.get('serial')) + "<br>" +
			_('Issued by') + ": " + enc(certificate.get('issued_by')) + "<br>" +
			_('Issued to') + ": " + enc(certificate.get('issued_to')) + "<br>" +
			_('Key Type') + ": " + enc(keyInfo) + "<br>" +
			_('Purpose') + ": " + enc(purposeLabels[purpose] || purpose) + "<br>" +
			_('SHA-256 Fingerprint') + ": " + enc(certificate.get('fingerprint_md5')) + "<br>" +
			_('SHA-1 Fingerprint') + ": " + enc(certificate.get('fingerprint_sha1')) + "<br>";

		if (keyType === 'RSA' && keyBits > 0 && keyBits < 2048) {
			text += "<br><b style='color:red'>" + _('Warning: RSA key size is below 2048 bits. Consider upgrading to a stronger certificate.') + "</b>";
		}

		Ext.Msg.alert(_('Certificate details'), text);
	}

});

Ext.reg('smime.publickeygrid', Zarafa.plugins.smime.settings.PublickeyGrid);
