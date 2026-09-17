/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

Grommunio.plugins.files.ui.FilesRecordDetailsPanel = Ext.extend(Ext.form.FormPanel, {

	defaultPreviewImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTIuMjIgMi4yMmEuNzUuNzUgMCAwIDAtLjA3My45NzZsLjA3My4wODQgNC4wMzQgNC4wMzVhOS45ODYgOS45ODYgMCAwIDAtMy45NTUgNS43NS43NS43NSAwIDAgMCAxLjQ1NS4zNjQgOC40OSA4LjQ5IDAgMCAxIDMuNTgtNS4wMzRsMS44MSAxLjgxQTQgNCAwIDAgMCAxNC44IDE1Ljg2bDUuOTE5IDUuOTJhLjc1Ljc1IDAgMCAwIDEuMTMzLS45NzdsLS4wNzMtLjA4NC02LjExMy02LjExNC4wMDEtLjAwMi0xLjItMS4xOTgtMi44Ny0yLjg3aC4wMDJsLTIuODgtMi44NzcuMDAxLS4wMDItMS4xMzMtMS4xM0wzLjI4IDIuMjJhLjc1Ljc1IDAgMCAwLTEuMDYgMFptNy45ODQgOS4wNDUgMy41MzUgMy41MzZhMi41IDIuNSAwIDAgMS0zLjUzNS0zLjUzNVpNMTIgNS41Yy0xIDAtMS45Ny4xNDgtMi44ODkuNDI1bDEuMjM3IDEuMjM2YTguNTAzIDguNTAzIDAgMCAxIDkuODk5IDYuMjcyLjc1Ljc1IDAgMCAwIDEuNDU1LS4zNjNBMTAuMDAzIDEwLjAwMyAwIDAgMCAxMiA1LjVabS4xOTUgMy41MSAzLjgwMSAzLjhhNC4wMDMgNC4wMDMgMCAwIDAtMy44MDEtMy44WiIvPjwvc3ZnPg==',

	record : undefined,

	constructor: function (config) {
		config = config || {};
		var context = Grommunio.plugins.files.data.ComponentBox.getContext();
		var viewMode = context.getCurrentViewMode();

		var layout = {
			type : 'vbox',
			align: 'stretch',
			pack : 'start'
		};
		if(viewMode === Grommunio.plugins.files.data.ViewModes.BOTTOM_PREVIEW) {
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
			bodyStyle  : 'padding: 0;',
			items      : [
				this.fileHeader(),
				this.fieldSetFilePreview()
			]
		});
		// FixME : Listener is used when user use info button
		// in context menu. we can avoid this code by either using
		// initEvents function or by 'previewrecordchange' which was fired
		// from setPreviewRecord function of Grommunio.core.ContextModel
		if (Ext.isDefined(config.record)) {
			config = Ext.applyIf(config, {
				listeners: {
					afterlayout: function (cmp) {
						this.update(this.record);
					}
				}
			});
		}

		Grommunio.plugins.files.ui.FilesRecordDetailsPanel.superclass.constructor.call(this, config);
	},

	refresh: function () {
		this.removeAll();
		this.add(this.fileHeader());
		this.add(this.fieldSetFilePreview());
	},

	/**
	 * The name of the file with a line of its properties underneath. The grid
	 * already carries the same values in its columns, so they are shown as one
	 * compact line rather than as a form.
	 * @return {Object} The configuration of the header
	 * @private
	 */
	fileHeader: function () {
		return {
			xtype: 'box',
			ref: 'fileHeader',
			cls: 'files-preview-header',
			// both lines are kept to one line each, so this is the whole of it
			height: 56,
			autoEl: {
				tag: 'div',
				cn: [
					{ tag: 'div', cls: 'files-preview-name' },
					{ tag: 'div', cls: 'files-preview-meta' }
				]
			}
		};
	},

	fieldSetFilePreview: function () {
		return {
			xtype: 'panel',
			ref  : 'filepreview',
			cls  : 'files-preview-area',
			border: false,
			flex : 1,
			layout: 'fit',
			items: [this.placeholder()]
		};
	},

	/**
	 * The image shown instead of a preview, for a file grommunio Web cannot
	 * render and for a folder.
	 *
	 * @return {Object} The configuration of the placeholder component
	 * @private
	 */
	placeholder: function () {
		// A box, not a plain component: the fit layout of the preview area
		// sizes whatever it holds.
		return {
			xtype : 'box',
			cls   : 'files-preview-placeholder',
			autoEl: {tag: 'div', cn: [{tag: 'img', src: this.defaultPreviewImage}]}
		};
	},

	/**
	 * Show the file in the preview area, using the same previewer that shows
	 * an attachment of a mail. A file of a format grommunio Web cannot render,
	 * and a folder, get the placeholder image instead.
	 *
	 * @param {Grommunio.plugins.files.data.FilesRecord} record The selected file
	 * @param {Boolean} previewable Whether the previewer can render it
	 */
	setPreviewPanel: function (record, previewable) {
		var current = this.filepreview.get(0);
		var viewer = current instanceof Grommunio.common.previewer.ui.ViewerPanel;

		if (previewable) {
			// Reuse the frame that is already there, so that switching
			// between files does not rebuild it every time.
			if (viewer) {
				current.setRecord(record);
			} else {
				this.replacePreview({
					xtype : 'grommunio.viewerpanel',
					record: record
				});
			}
		} else if (viewer || !current) {
			this.replacePreview(this.placeholder());
		}
	},

	/**
	 * Put a component into the preview area, in place of the one shown now.
	 *
	 * @param {Object} component The configuration of the new component
	 * @private
	 */
	replacePreview: function (component) {
		this.filepreview.removeAll(true);
		this.filepreview.add(component);
		this.filepreview.doLayout();
	},

	update: function (record)
	{
		var isFile = record.get('type') == Grommunio.plugins.files.data.FileTypes.FILE;
		var meta = [isFile ? String.format(_('File ({0})'), this.getExtension(record.get('filename'))) : _('Folder')];

		if (isFile) {
			meta.push(Grommunio.plugins.files.data.Utils.Format.fileSize(record.get('message_size')));
		}
		meta.push(Ext.util.Format.date(new Date(record.get('lastmodified')), _('d.m.Y G:i')));
		if (record.getAccount().supportsFeature(Grommunio.plugins.files.data.AccountRecordFeature.SHARING) &&
			record.get('isshared')) {
			meta.push(_('Is shared'));
		}

		if (this.fileHeader && this.fileHeader.el) {
			var name = record.get('filename');
			this.fileHeader.el.child('.files-preview-name').update(Ext.util.Format.htmlEncode(name)).set({ title: name });
			this.fileHeader.el.child('.files-preview-meta').update(Ext.util.Format.htmlEncode(meta.join(' · ')));
		}

		this.setPreviewPanel(record, isFile &&
			Grommunio.common.Actions.isFilePreviewerEnabled() &&
			Grommunio.common.previewer.data.Formats.isSupported(record.get('filename')));
	},

	onRender: function (ct, position) {
		Grommunio.plugins.files.ui.FilesRecordDetailsPanel.superclass.onRender.call(this, ct, position);
		this.wrap = this.el.wrap({cls: 'preview-body'});
		this.resizeEl = this.positionEl = this.wrap;
	},

	getExtension: function (filename) {
		var i = filename.lastIndexOf('.');
		return (i < 0) ? '' : filename.substr(i);
	}
});

Ext.reg('filesplugin.filesrecorddetailspanel', Grommunio.plugins.files.ui.FilesRecordDetailsPanel);
