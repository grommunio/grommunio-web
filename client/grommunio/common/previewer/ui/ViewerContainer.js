/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.previewer.ui');

/**
 * @class Grommunio.common.previewer.ui.ViewerContainer
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.viewercontainer
 *
 * The layer a document preview opens in: a dialog, a tab or a browser window,
 * holding a {@link Grommunio.common.previewer.ui.ViewerPanel previewer}.
 */
Grommunio.common.previewer.ui.ViewerContainer = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @cfg {String} src The frame source. This will be applied if no record is set.
	 */
	src: '',

	/**
	 * @cfg {String} title The panel title. This will be applied if no record is set.
	 * If a record was passed to this panel, the "name" or "filename" property of the record
	 * will be used.
	 */
	title: '',

	/**
	 * @cfg {Boolean|Ext.Component} autoResize This flag specifies if the panel gets automatically resized if the window size has changed.
	 * If it is set to true the panel will listen on the Window update event. Otherwise it will listen to the component
	 * resize event.
	 * Defaults to false.
	 */
	autoResize: false,

	/**
	 * @cfg {Number} defaultScale The default scaling of the panel.
	 * Defaults to 0.8 meaning 80% of the browser width.
	 */
	defaultScale: 0.8,

	/**
	 * @property {String} plainTitle The {@link #title} before it was HTML-encoded
	 * for the window header, for a tab caption which encodes on its own.
	 */
	plainTitle: undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config)
	{
		config = config || {};

		var record = config.record;
		this.title = config.title;
		if (Ext.isDefined(record)) {
			this.title = record.get('name') || record.get('filename');
		}

		var viewSize = Ext.getBody().getViewSize();

		this.plainTitle = this.title;

		Ext.applyIf(config, {
			xtype: 'grommunio.viewercontainer',
			layout: 'fit',
			title: Ext.util.Format.htmlEncode(this.title),
			height: viewSize.height * this.defaultScale,
			width: viewSize.width * this.defaultScale,
			defaultScale: config.defaultScale || this.defaultScale,
			autoResize: config.autoResize || false,
			items: [{
				xtype: 'grommunio.viewerpanel',
				ref: 'viewerPanel',
				record: record,
				src: config.src,
				title: this.plainTitle
			}]
		});

		Grommunio.common.previewer.ui.ViewerContainer.superclass.constructor.call(this, config);

		if (this.autoResize === true) {
			Ext.EventManager.onWindowResize(this.onResizeWindow, this);
		}
	},

	/**
	 * Removes the resize event listener. This function is called when the panel gets destroyed.
	 * @private
	 */
	onDestroy: function ()
	{
		if (this.autoResize === true) {
			Ext.EventManager.removeResizeListener(this.onResizeWindow, this);
		}

		Grommunio.common.previewer.ui.ViewerContainer.superclass.onDestroy.apply(this, arguments);
	},

	/**
	 * This functions resizes the panel to the given width. It will be called on the resize event if autoResize is enabled.
	 *
	 * @param {Number} adjWidth The window width.
	 * @param {Number} adjHeight The window height.
	 * @private
	 */
	onResizeWindow: function (adjWidth, adjHeight)
	{
		this.setWidth(adjWidth * this.defaultScale);
		this.setHeight(adjHeight * this.defaultScale);

		// center the panel
		if (this.ownerCt instanceof Ext.Window) {
			this.ownerCt.center();
		}
	}
});

Ext.reg('grommunio.viewercontainer', Grommunio.common.previewer.ui.ViewerContainer);
