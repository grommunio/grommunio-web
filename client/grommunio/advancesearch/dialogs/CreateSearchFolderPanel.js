/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.dialogs');

/**
 * @class Grommunio.advancesearch.dialogs.CreateSearchFolderPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.createsearchfolderpanel
 *
 * Panel that is used to create new search folder under the favorites folder list.
 */
Grommunio.advancesearch.dialogs.CreateSearchFolderPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'k-create-search-folder-panel',
			border: false,
			items: [{
				xtype: 'displayfield',
				value: _('Add a folder to favorites based on search query'),
				hideLabel: true,
				margins: '0 0 9 0',
				anchor: '100%'
			}, {
				xtype: 'container',
				layout: 'form',
				labelAlign: 'top',
				items:[{
					xtype: 'textfield',
					ref: '../../searchFolderTextField',
					emptyText: _('Folder name'),
					labelSeparator: '',
					anchor: '100%'
				}]
			}]
		});

		Grommunio.advancesearch.dialogs.CreateSearchFolderPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.createsearchfolderpanel', Grommunio.advancesearch.dialogs.CreateSearchFolderPanel);
