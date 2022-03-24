Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordDetailsPanel = Ext.extend(Ext.form.FormPanel, {

	defaultPreviewImage: 'plugins/files/resources/icons/no-preview.jpg',

	record : undefined,

	constructor: function (config) {
		config = config || {};
		var context = Zarafa.plugins.files.data.ComponentBox.getContext();
		var viewMode = context.getCurrentViewMode();

		var layout = {
			type : 'vbox',
			align: 'stretch',
			pack : 'start'
		};
		if(viewMode === Zarafa.plugins.files.data.ViewModes.BOTTOM_PREVIEW) {
			Ext.apply(layout, {
				type : 'hbox'
			});
		}

		config = Ext.applyIf(config, {
			xtype      : 'filesplugin.filesrecorddetailspanel',
			ref        : '../fileinfo',
			autoDestroy: true,
			layout     : layout,
			border     : false,
			items      : [
				this.fieldSetFileInfo(),
				this.fieldSetFilePreview()
			]
		});
		// FixME : Listener is used when user use info button
		// in context menu. we can avoid this code by either using
		// initEvents function or by 'previewrecordchange' which was fire
		// from setPreviewRecord function of Zarafa.core.ContextModel
		if (Ext.isDefined(config.record)) {
			config = Ext.applyIf(config, {
				listeners: {
					afterlayout: function (cmp) {
						this.update(this.record);
					}
				}
			});
		}

		Zarafa.plugins.files.ui.FilesRecordDetailsPanel.superclass.constructor.call(this, config);
	},

	refresh: function () {
		this.removeAll();
		this.add(this.fieldSetFileInfo());
		this.add(this.fieldSetFilePreview());
	},

	fieldSetFileInfo: function () {
		return {
			xtype   : 'fieldset',
			title   : dgettext('plugin_files', 'File information'),
			height  : 150,
			width   : 300,
			defaults: {
				anchor: '-3'
			},
			items   : [{
				xtype     : 'textfield',
				fieldLabel: dgettext('plugin_files', 'Filename'),
				ref       : '../filename',
				value     : "unknown",
				readOnly  : true
			},
				{
					xtype     : 'textfield',
					fieldLabel: dgettext('plugin_files', 'Filesize'),
					ref       : '../filesize',
					value     : "unknown",
					readOnly  : true
				},
				{
					xtype     : 'textfield',
					fieldLabel: dgettext('plugin_files', 'Last modified'),
					ref       : '../lastmodified',
					value     : "unknown",
					readOnly  : true
				},
				{
					xtype     : 'textfield',
					fieldLabel: dgettext('plugin_files', 'Type'),
					ref       : '../type',
					value     : "unknown",
					readOnly  : true
				},
				{
					xtype     : 'textfield',
					fieldLabel: dgettext('plugin_files', 'Is shared'),
					ref       : '../shared',
					hidden    : true,
					value     : "unknown",
					readOnly  : true
				}]
		};
	},

	fieldSetFilePreview: function () {
		var context = Zarafa.plugins.files.data.ComponentBox.getContext();
		var viewMode = context.getCurrentViewMode();

		var css = "width: 100%;";
		switch (viewMode) {
			case Zarafa.plugins.files.data.ViewModes.RIGHT_PREVIEW:
				css = "width: 100%;";
				break;
			case Zarafa.plugins.files.data.ViewModes.BOTTOM_PREVIEW:
				css = "height: 100%;";
				break;
			default:
				break;
		}

		return {
			xtype: 'fieldset',
			title: dgettext('plugin_files', 'File preview'),
			ref  : 'filepreview',
			flex : 1,
			autoScroll: true,

			defaultType: 'textfield',
			items      : [{
				xtype : 'component',
				id    : 'previewimage',
				autoEl: {tag: 'img', src: this.defaultPreviewImage, style: css}
			}]
		};
	},

	setPreviewPanel: function (record, extension) {
		var context = Zarafa.plugins.files.data.ComponentBox.getContext();
		var viewMode = context.getCurrentViewMode();
		var fileviewerEnabled = Ext.isDefined(container.getPluginByName('filepreviewer')) ? true: false;
		var pdfEnabled = Ext.isDefined(container.getPluginByName('pdfbox')) ? true: false;
		var odfEnabled = Ext.isDefined(container.getPluginByName('webodf')) ? true: false;

		var css = "width: 100%;";
		switch (viewMode) {
			case Zarafa.plugins.files.data.ViewModes.RIGHT_PREVIEW:
				css = "width: 100%;";
				break;
			case Zarafa.plugins.files.data.ViewModes.BOTTOM_PREVIEW:
				css = "height: 100%;";
				break;
			default:
				break;
		}

		var component = {};

		if (!fileviewerEnabled && !Ext.isEmpty(extension) && (/\.(gif|jpg|jpeg|tiff|png|bmp)$/i).test(extension)) {
			component = {
				xtype : 'component',
				autoEl: {tag: 'img', src: Zarafa.plugins.files.data.Actions.getDownloadLink(record), style: css}
			}
		} else if (fileviewerEnabled && !Ext.isEmpty(extension) && (new RegExp(container.getSettingsModel().get("zarafa/v1/plugins/filepreviewer/supported_filetypes"), "i")).test(extension)) {
			component = {
				xtype   : 'filepreviewer.viewerpanel',
				record: record,
				defaultScale: 1,
				autoResize: this.filepreview, // autoresize on this element
				height: this.filepreview.getInnerHeight()
			}
		} else if (!fileviewerEnabled && pdfEnabled && !Ext.isEmpty(extension) && (/\.(pdf)$/i).test(extension)) {
			component = {
				xtype   : 'filesplugin.pdfjspanel',
				src     : Zarafa.plugins.files.data.Actions.getDownloadLink(record),
				title: record.get('filename')
			}
		} else if (!fileviewerEnabled && !pdfEnabled && !Ext.isEmpty(extension) && (/\.(pdf)$/i).test(extension)) { // if the pdfjs plugin is not available
			// show the pdf file in an iframe
			component = {
				xtype  : 'component',
				autoEl : {
					tag: 'iframe',
					width: '98%',
					height: '98%',
					border: 'none',
					seamless: '',
					src: Zarafa.plugins.files.data.Actions.getDownloadLink(record)
				}
			}
		} else if (!Ext.isEmpty(extension) && (/\.(txt|html|php|js|c|cpp|h|java|sh|bat|log|cfg|conf|tex|py|pl)$/i).test(extension)) {
			component = {
				xtype    : 'textarea',
				hideLabel: true,
				readOnly : true,
				anchor   : '0, 0',
				listeners: {
					'afterrender': function () {
						Ext.Ajax.request({
							method : 'GET',
							url    : Zarafa.plugins.files.data.Actions.getDownloadLink(record),
							success: function (result, request) {
								var responsetext = result.responseText;

								this.setRawValue(responsetext);
							},
							scope  : this
						});
					}
				}
			}
		} else if (!Ext.isEmpty(extension) && (/\.(mp3|wav)$/i).test(extension)) {
			var audioType = '';
			switch(extension.toLowerCase()) {
				case '.wav':
					audioType = 'audio/wav';
					break;
				default:
					audioType = 'audio/mpeg';
			}

			component = {
				xtype : 'component',
				autoEl: {
					tag: 'audio',
					style: css,
					controls: 'controls',
					cn    : [
						{
							tag: 'source',
							src: Zarafa.plugins.files.data.Actions.getDownloadLink(record),
							type: audioType
						},
						dgettext('plugin_files', 'Your browser does not support previewing of audio files!')
					]
				}
			}
		} else if (!Ext.isEmpty(extension) && (/\.(mp4|ogg|webm)$/i).test(extension)) {
			var videoType = '';
			switch(extension.toLowerCase()) {
				case '.ogg':
					videoType = 'video/ogg';
					break;
				case '.webm':
					videoType = 'video/webm';
					break;
				default:
					videoType = 'audio/mp4';
			}

			component = {
				xtype : 'component',
				autoEl: {
					tag: 'video',
					style: css + 'height: auto;',
					poster: 'plugins/files/resources/images/preview/video_loader.gif',
					preload: 'metadata',
					controls: 'controls',
					cn    : [
						{
							tag: 'source',
							src: Zarafa.plugins.files.data.Actions.getDownloadLink(record),
							type: videoType
						},
						dgettext('plugin_files', 'Your browser does not support previewing of video files!')
					]
				}
			}
		} else if (odfEnabled && !Ext.isEmpty(extension) && (/\.(odp|odt|ods)$/i).test(extension)) {
			component = {
				xtype : 'filesplugin.webodfpanel',
				src   : Zarafa.plugins.files.data.Actions.getDownloadLink(record),
				title : record.get('filename')
			}
		} else {
			component = {
				xtype : 'component',
				autoEl: {tag: 'img', src: this.defaultPreviewImage, style: css}
			}
		}

		this.filepreview.removeAll(true);
		this.filepreview.add(component);
		this.filepreview.doLayout();
	},

	update: function (record)
	{
		this.filename.setValue(record.get('filename'));

		var recordType = record.get('type') == Zarafa.plugins.files.data.FileTypes.FILE;
		this.filesize.setVisible(recordType);
		if (recordType) {
			this.filesize.setValue(Zarafa.plugins.files.data.Utils.Format.fileSize(record.get('message_size')));
		}

		var lastModifiedDate = Ext.util.Format.date(new Date(record.get('lastmodified')), dgettext('plugin_files', 'd.m.Y G:i'));
		this.lastmodified.setValue(lastModifiedDate);

		var type = dgettext('plugin_files', 'Folder');
		if (recordType) {
			var extension = this.getExtension(record.get('filename'));
			type = String.format(dgettext('plugin_files', 'File ({0})'), extension);
		}
		this.type.setValue(type);

		var supportSharing = record.getAccount().supportsFeature(Zarafa.plugins.files.data.AccountRecordFeature.SHARING);
		this.shared.setVisible(supportSharing);
		if (supportSharing) {
			this.shared.setValue(record.get("isshared") ? dgettext('plugin_files', 'Yes') : dgettext('plugin_files', 'No'));
		}
		this.setPreviewPanel(record, extension);
	},

	onRender: function (ct, position) {
		Zarafa.plugins.files.ui.FilesRecordDetailsPanel.superclass.onRender.call(this, ct, position);
		this.wrap = this.el.wrap({cls: 'preview-body'});
		this.resizeEl = this.positionEl = this.wrap;
	},

	getExtension: function (filename) {
		var i = filename.lastIndexOf('.');
		return (i < 0) ? '' : filename.substr(i);
	}
});

Ext.reg('filesplugin.filesrecorddetailspanel', Zarafa.plugins.files.ui.FilesRecordDetailsPanel);
