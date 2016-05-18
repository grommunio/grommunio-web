Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.PingService
 * @extends Ext.util.Observable
 *
 * Ping service which will periodically ping the server to determine
 * if the HTTP and Kopano Core server are both available again, so the user can
 * continue working with the WebApp.
 */
Zarafa.core.PingService = Ext.extend(Ext.util.Observable, {

	/**
	 * @cfg {String} url
	 * The url used to send the requests to. defaults to kopano.php.
	 */
	url : 'kopano.php',

	/**
	 * @cfg {String} cmd
	 * The GET attribute to send to the server. defaults to 'ping'
	 */
	cmd : 'ping',

	/**
	 * @cfg {Object} headers
	 * The default headers to be applied to the request. defaults to
	 *      'Content-Type' => 'application/json; charset=utf-8;'
	 */
	headers : undefined,

	/**
	 * @cfg {Number} timeout The initial timeout value for the call
	 * to {@link #sendPing}. This will be incremented by {@link #getNextTimeout}.
	 */
	timeout : 1000,

	/**
	 * @cfg {Number} maxTimeout The maximum timeout value which can be used
	 * and returned by {@link #getNextTimeout}.
	 */
	maxTimeout : 300000,

	/**
	 * The DelayedTask which will be used to defer the {@link #sendPing}
	 * function call to periodically poll the server for availability.
	 * @property
	 * @type Ext.util.DelayedTask
	 * @private
	 */
	pingTask : undefined,

	/**
	 * The current timeout value for the {@link #pingTask}.
	 * This is obtained (and incremented) through {@link #getNextTimeout}.
	 * @property
	 * @type Number
	 * @private
	 */
	currentTimeout : undefined,

	/**
	 * True if the Ping has been send to the server, and the PingService
	 * is currently awaiting the response from the server.
	 * @property
	 * @type Boolean
	 * @private
	 */
	pingPending : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.apply(config, {
			// Apply here instead of class prototype, to prevent
			// accidental sharing of object between all instances.
			headers : {
				'Content-Type' : 'application/json; charset=utf-8;'
			}
		});

		Ext.apply(this, config);

		this.addEvents(
			/**
			 * @event start
			 * Fired during {@link #start} to indicate that the Ping Service will start
			 * polling the server for link connectivity.
			 * @param {Zarafa.core.PingService} service This object
			 * @param {Number} timeout The timeout for the next ping which will be send
			 * to the server
			 */
			'start',
			/**
			 * @event stop
			 * Fired during {@link #stop} to indicate that the Ping Service will stop
			 * polling the server for link connectivity. This doen't imply that the
			 * Service has been stopped before or after a successful response was returned.
			 * @param {Zarafa.core.PingService} service This object
			 */
			'stop',
			/**
			 * @event send
			 * Fired during {@link #sendPing} to indicate that a new Ping request will
			 * be made to the server.
			 * @param {Zarafa.core.PingService} service This object
			 * @param {XMLHttpRequest} xhrObj The XMLHttpRequest which is send to the server
			 */
			'send',
			/**
			 * @event retry
			 * Fired when a ping request was completed, but the connectivity has failed,
			 * a new attempt will be made after a specific timeout.
			 * @param {Zarafa.core.PingService} service This object
			 * @param {Object} response The response, if any, as send by the server
			 * @param {Number} timeout The timeout after which the next ping will be send
			 */
			'retry',
			/**
			 * @event restored
			 * Fired when a ping request was completed, and the connectivity has been restored.
			 * This means connectivity is restored, but the user might no longer have an active
			 * session. No new attempts will be made after this.
			 * @param {Zarafa.core.PingService} service This object
			 * @param {Object} response The response as send by the server
			 */
			'restored'
		);

		Zarafa.core.PingService.superclass.constructor.call(this, config);

		// Instantiate the delayed task for the sendPing function
		this.pingTask = new Ext.util.DelayedTask(this.sendPing, this);
	},

	/**
	 * Start the Ping Service and schedule the first run of {@link #pingTask}.
	 */
	start : function()
	{
		// reset the current timeout
		delete this.currentTimeout;

		// Obtain a new timeout and start polling
		var timeout = this.getNextTimeout();
		this.fireEvent('start', this, timeout);
		this.pingTask.delay(timeout);
	},

	/**
	 * Stop the Ping Service and cancel the {@link #pingTask}.
	 */
	stop : function()
	{
		this.pingTask.cancel();
		this.fireEvent('stop', this);
	},

	/**
	 * Interrupt the current timeout for {@link #pingTask} and manually
	 * invoke {@link #sendPing} causing a new request to be send out right now.
	 */
	retry : function()
	{
		this.pingTask.cancel();
		this.sendPing();
	},

	/**
	 * Obtain the next timeout value for the {@link #pingTask}. If
	 * {@link #currentTimeout} is initialized this will double the value
	 * (restricted by {@link #maxTimeout}, or otherwise it will take {@link #timeout}.
	 * @return {Number} The timeout for the {@link #pingTask}
	 * @private
	 */
	getNextTimeout : function()
	{
		this.currentTimeout = this.currentTimeout ? (2 * this.currentTimeout) : this.timeout;
		this.currentTimeout = Math.min(this.maxTimeout, this.currentTimeout);
		return this.currentTimeout;
	},

	/**
	 * Send a Ping request to the configured {@link #url} with the given {@link #cmd GET action}.
	 * {@link #onStateChange} will handle the response as received from the server.
	 * @private
	 */
	sendPing : function()
	{
		// A Ping request was already send,
		// we will not send another one simultaneously.
		if (this.pingPending) {
			return;
		}

		var xmlHttpRequest = new XMLHttpRequest();

		// Open the HTTP request object
		var url = this.url;
		url = Ext.urlAppend(url, this.cmd);
		xmlHttpRequest.open('GET', url, true);

		// Apply the headers
		for (var key in this.headers) {
			xmlHttpRequest.setRequestHeader(key, this.headers[key]);
		}

		// Register statechange callback function
		xmlHttpRequest.onreadystatechange = this.onStateChange.createDelegate(this, [ xmlHttpRequest ]);

		// Mark that the Ping request is currently pending.
		this.pingPending = true;

		// Send the request
		xmlHttpRequest.send();

		this.fireEvent('send', this, xmlHttpRequest);
	},

	/**
	 * Called by {@link XMLHttpRequest} when a response from the server has been received.
	 * This will determine if the link connection to the server has been restored or not.
	 * @param {XMLHttpRequest} xmlHttpRequest The request object
	 * @private
	 */
	onStateChange : function(xmlHttpRequest)
	{
		var response;

		// The readyState can be 4 values:
		//  0 - Object is created, but not initialized
		//  1 - Request has been opened, but send() has not been called yet
		//  2 - send() has been called, no data available yet
		//  3 - Some data has been received, responseText nor responseBody are available
		//  4 - All data has been received
		//
		// readyState 0 - 3 can be completely ignored by us, as they are only updates
		// about the current progress. Only on readyState 4, should we continue and
		// start checking for the response status.
		if (xmlHttpRequest.readyState != 4) {
			return;
		}

		// Regardless of the state, the Ping request
		// is no longer pending.
		this.pingPending = false;

		// HTTP request must have succeeded
		if (xmlHttpRequest.status !== 200) {
			this.failure();
			return;
		}

		// Depending on the response type, convert it into a data Object.
		if (xmlHttpRequest.responseText) {
			// JSON response
			response = Ext.decode(xmlHttpRequest.responseText);
		} else {
			// XML response is not supported
			this.failure();
			return;
		}

		// Determine if the response indicates that a link connection
		// exists, and call the proper handler.
		if (response.success) {
			this.restored(response);
		} else {
			this.failure(response);
		}
	},

	/**
	 * Called when the link connection has been restored. This will fire
	 * the {@link #restored} event.
	 * @param {Object} response The response as received by the server
	 * @private
	 */
	restored : function(response)
	{
		this.fireEvent('restored', this, response);
	},

	/**
	 * Called when the link connection has not been restored and will be
	 * retried later. This will fire the {@link #retry} event.
	 * @param {Object} response The response, if any, as received by the server
	 * @private
	 */
	failure : function(response)
	{
		var timeout = this.getNextTimeout();
		this.fireEvent('retry', this, response, timeout);
		this.pingTask.delay(timeout);
	}
});
