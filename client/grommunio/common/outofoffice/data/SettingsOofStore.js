/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/ListModuleStore.js
 */
Ext.namespace('Grommunio.common.outofoffice.data');

/**
 * @class Grommunio.common.outofoffice.data.OofStore
 * @extends Grommunio.core.data.ListModuleStore
 *
 * OofStore store that will be used to load out of office information from server.
 */
Grommunio.common.outofoffice.data.OofStore = Ext.extend(Grommunio.core.data.ListModuleStore, {

  /**
   * @constructor
   * @param {Object} config Configuration object
   */
  constructor: function(config)
  {
    config = config || {};

    var recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_OOF_SETTINGS);

    Ext.applyIf(config, {
      proxy: new Grommunio.core.data.IPMProxy({
        listModuleName: Grommunio.core.ModuleNames.getListName('OUTOFOFFICESETTINGS'),
        itemModuleName: Grommunio.core.ModuleNames.getItemName('OUTOFOFFICESETTINGS')
      }),

      reader: new Grommunio.core.data.JsonReader({
        dynamicRecord: false,
        id: 'store_entryid',
        idProperty: 'store_entryid'
      }, recordType),

      batch: true,
      autoLoad: true
    });

    Grommunio.common.outofoffice.data.OofStore.superclass.constructor.call(this, config);
  }
});
