/*
 * #dependsFile client/zarafa/core/data/ListModuleStore.js
 */
Ext.namespace('Zarafa.common.outofoffice.data');

/**
 * @class Zarafa.common.outofoffice.data.OofStore
 * @extends Zarafa.core.data.ListModuleStore
 *
 * OofStore store that will be used to load out of office information from server.
 */
Zarafa.common.outofoffice.data.OofStore = Ext.extend(Zarafa.core.data.ListModuleStore, {

    /**
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor : function(config)
    {
        config = config || {};

        var recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_OOF_SETTINGS);

        Ext.applyIf(config, {
            proxy: new Zarafa.core.data.IPMProxy({
                listModuleName: Zarafa.core.ModuleNames.getListName('OUTOFOFFICESETTINGS'),
                itemModuleName: Zarafa.core.ModuleNames.getItemName('OUTOFOFFICESETTINGS')
            }),

            reader: new Zarafa.core.data.JsonReader({
                dynamicRecord : false,
                id : 'store_entryid',
                idProperty : 'store_entryid',
            }, recordType),

            batch : true,
            autoLoad: true
        });

        Zarafa.common.outofoffice.data.OofStore.superclass.constructor.call(this, config);
    }
});
