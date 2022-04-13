Ext.namespace('Zarafa.plugins.smime.data');

/**
 * @class Zarafa.plugins.smime.data.SmimeAttachmentStore
 * @extends Zarafa.core.data.IPMAttachmentStore
 * AttachmentStore specific for S/MIME Plugin which creates {@link Zarafa.plugins.smime.SmimeAttachmentRecord record}.
 * @private
 */
Zarafa.plugins.smime.data.SmimeAttachmentStore = Ext.extend(Zarafa.core.data.IPMAttachmentStore, {
	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} smime objecttype for the creation of our own attachmenttype in the attachmentstore
	 */
	attachmentRecordType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME_ATTACHMENT,

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Zarafa.plugins.smime.data.SmimeAttachmentStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('smime.attachmentstore', Zarafa.plugins.smime.data.SmimeAttachmentStore);
