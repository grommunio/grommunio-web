Ext.namespace('Zarafa.plugins.desktopnotifications.js');

/**
 * @class Zarafa.plugins.desktopnotifications.js.DesktopNotification
 * @singleton
 *
 * Singleton class to provide a wrapper for HTML5 desktop notifications feature
 */
Zarafa.plugins.desktopnotifications.js.DesktopNotification = (function() {
	return {
		/**
		 * Check if browser supports notifications API
		 * @return {Boolean} true if browser supports desktop notifications else false
		 */
		supports : function()
		{
			return !!window.Notification;
		},

		/**
		 * Check if browser has permissions to show notifications
		 * @return {Boolean} true if permissions are granted to show desktop notifications else false
		 */
		hasPermission : function()
		{
			if (!this.supports()) {
				return false;
			}

			return Notification.permission === 'granted';
		},

		/**
		 * Ask for permissions to show notifications
		 * In chrome this function will only work when you call it based on some user action
		 * like click of a button
		 * @param {Function} callback callback function that will be called after user has
		 * granted/rejected permission request
		 */
		authorize : function(callback)
		{
			if (!this.supports()) {
				if (Ext.isFunction(callback)) {
					callback('denied');
				}
				return;
			}

			if (!Ext.isFunction(Notification.requestPermission)) {
				return;
			}

			// Guard against double invocation: some browsers call both the
			// callback parameter and resolve the returned promise.
			var called = false;
			var wrappedCallback = function(perm) {
				if (!called && Ext.isFunction(callback)) {
					called = true;
					callback(perm || 'granted');
				}
			};

			// Pass callback as parameter for Safari compatibility, which
			// historically used the callback form instead of a promise.
			var result = Notification.requestPermission(wrappedCallback);
			if (result && Ext.isFunction(result.then)) {
				result.then(wrappedCallback);
			}
		},

		/**
		 * Function will show a desktop notification
		 * @param {String} title title to use when showing desktop notifications
		 * @param {Object} options object containing below key value pairs to provide extra information
		 * for the desktop notifications
		 * 		- icon : icon to show in desktop notifications
		 * 		- body : message to display
		 *		- tag : tag to group same type of notifications so multiple notifications
		 *				will not be showed multiple times
		 * @param {Object} handlers object containing handler function that can be registered on instance of
		 * notification object
		 * 		- possible handlers are click, show, error, close
		 */
		notify : function(title, options, handlers)
		{
			if (!this.supports()) {
				return;
			}

			if (!this.hasPermission()) {
				return;
			}

			var settingsModel = container.getSettingsModel();
			var soundDisabled = settingsModel.get('zarafa/v1/plugins/desktopnotifications/disable_sound');

			var notification = new Notification(title, {
				icon : options.icon,
				body : options.body,
				requireInteraction: true,
				silent: !soundDisabled ? false : true
			});

			if (settingsModel.get('zarafa/v1/plugins/desktopnotifications/autohide_enable')) {
				var sleepTime = settingsModel.get('zarafa/v1/plugins/desktopnotifications/autohide_time') * 1000;
				setTimeout(function () {
					notification.close();
				}, sleepTime);
			}

			if (handlers) {
				for(var key in handlers) {
					notification['on' + key] = handlers[key];
				}
			}

			// Give audio feedback
			if (!soundDisabled) {
				this.playNotificationSound();
			}
		},

		/**
		 * Play notification sound, trying WebM first with MP3 fallback for Safari.
		 * @private
		 */
		playNotificationSound : function()
		{
			// Clean up previous audio if still playing
			if (this.notificationAudio) {
				this.notificationAudio.pause();
				this.notificationAudio = null;
			}

			var self = this;
			var basePath = 'plugins/desktopnotifications/resources/audio';
			var audio = new Audio();
			this.notificationAudio = audio;

			audio.addEventListener('ended', function () {
				self.notificationAudio = null;
			});

			// Try WebM first (Chrome, Firefox, Edge), fall back to MP3 (Safari)
			if (audio.canPlayType('audio/webm')) {
				audio.src = basePath + '.webm';
			} else {
				audio.src = basePath + '.mp3';
			}

			try {
				var playPromise = audio.play();
				if (playPromise && Ext.isFunction(playPromise.catch)) {
					playPromise.catch(function() {
						self.notificationAudio = null;
					});
				}
			} catch (e) {
				this.notificationAudio = null;
			}
		}
	};
})();
