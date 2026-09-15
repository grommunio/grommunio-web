/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.ns('Grommunio.common.searchfield.ui');

/**
 * @class Grommunio.common.searchfield.ui.SearchFieldContainer
 * @extends Ext.Container
 * @xtype grommunio.searchfieldcontainer
 *
 * Container for the modernized search field. Holds the
 * {@link Grommunio.common.searchfield.ui.SearchTextField SearchTextField} and a hidden
 * {@link Grommunio.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
 * (used internally for folder scope management).
 */
Grommunio.common.searchfield.ui.SearchFieldContainer = Ext.extend(Ext.Container, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(config, {
			xtype: 'grommunio.searchfieldcontainer',
			cls: 'k-search-container',
			items:[{
				xtype: 'grommunio.searchtextfield',
				searchContainer: this
			},{
				xtype: 'grommunio.searchfoldercombo',
				model: config.model,
				searchFieldContainer: this,
				hidden: true,
				width: 0
			}]
		});

		Grommunio.common.searchfield.ui.SearchFieldContainer.superclass.constructor.call(this, config);
	}
});
Ext.reg('grommunio.searchfieldcontainer', Grommunio.common.searchfield.ui.SearchFieldContainer);
