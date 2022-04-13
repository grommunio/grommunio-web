Ext.namespace('Zarafa.plugins.smime.data');

/**
 * @class Zarafa.plugins.smime.data.JsonCertificateReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.plugins.smime.data.JsonCertificateReader = Ext.extend(Zarafa.core.data.JsonReader, {
        /**
         * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
         * which represents the {@link Ext.data.Record records} which should be created using
         * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
         */
        customObjectType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME,

        /**
         * @constructor
         * @param {Object} meta Metadata configuration options.
         * @param {Object} recordType (optional) Optional Record type matches the type
         * which must be read from response. If no type is given, it will use the
         * record type for the {@link Zarafa.core.data.RecordCustomObjectType#ZARAFA_SMIME}.
         */
        constructor : function(meta, recordType)
        {
                meta = Ext.applyIf(meta || {}, {
                        dynamicRecord : false
                });

		recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME);

                Zarafa.plugins.smime.data.JsonCertificateReader.superclass.constructor.call(this, meta, recordType);
        }
});
