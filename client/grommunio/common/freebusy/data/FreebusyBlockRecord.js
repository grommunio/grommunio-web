Ext.namespace('Grommunio.common.freebusy.data');

/**
 * Contains a description of what a single freebusy block item looks like. Is used by the JSON 
 * reader in the Grommunio.common.freebusy.data.FreebusyBlockStore.
 */
Grommunio.common.freebusy.data.FreebusyBlockRecord = Ext.data.Record.create([
	{ name: 'userid' },
	{ name: 'start', type: 'int' },
	{ name: 'end', type: 'int' },
	{ name: 'status', type: 'int' }
]);
