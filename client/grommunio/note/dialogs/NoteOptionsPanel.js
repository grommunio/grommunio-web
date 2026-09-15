/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.note.dialogs');

/**
 * @class Grommunio.note.dialogs.NoteOptionsPanel
 * @extends Ext.Panel
 * @xtype grommunio.noteoptionspanel
 */
Grommunio.note.dialogs.NoteOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.noteoptionspanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				bodyStyle: 'padding-top: 5px; padding-left: 6px; padding-right: 5px; background-color: inherit;',
				border: false
			},
			items: [{
				xtype: 'grommunio.recordpropertiespanel',
				flex: 1
			}]
		});

		Grommunio.note.dialogs.NoteOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.noteoptionspanel', Grommunio.note.dialogs.NoteOptionsPanel);
