/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.smime.data');

/**
 * @class Grommunio.plugins.smime.data.SmimeAttachmentRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.plugins.smime.data.SmimeAttachmentRecord} object.
 */
Grommunio.plugins.smime.data.SmimeAttachmentRecordFields = [
	{name: 'cert', type: 'boolean', defaultValue: false}, 
	{name: 'cert_message', type: 'string'},
	{name: 'cert_warning', type: 'string'}
];

Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_SMIME_ATTACHMENT');
Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME_ATTACHMENT, Grommunio.plugins.smime.data.SmimeAttachmentRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME_ATTACHMENT, Grommunio.plugins.smime.data.SmimeAttachmentRecordFields);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME_ATTACHMENT, Grommunio.core.data.IPMAttachmentRecordFields);
