(function() {
/**************************************************************************
 * This module handles fingerprinting the user. It will create a fingerprint
 * from data gathered about:
 * - the navigator (user agent)
 * - available fonts
 * The fingerprint should be sent to the server from the login page. When
 * the user is not authenticated, the fingerprint will be stored in the
 * session. After login with credentials stored in the session the
 * fingerprint should be sent again and checked. If they are not the same
 * the session should be destroyed.
 *************************************************************************/

const fingerprint = (function(){
	/**
	 * Returns an object with info about the navigator
	 */
	function _getNavigatorInfo(){
		return {
			appName : navigator.appName || '',
			appVersion : navigator.appVersion || '',
			platform : navigator.platform || '',
			userAgent : navigator.userAgent || '',
			vendor : navigator.vendor || ''
		};
	}

	/**
	 * Returns an array with fonts that are available on
	 * the system.
	 */
	function _getFonts(){
		const fonts = [
			// General
			'Arial',

			// Microsoft windows
			'Aldhabi',
			'Andalus',
			'Aparajita',
			'Arabic Typesetting',
			'Arial Black',
			'Bodoni MT',
			'Baskerville Old Face',
			'Goudy Old Style',
			'Constantia',
			'Cambria',
			'Garamond',
			'Book Antiqua',
			'Palatino Linotype',
			'Segoe UI',
			'Candara',
			'Calibri',
			'Franklin Gothic Medium',
			'Century Gothic',
			'Impact',

			// Apple
			'Arial Rounded MT Bold',
			'Lucida Bright',
			'Palatino',
			'Big Caslon',
			'Didot',
			'Optima',
			'Futura',
			'Trebuchet MS',
			'Helvetica',

			// Adobe fonts
			'Adobe Text',
			'Myriad Arabic',
			'Source Sans',
			'Garamond Premier',

			// Some rare fonts
			'Century Schoolbook',
			'Gautami',
			'Andale Mono',
			'Charcoal',

			// High availability on linux
			'Utopia',
			'New Century Schoolbook',
			'Zapf Chancery',
			'Nimbus Sans L',
			'Bitstream Charter',
			'Ubuntu'
		];
		if (!document.fonts || !document.fonts.check) {
			return fonts;
		}
		return fonts.filter(function(font) {
			return document.fonts.check('16px "' + font + '"');
		});
	}

	/**
	 * Creates a 32 bit integer hash from a string
	 */
	function _hashCode(str) {
		var hash = 0, i, chr, len = str.length;
		if (len === 0) {
			return hash;
		}
		for (i = 0; i < len; i++) {
			chr   = str.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}

	return {
		/**
		 * Returns a fingerprint based on the navigator info
		 * and available fonts.
		 */
		get: function() {
			var navInfo = _getNavigatorInfo();
			var fonts = _getFonts();

			return _hashCode(JSON.stringify([navInfo, fonts]));
		}
	};
})();

const sendKeepAlive = (function(){
	/**
	 * Sends a request to the backend to keep the php session alive.
	 * This is needed for the login page because the fingerprint is
	 * stored in the session.
	 * @param {Number} wait Time in milliseconds that the function must wait
	 * before it sends the keep-alive request.
	 */
	return function _sendKeepAlive(wait) {
		setTimeout(function(){
			const request = new XMLHttpRequest();
			request.open('POST', 'grommunio.php?service=fingerprint&type=keepalive');
			request.onload = function() {
				const phpGcMaxLifTime = request.response ? parseInt(request.response, 10) : 0;
				if ( phpGcMaxLifTime > 1 ){
					// Send keep-alive request at half the session expiration time
					// Note: phpGcMaxLifTime is in seconds, while the timeout is given in milliseconds
					_sendKeepAlive(parseInt(Math.round(1000*phpGcMaxLifTime/2)));
				}
			};
			request.send();
		}, wait);
	};
})();

// Send a fingerprint request when the document is loaded
// When the user has not been authenticated (i.e. is on the login page),
// the backend will store the fingerprint in the session.
// When the user has been authenticated, the backend will check if the
// sent fingerprint matches the one stored in the session. If they do not
// match, the session will be destroyed.
window.addEventListener('load', function(){
	var request = new XMLHttpRequest();
	request.open('POST', 'grommunio.php?service=fingerprint');
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	// Add the fingerprint to the content body of the request
	var params = 'fingerprint='+fingerprint.get();
	request.send(params);

	// Start sending keep-alive requests after a reasonable initial delay.
	// The fingerprint POST above already refreshes the session, so we
	// only need the first keep-alive to bootstrap the session timeout.
	sendKeepAlive(60000);
});

})();
