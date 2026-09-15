/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.smime.data');

/**
 * @class Grommunio.plugins.smime.data.JsonCertificateReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.plugins.smime.data.JsonCertificateReader = Ext.extend(Grommunio.core.data.JsonReader, {
        /**
         * @cfg {Grommunio.core.data.RecordCustomObjectType} customObjectType The custom object type
         * which represents the {@link Ext.data.Record records} which should be created using
         * {@link Grommunio.core.data.RecordFactory#createRecordObjectByCustomType}.
         */
        customObjectType : Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME,

        /**
         * @constructor
         * @param {Object} meta Metadata configuration options.
         * @param {Object} recordType (optional) Optional Record type matches the type
         * which must be read from response. If no type is given, it will use the
         * record type for the {@link Grommunio.core.data.RecordCustomObjectType#GROMMUNIO_SMIME}.
         */
        constructor : function(meta, recordType)
        {
                meta = Ext.applyIf(meta || {}, {
                        dynamicRecord : false
                });

		recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME);

                Grommunio.plugins.smime.data.JsonCertificateReader.superclass.constructor.call(this, meta, recordType);
        }
});
