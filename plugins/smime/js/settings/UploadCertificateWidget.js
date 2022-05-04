Ext.namespace('Zarafa.plugins.smime.settings');
/*
 * #dependsFile plugins/smime/js/data/SmimeAttachmentStore.js
 */

/**
 * @class Zarafa.plugins.smime.settings.UploadCertificateWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype smime.uploadcertificatewidget
 *
 * The {@link Zarafa.plugins.settings.UploadCertificateWidget widget} for importing S/MIME certificates (public/private)
 */
Zarafa.plugins.smime.settings.UploadCertificateWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @cfg {Object} form used to temprorarly store the value of form in 
	 * {@link #selectCertificateCallback} for {@link #uploadCertificate}.
	 */
	form: undefined,

	/**
	 * @cfg {Object} files used to temprorarly store the value of form in 
	 * {@link #selectCertificateCallback for {@link #uploadCertificate}.
	 */
	files: undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record.
	 */
	record : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config) {
		config = config || {};

		if(!config.store) {
			config.store = new Zarafa.plugins.smime.data.SmimeCertificateStore();
		}

		Ext.applyIf(config, {
			title	: _('Upload your certificate'),
			layout : 'form',
			xtype : 'smime.uploadcertificatewidget',
			items :[{
				xtype: 'displayfield',
				hideLabel : true,
				value : _('Below you can upload your private certificate in PKCS#12 format. grommunio Web only accepts certificates which are valid and only stores one private certificate on the server.')
			},{
				xtype : 'button',
				text : _('Select'),
				defaultValue : _('Select'),
				iconCls : 'icon_smime_settings',
				fieldLabel : _('Private certificate'),
				ref : 'certificate',
				width: 84,
				handler : this.selectCertificate,
				scope : this
			},{
				xtype : 'textfield',
				inputType: 'password',
				fieldLabel : _('Certificate passphrase'),
				width: 200,
				ref : 'passphrase',
				scope : this
			},{
				xtype : 'button',
				text : _('Upload'),
				width : 84,
				handler : this.uploadCertificate,
				scope : this
			}]
		});

		Zarafa.plugins.smime.settings.UploadCertificateWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Handler for {Ext.button} opens a attachment dialog where the user can select a certificate.
	 * Registers a callback function which receives the files and form.
	 */
	selectCertificate : function() 
	{
		this.record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME, {});

		var attachComponent = new Zarafa.common.attachment.ui.UploadAttachmentComponent({
			callback : this.selectCertificateCallback,
			scope : this
		});

		attachComponent.openAttachmentDialog();
	},

	/**
	 * Handler for {Ext.button} 'upload', uploads certificate if a passphrase is filled in
	 * and certificate is selected.
	 */
	uploadCertificate : function()
	{
		if(Ext.isEmpty(this.passphrase.getValue())) {
			Ext.MessageBox.show({
				title: _('S/MIME Plugin'),
                                msg: _('You must fill in the certificate passphrase to upload your certificate.'),
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.INFO
                        });
		} else if(Ext.isEmpty(this.files)) {
			Ext.MessageBox.show({
                                title: _('S/MIME Plugin'),
                                msg: _('You must first select a valid private certificate in PKCS#12 format.'),
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.INFO
                        });
		} else {
			var attachmentStore = this.record.getAttachmentStore();
			this.mon(attachmentStore, 'update', this.onUpdate, this);
			var param = {sourcetype : 'certificate', passphrase: this.passphrase.getValue() };
			attachmentStore.uploadFiles(this.files, this.form, true, param);
		}
	},

	/**
	 * Callback function for {@link Zarafa.plugins.smime.settingssmimewidget.selectCertificate}.
	 * Function is used to set the files and form for {@link Zarafa.plugins.smime.settingsmimewidget.uploadCertificate}
	 * It also sets the certificate upload button's text to the selected filename.
	 * 
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Object} form the form is contains {@link Ext.form.BasicForm bacisform} info.
	 */
	selectCertificateCallback : function(files, form)
	{
		this.certificate.setText(files[0].name);
		this.files = files;
		this.form = form;
	},

	/**
	 * Function for update event of {@link Zarafa.core.data.IPMAttachmentStore}.
	 * Displays the information which is stored in the {Ext.data.Record} fields called
	 * cert_warning and cert_message.
	 *
	 * @param {Ext.data.Store} store The {Ext.data.Store} where the record is stored.
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 */
	onUpdate : function(store, record)
	{
		if(record.get('cert')) {
			container.getNotifier().notify('info.saved', _('S/MIME Message'), record.get('cert_warning'));
			this.store.load();
			this.passphrase.reset();
			this.certificate.setText(this.certificate.defaultValue);
		} else {
			container.getNotifier().notify('error.connection', _('S/MIME Message'), record.get('cert_warning'));
		} 

	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is being used to reset the textfield and button.
	 */
	update : function()
	{
		this.passphrase.reset();
		this.certificate.setText(this.certificate.defaultValue);
	}	
});

Ext.reg('smime.uploadcertificatewidget', Zarafa.plugins.smime.settings.UploadCertificateWidget);
