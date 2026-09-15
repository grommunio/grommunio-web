/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.dialogs');

/**
 * @class Grommunio.common.attachment.dialogs.MixAttachItemPanel
 * @extends Ext.Panel
 * @xtype grommunio.brokenfilespanel
 *
 * Panel to list out the broken eml while import from PC-drive.
 */
Grommunio.hierarchy.dialogs.BrokenFilesPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Array} records The {@link Grommunio.core.data.IPMRecord record(s)} which are being
	 * used in this panel
	 */
	records: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.brokenfilespanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			items: this.getMixAttachComponents()
		});

		Grommunio.hierarchy.dialogs.BrokenFilesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Prepare all the components of warning dialog.
	 * @return {Array} Array containing all the required components
	 */
	getMixAttachComponents: function()
	{
		return [{
			xtype: 'displayfield',
			value: _('Unable to import:'),
			hideLabel: true,
			htmlEncode: true
		}, {
			xtype: 'textarea',
			hideLabel: true,
			flex: 1,
			readOnly: true,
			listeners: {
				afterrender: this.onAfterRenderTextArea,
				scope: this
			}
		}, {
			xtype: 'displayfield',
			value: _('The files are not valid'),
			hideLabel: true,
			htmlEncode: true
		}];
	},

	/**
	 * Handler which is called when 'textarea' is rendered. it prepares a list of all the unsupported attachments,
	 * which is to be shown in the text area, line by line.
	 * @param {Ext.form.TextArea} leftoutTextArea The textarea
	 * @return {String} list of unsupported attachments, separated by escaping sequence
	 */
	onAfterRenderTextArea: function(leftOutTextArea)
	{
		var leftOutList = "";

		Ext.each(this.records, function(record) {
			leftOutList += record.name + "\n";
		});

		leftOutTextArea.setValue(leftOutList);
	}
});

Ext.reg('grommunio.brokenfilespanel', Grommunio.hierarchy.dialogs.BrokenFilesPanel);
