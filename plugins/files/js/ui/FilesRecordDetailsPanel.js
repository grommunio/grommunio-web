Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordDetailsPanel = Ext.extend(Ext.form.FormPanel, {

	defaultPreviewImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjIuODc5IiBoZWlnaHQ9Ijc5LjY5OSI+PHBhdGggZD0iTS45NTUgMzcuMzI2YTk0LjYgOTQuNiAwIDAgMSA5LjE1MS05LjYyNUMyNC40NDEgMTQuNjU0IDQxLjQ2MiA3LjY4NCA1OS4wMSA3LjMzNGM2LjU2MS0uMTMxIDEzLjE4NS42NjUgMTkuNzU3IDIuNDE2bC01LjkwNCA1LjkwNGMtNC41ODEtLjkxNi05LjE2OC0xLjMyNC0xMy43MTQtMS4yMzMtMTUuODExLjMxNi0zMS4yMTUgNi42NTctNDQuMjYyIDE4LjUzM2gwYy0yLjMyNCAyLjExNS00LjU2MiA0LjM5LTYuNzAyIDYuODIgNC4wNzEgNC43MjEgOC42IDguODAxIDEzLjQ1MiAxMi4yMjcgMi45ODggMi4xMTEgNi4wOTcgMy45NzMgOS4yOTYgNS41ODZsLTUuMjYyIDUuMjYyYy0yLjc4Mi0xLjUwNC01LjQ5NC0zLjE4NC04LjEyLTUuMDM5LTYuMTQzLTQuMzM4LTExLjgxMy05LjYyOS0xNi43OC0xNS44NS0xLjEwOS0xLjM5Ny0uOTk5LTMuMzcuMTg0LTQuNjM0aDAgMHpNOTYuMDMgMGw1Ljg5MyA1Ljg5My03My44MDQgNzMuODA2LTUuODk0LTUuODk1TDk2LjAzIDBoMHptMS42OSAxNy42MDljNC40MjMgMi41MjcgOC43NjcgNS41MjggMTIuOTk0IDkuMDE0IDMuODc3IDMuMTk2IDcuNjM1IDYuNzczIDExLjI0IDEwLjczNWEzLjU1IDMuNTUgMCAwIDEgLjIyNiA0LjUwN2MtNC4xMzEgNS44MzQtOC44NzYgMTAuODE2LTE0LjA2OSAxNC45NjMtMTIuOTkyIDEwLjM3MS0yOC43NzMgMTUuNDc3LTQ0Ljc1OSAxNS41NDktNi4xMTQuMDI3LTkuNzk4LTMuMTQxLTE1LjgyNS00LjU3NmwzLjU0NS0zLjU0M2M0LjA2NS43MDUgOC4xNjcgMS4wNDkgMTIuMjUyIDEuMDMxIDE0LjQyMS0uMDY0IDI4LjY1My00LjY2OCA0MC4zNjYtMTQuMDIgMy45OTgtMy4xOTEgNy43MDYtNi45MzkgMTEuMDI4LTExLjI1NC0yLjc4Ny0yLjkwNS01LjYyNy01LjU0My04LjUwOC03LjkxOC00LjQ1NS0zLjY3My05LjA0Mi02Ljc1OS0xMy43MDctOS4yNzNsNS4yMTctNS4yMTVoMHptLTM2LjI4LjUzNGEyMS42OCAyMS42OCAwIDAgMSA3LjU3NiAxLjM1OWwtNS42ODkgNS42ODljLS42MTktLjA3OS0xLjI0OC0uMTE5LTEuODg2LS4xMTlBMTQuNzMgMTQuNzMgMCAwIDAgNTAuOTkyIDI5LjRjLTIuNjc0IDIuNjc0LTQuMzI4IDYuMzY5LTQuMzI4IDEwLjQ1IDAgLjYzOS4wNCAxLjI2OC4xMTkgMS44ODVsLTUuNjg5IDUuNjkxYy0uODc5LTIuMzU5LTEuMzU5LTQuOTEyLTEuMzU5LTcuNTc2YTIxLjY0IDIxLjY0IDAgMCAxIDYuMzU4LTE1LjM0OWMzLjkyNy0zLjkyOSA5LjM1My02LjM1OCAxNS4zNDctNi4zNThoMHptMjAuNjczIDE1LjA3M2EyMS43IDIxLjcgMCAwIDEgMS4wMzIgNi42MzRBMjEuNjQgMjEuNjQgMCAwIDEgNjEuNDQgNjEuNTU1Yy0yLjMxMyAwLTQuNTQyLS4zNjEtNi42MzMtMS4wMzNsNS45MTQtNS45MTRjLjIzOC4wMTIuNDc4LjAxOC43MTkuMDE4IDQuMDgxIDAgNy43NzUtMS42NTIgMTAuNDQ5LTQuMzI2YTE0LjczIDE0LjczIDAgMCAwIDQuMzI4LTEwLjQ0OWMwLS4yNDEtLjAwNi0uNDgtLjAxOC0uNzJsNS45MTQtNS45MTVoMHoiLz48L3N2Zz4=',

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
			title   : _('File information'),
			height  : 170,
			width   : 300,
			defaults: {
				anchor: '-3'
			},
			items   : [{
				xtype     : 'textfield',
				fieldLabel: _('Filename'),
				ref       : '../filename',
				value     : "unknown",
				readOnly  : true
			},
				{
					xtype     : 'textfield',
					fieldLabel: _('Filesize'),
					ref       : '../filesize',
					value     : "unknown",
					readOnly  : true
				},
				{
					xtype     : 'textfield',
					fieldLabel: _('Last modified'),
					ref       : '../lastmodified',
					value     : "unknown",
					readOnly  : true
				},
				{
					xtype     : 'textfield',
					fieldLabel: _('Type'),
					ref       : '../type',
					value     : "unknown",
					readOnly  : true
				},
				{
					xtype     : 'textfield',
					fieldLabel: _('Is shared'),
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
		var cssNone = "width: 20%; position: relative; top: 50%; transform: translate(-50%) translateY(-50%); left: 50%; opacity: 0.5;";
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
		this.filesize.setVisible(recordType);
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
		this.shared.setVisible(supportSharing);
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
