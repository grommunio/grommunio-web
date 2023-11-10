Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordDetailsPanel = Ext.extend(Ext.form.FormPanel, {

	defaultPreviewImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTIuMjIgMi4yMmEuNzUuNzUgMCAwIDAtLjA3My45NzZsLjA3My4wODQgNC4wMzQgNC4wMzVhOS45ODYgOS45ODYgMCAwIDAtMy45NTUgNS43NS43NS43NSAwIDAgMCAxLjQ1NS4zNjQgOC40OSA4LjQ5IDAgMCAxIDMuNTgtNS4wMzRsMS44MSAxLjgxQTQgNCAwIDAgMCAxNC44IDE1Ljg2bDUuOTE5IDUuOTJhLjc1Ljc1IDAgMCAwIDEuMTMzLS45NzdsLS4wNzMtLjA4NC02LjExMy02LjExNC4wMDEtLjAwMi0xLjItMS4xOTgtMi44Ny0yLjg3aC4wMDJsLTIuODgtMi44NzcuMDAxLS4wMDItMS4xMzMtMS4xM0wzLjI4IDIuMjJhLjc1Ljc1IDAgMCAwLTEuMDYgMFptNy45ODQgOS4wNDUgMy41MzUgMy41MzZhMi41IDIuNSAwIDAgMS0zLjUzNS0zLjUzNVpNMTIgNS41Yy0xIDAtMS45Ny4xNDgtMi44ODkuNDI1bDEuMjM3IDEuMjM2YTguNTAzIDguNTAzIDAgMCAxIDkuODk5IDYuMjcyLjc1Ljc1IDAgMCAwIDEuNDU1LS4zNjNBMTAuMDAzIDEwLjAwMyAwIDAgMCAxMiA1LjVabS4xOTUgMy41MSAzLjgwMSAzLjhhNC4wMDMgNC4wMDMgMCAwIDAtMy44MDEtMy44WiIvPjwvc3ZnPg==',

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
		// initEvents function or by 'previewrecordchange' which was fired
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
        xtype: 'fieldset',
        title: _('File information'),
        border: false,
        defaults: {
            anchor: '100%',
            readOnly: true
        },
        items: [{
            xtype: 'container',
            layout: 'hbox',
            items: [{
                xtype: 'label',
                text: _('Filename'),
                width: 125
            }, {
                xtype: 'textfield',
                ref: '../../filename',
                value: "unknown",
                flex: 1
            }]
        }, {
            xtype: 'container',
            ref: '../filesizeContainer',
            layout: 'hbox',
            items: [{
                xtype: 'label',
                text: _('Filesize'),
                width: 125
            }, {
                xtype: 'textfield',
                ref: '../../filesize',
                value: "unknown",
                flex: 1
            }]
        }, {
            xtype: 'container',
            layout: 'hbox',
            items: [{
                xtype: 'label',
                text: _('Last modified'),
                width: 125
            }, {
                xtype: 'textfield',
                ref: '../../lastmodified',
                value: "unknown",
                flex: 1
            }]
        }, {
            xtype: 'container',
            layout: 'hbox',
            items: [{
                xtype: 'label',
                text: _('Type'),
                width: 125
            }, {
                xtype: 'textfield',
                ref: '../../type',
                value: "unknown",
                flex: 1
            }]
        }, {
	    xtype: 'container',
	    ref: '../sharedContainer',
	    layout: 'hbox',
	    items: [{
		xtype: 'label',
		text: _('Is shared'),
		width: 125
	    }, {
		xtype: 'checkbox',
		ref: '../../shared',
		flex: 1,
		inputValue: _('Yes'),
		uncheckedValue: _('No'),
		readOnly: true,
		checked: ("unknown" === _("Yes")) ? true : false
	    }]
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
			title: _('File preview'),
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
		var cssNone = "width: 20%; position: relative; top: 50%; transform: translate(-50%) translateY(-50%); left: 50%;";
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
					frameborder: 'none',
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
						_('Your browser does not support previewing of audio files!')
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
						_('Your browser does not support previewing of video files!')
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
				autoEl: {tag: 'img', src: this.defaultPreviewImage, style: cssNone}
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
		this.filesizeContainer.setVisible(recordType);
		if (recordType) {
			this.filesize.setValue(Zarafa.plugins.files.data.Utils.Format.fileSize(record.get('message_size')));
		}

		var lastModifiedDate = Ext.util.Format.date(new Date(record.get('lastmodified')), _('d.m.Y G:i'));
		this.lastmodified.setValue(lastModifiedDate);

		var type = _('Folder');
		if (recordType) {
			var extension = this.getExtension(record.get('filename'));
			type = String.format(_('File ({0})'), extension);
		}
		this.type.setValue(type);

		var supportSharing = record.getAccount().supportsFeature(Zarafa.plugins.files.data.AccountRecordFeature.SHARING);
		this.sharedContainer.setVisible(supportSharing);
		if (supportSharing) {
			this.shared.setValue(record.get("isshared") ? _('Yes') : _('No'));
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
