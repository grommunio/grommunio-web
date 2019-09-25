Ext.namespace('Zarafa.plugins.desktopnotifications.js');

/**
 * @class Zarafa.plugins.desktopnotifications.js.DesktopNotification
 * @singleton
 *
 * Singleton class to provide a wrapper for HTML5 desktop notifications feature
 */
Zarafa.plugins.desktopnotifications.js.DesktopNotification = (function() {
	var PERMISSION = ['granted', 'default', 'denied'];

	return {
		/**
		 * Check if browser supports notifications API
		 * @return {Boolean} true if browser supports desktop notifications else false
		 */
		supports : function()
		{
			if (window.Notification) {
				return true;
			}

			return false;
		},

		/**
		 * Check if browser has permissions to show notifications
		 * @return {Boolean} true if permissions are granted to show desktop notifications else false
		 */
		hasPermission : function()
		{
			if (!this.supports()) {
				console.log('Browser doesn\'t support notifications');
				return;
			}

			var permission = 'default';
			if (Ext.isFunction(Notification.checkPermission)) {
				permission = PERMISSION[Notification.checkPermission()];
			} else if (Ext.isFunction(Notification.permissionLevel)) {
				permission = Notification.permissionLevel();
			} else if (Notification.permission) {
				permission = Notification.permission;
			}

			if (permission === 'granted') {
				return true;
			}

			return false;
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
				console.log('Browser doesn\'t support notifications');
				return;
			}

			var callbackFn = Ext.isFunction(callback) ? function(perm) {
				// chrome doesn't give us current permission level, so default to granted if permission level is passed
				var permission = 'granted';
				if (perm) {
					permission = perm;
				}

				callback.apply(this, [permission]);
			} : Ext.emptyFn;

			if (Ext.isFunction(Notification.requestPermission)) {
				Notification.requestPermission(callbackFn);
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
				console.log('Browser doesn\'t support notifications');
				return;
			}

			if (!this.hasPermission()) {
				console.log('Permission is denied to show desktop notifications');
				return;
			}

			var notification = new Notification(title, {
				icon : options.icon,
				body : options.body,
				requireInteraction: true
			});

			if (container.getSettingsModel().get('zarafa/v1/plugins/desktopnotifications/autohide_enable')) {
				var sleepTime = container.getSettingsModel().get('zarafa/v1/plugins/desktopnotifications/autohide_time') * 1000;
				notification.addEventListener("show", function () {
					setTimeout(function () {
						notification.close();
					}, sleepTime);
				});
			}

			if (handlers) {
				for(var key in handlers) {
					notification['on' + key] = handlers[key];
				}
			}

			// give audio feedback
			this.audioTag = Ext.getBody().createChild({
				tag : 'audio',
				type : 'audio/ogg',
				src : 'plugins/desktopnotifications/resources/audio.ogg',
				autoplay : true
			});

			// destroy audio element when playback is completed
			this.audioTag.on('ended', function() {
				Ext.destroy(this.audioTag);
				delete this.audioTag;
			}, this);
		}
	};
})();
