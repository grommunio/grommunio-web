Ext.namespace('Zarafa.plugins.chat');

/**
 * This object is used to relay browser notifications from the Chat iframe
 * to the WebApp window. Chat need to have the Notifymatters plugin installed
 * and activated.
 * @type {Object}
 */
Zarafa.plugins.chat.Notifications = {
	/**
	 * Reference to the iframe element where Chat is loaded
	 * @type {HTMLElement}
	 */
    iframe: null,

	/**
	 * Timer id of the timeout that is used to enable the notification relaying.
	 * We need to try a couple of times because we don't know when the Chat plugin
	 * is initialized and ready to process our messages.
	 * @type {Number}
	 */
	timer: undefined,

	/**
	 * Set to true when the notification relaying has been enabled.
	 * @type {Boolean}
	 */
	enabled: false,

	/**
	 * Set to true when the post message listener has been added
	 * @type {Boolean}
	 */
	messageHandlerAdded: false,

	/**
	 * Object with references to the notifications that are shown to the user
	 * @type {Object}
	 */
	notifications: {},

	/**
	 * The maximum number of times we will try to enable the relaying.
	 * It could be that the Notifymatters plugin is not installed or activated
	 * in chat.
	 * @type {Number}
	 */
	maxRetry: 100,

	/**
	 * Number of times we have tried to enable the relaying of notifications
	 * @type {Number}
	 */
	retryCount: 0,

	/**
	 * TIme in milliseconds to wait before retrying to enable
	 * @type {Number}
	 */
	retryDelay: 200,

	/**
	 * Intializes the relaying of notifications.
	 * @param  {[type]} iframe [description]
	 * @return {[type]}        [description]
	 */
    initialize : function(iframe) {
		if ( !window.Notification ){
			return;
		}

        this.iframe = iframe;

		if ( !this.messageHandlerAdded ){
        	window.addEventListener('message', this.onMessage.bind(this), false);
			this.messageHandlerAdded = true;
		}

		// When the chat tab has been closed and reopened we must enable the
		// relaying of notifications again.
		this.enabled = false;
		this.retryCount = 0;
        this.enable();
    },

	/**
	 * Enables the relaying of notifications by sending the 'enable' message to the
	 * chat iframe.
	 */
	enable : function() {
		if ( this.enabled ){
			return;
		}

		if ( ++this.retryCount > this.maxRetry ) {
			clearTimeout(this.timer);
			return;
		}

        this.sendMessage('enable', Notification.permission);

		// Set a timeout to retry because the chat plugin might not be ready yet
		// and we have no other way of checking that.
		this.timer = setTimeout(function(){
			this.enable();
		}.bind(this), this.retryDelay);
	},

	/**
	 * Event handler for the 'message' event of the postMessage API.
	 * @param  {Object} event Event object
	 */
    onMessage : function(event) {
        if ( event.source !== this.iframe.contentWindow ) {
			// Only handle messages from the chat iframe
            return;
        }
        if (!event.data || !event.data.type || event.data.type.indexOf('notifymatters.') !== 0 ) {
            // Ignore unknown stuff.
            return;
        }

		switch (event.data.type) {
			case 'notifymatters.ok':
				this.enabled = true;
				clearTimeout(this.timer);
				break;

            case 'notifymatters.notification.requestPermission':
                window.Notification.requestPermission(function(result) {
                    this.sendMessage('ref.resolve', result, event.data.ref);
                }.bind(this));
                break;

            case 'notifymatters.notification.new': {
				event.data.data.options.icon = event.origin + event.data.data.options.icon;
                const notification = new Notification(event.data.data.title, event.data.data.options);
                this.notifications[event.data.data.id] = notification;

                notification.onclick = function() {
					// Activate chat tab
					const plugin = container.getPluginByName('chat');
					if ( plugin ) {
						plugin.openTab();
					}

					window.blur();
					window.focus();
                    this.sendMessage('notification.onclick', null, event.data.data.id);
                }.bind(this);

                notification.onclose = function() {
                    delete this.notifications[event.data.data.id];
                    this.sendMessage('notification.onclose', null, event.data.data.id);
                }.bind(this);
                break;
            }

            case 'notifymatters.notification.close': {
                const notification = this.notifications[event.data.data.id];
                if (!notification) {
                    return;
                }
                notification.close();
                break;
            }

			default:
                console.warn('received unknown notifymatters message type', event.data.type);
                break;
		}
    },

	/**
	 * Wrapper function for posting messages to the chat iframe
	 * @param  {String} msg The message to send
	 * @param  {Any} data The data to send with the message
	 * @param  {Number} ref Notifcation id for the Notifymatters plugin
	 */
    sendMessage : function(msg, data, ref) {
        const payload = {
            type: 'notifymatters.' + msg,
            data: data,
            ref: Ext.isNumber(ref) ? ref : null,
            notifymatters: '20171130'
        }

        this.iframe.contentWindow.postMessage(payload, this.iframe.src);
    }
};
