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
	ZARAFA_SERVICE_GUID				: 'ca3d253c27d23c4494fe425fab958c19',
	/**
	 * Denotes that the MAPI Store is a public store.
	 * @property
	 * @type String
	 */
	ZARAFA_STORE_PUBLIC_GUID		: '094a7fd4bdd33c49b2fc3c90bbcb48d4',
	/**
	 * Denotes that the MAPI Store is a delegated store.
	 * @property
	 * @type String
	 */
	ZARAFA_STORE_DELEGATE_GUID		: '85107c7c6dbc534e9dab8a53f8def808',
	/**
	 * Denotes that the MAPI Store is a archive store.
	 * @property
	 * @type String
	 */
	ZARAFA_STORE_ARCHIVER_GUID		: 'ad5389bc3f2e72419404896ff459870f'
});
