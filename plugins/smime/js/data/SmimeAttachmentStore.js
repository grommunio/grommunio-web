/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.smime.data');

/**
 * @class Grommunio.plugins.smime.data.SmimeAttachmentStore
 * @extends Grommunio.core.data.IPMAttachmentStore
 * AttachmentStore specific for S/MIME Plugin which creates {@link Grommunio.plugins.smime.SmimeAttachmentRecord record}.
 * @private
 */
Grommunio.plugins.smime.data.SmimeAttachmentStore = Ext.extend(Grommunio.core.data.IPMAttachmentStore, {
	/**
	 * @cfg {Grommunio.core.data.RecordCustomObjectType} smime objecttype for the creation of our own attachmenttype in the attachmentstore
	 */
	attachmentRecordType : Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME_ATTACHMENT,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Grommunio.plugins.smime.data.SmimeAttachmentStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('smime.attachmentstore', Grommunio.plugins.smime.data.SmimeAttachmentStore);
