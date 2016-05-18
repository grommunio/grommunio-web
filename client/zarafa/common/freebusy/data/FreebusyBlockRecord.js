Ext.namespace('Zarafa.common.freebusy.data');

/**
 * Contains a description of what a single freebusy block item looks like. Is used by the JSON 
 * reader in the Zarafa.common.freebusy.data.FreebusyBlockStore.
 */
Zarafa.common.freebusy.data.FreebusyBlockRecord = Ext.data.Record.create([
	{ name: 'userid' },
	{ name: 'start', type: 'int' },
	{ name: 'end', type: 'int' },
	{ name: 'status', type: 'int' }
]);
