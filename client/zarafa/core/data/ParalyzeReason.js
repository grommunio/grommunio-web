Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ParalyzeReason
 * @extends Zarafa.core.Enum
 * @singleton
 *
 * The various reasons why the WebApp can be {@link Zararafa.core.Request#paralyze paralyzed}.
 */
Zarafa.core.data.ParalyzeReason = Zarafa.core.Enum.create({
	/**
	 * Denotes that the WebApp is paralyzed because the browser
	 * window is reloading or otherwise unloading.
	 * @property
	 * @type Number
	 */
	BROWSER_RELOADING : 0,

	/**
	 * Denotes that the WebApp is paralyzed because the session
	 * has been expired and the user is no longer logged in.
	 * @property
	 * @type Number
	 */
	SESSION_EXPIRED : 1,

	/**
	 * Denotes that the WebApp is paralyzed because the session
	 * was altered (cookie session id doesn't match expected id)
	 * @property
	 * @type Number
	 */
	SESSION_INVALID : 2
});
