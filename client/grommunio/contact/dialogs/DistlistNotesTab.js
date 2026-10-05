/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.DistlistNotesTab
 * @extends Ext.form.FormPanel
 * @xtype grommunio.distlistnotestab
 *
 * This class is used to create layout of details tab panel.
 */
Grommunio.contact.dialogs.DistlistNotesTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'grommunio.distlistnotestab',
			// Note Tab
			title: _('Notes'),
			layout: 'fit',
			items: [{
				xtype: 'grommunio.editorfield',
				useHtml: true,
				readOnly: false,
				ref: 'editorField',
				listeners: {
					// Use the afterlayout event to place the placeholder attribute
					afterlayout: function(){
						this.editorField.getEditor().getEl().set({
							placeholder: _('Type your note here…')
						});
					},
					change: this.onBodyChange,
					scope: this
				}
			}]
		});

		Grommunio.contact.dialogs.DistlistNotesTab.superclass.constructor.call(this, config);
	},

	/**
	 * Load record into form
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		if(Ext.isEmpty(record)) {
			return;
		}

		this.record = record;

		this.editorField.setAllowEdit(true);
		this.editorField.setReadOnly(false);

		if (contentReset && record.isOpened()) {
			this.editorField.setValue(record.getBody(this.editorField.isHtmlEditor()));
		}
	},

	/**
	 * Update record from form, Get values from the form.
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to update
	 * @private
	 */
	updateRecord: function(record)
	{
		this.onBodyChange(this.editorField.getEditor(), this.editorField.getValue());
	},

	/**
	 * Event handler which is triggered when the note has been changed by
	 * the user. The editor fields carry no name, so the body is applied
	 * to the {@link Grommunio.core.data.IPMRecord record} in the format
	 * of the active editor.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange: function(field, newValue, oldValue)
	{
		var isHtmlEditor = field.isXType && field.isXType('grommunio.htmleditor');

		this.record.beginEdit();
		this.record.setBody(newValue, isHtmlEditor);
		this.record.endEdit();
	}
});

Ext.reg('grommunio.distlistnotestab', Grommunio.contact.dialogs.DistlistNotesTab);
