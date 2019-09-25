Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.MDBProvider
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different store types
 * 
 * @singleton
 */
Zarafa.core.mapi.MDBProvider = Zarafa.core.Enum.create({
	/**
	 * Denotes that the MAPI Store is a default store.
	 * @property
	 * @type String
	 */
	ZARAFA_SERVICE_GUID			: '5494a1c0297f101ba58708002b2a2517',
	/**
	 * Denotes that the MAPI Store is a public store.
	 * @property
	 * @type String
	 */
	ZARAFA_STORE_PUBLIC_GUID		: '78b2fa70aff711cd9bc800aa002fc45a',
	/**
	 * Denotes that the MAPI Store is a delegated store.
	 * @property
	 * @type String
	 */
	ZARAFA_STORE_DELEGATE_GUID		: '9eb4770074e411ce8c5e00aa004254e2',
	/**
	 * Denotes that the MAPI Store is a archive store.
	 * @property
	 * @type String
	 */
	ZARAFA_STORE_ARCHIVER_GUID		: 'ad5389bc3f2e72419404896ff459870f'
});
