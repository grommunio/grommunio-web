Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Enum that lists the supported target types for Seafile sharing.
 */
Zarafa.plugins.files.backend.Seafile.data.RecipientTypes =
	Zarafa.core.Enum.create({
		USER: 0,
		GROUP: 1,
		LINK: 3,
	});
