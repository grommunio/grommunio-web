navigator.sayswho = (function(){
	var ua= navigator.userAgent, tem,
	M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if(/trident/i.test(M[1])){
		tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
		return 'MSIE '+(tem[1] || '');
    }
	if(M[1]=== 'Chrome'){
		tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
		if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
	}
	M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);

	return M.join(' ');
})();

(function() {
/**************************************************************************
 * This module handles fingerprinting the user. It will create a fingerprint
 * from data gathered about:
 * - the navigator (user agent)
 * - available fonts
 * - available plugins
 * The fingerrpint should be sent to the server from the login page. When
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
			appCodeName : navigator.appCodeName || '',
			appName : navigator.appName || '',
			appVersion : navigator.appVersion || '',
			platform : navigator.platform || '',
			product : navigator.product || '',
			productSub : navigator.productSub || '',
			sayswho : navigator.sayswho || '',
			userAgent : navigator.userAgent || '',
			vendor : navigator.vendor || '',
			vendorSub : navigator.vendorSub || ''
		};
	}
	
	/**
	 * Returns an array with fonts that are available on
	 * the system.
	 */
	function _getFonts(){
		// First we define a list of fonts that we will check
		// for availability.
		const fonts = [
			// General
			'Arial',
		
			// Microsoft windows
			'Aldhabi',
			'Andalus',
			'Aparajita',
			'Arabic Typesetting',
			'Arial Black',
			'Arial Narrow',
			'Bodoni MT',
			'Baskerville Old Face',
			'Goudy Old Style',
			'Constantia',
			'Cambria',
			'Garamond',
			'Book Antiqua',
			'Palatino Linotype',
			'Segoe UI',
			'Gill Sans MT',
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
			'Gill Sans',
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
			'Lucida Bright',
			'Charcoal',
			
			// High availability on linux
			'Utopia',
			'New Century Schoolbook',
			'Zapf Chancery',
			'Nimbus Sans L',
			'Bitstream Charter',
			'Ubuntu'
		];
    return window.checkfont.installed(fonts);
	}
	
	/**
	 * Returns a list of available plugins
	 */
	function _getPlugins(){
		if ( !navigator || !navigator.plugins ){
			return [];
		}
		
		var plugins = [];
		for ( var i in navigator.plugins ){
			if ( navigator.plugins.hasOwnProperty(i) ){
				plugins.push({
					description: navigator.plugins[i].description,
					name: navigator.plugins[i].name,
					filename: navigator.plugins[i].filename,
					version: navigator.plugins[i].version || 0
				});
			}
		}

		return plugins;
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
		 * Returns a fingerprint based on the navigator info, the
		 * installed plugins, and available fonts.
		 */
		get: function() {
			var navInfo = _getNavigatorInfo();
			var fonts = _getFonts();
			var plugins = _getPlugins();

			return _hashCode(JSON.stringify([navInfo, fonts, plugins]));
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
			request.open('POST', 'kopano.php?service=fingerprint&type=keepalive');
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


/**
*
*  JFont Checker
*  Derek Leung
*  Original Date: 2010.8.23
*  Current: Jan, 2015
*  
*  This piece of code checks for the existence of a specified font.
*  It ultilizes the font fallback mechanism in CSS for font checking.
*  
*  Compatibility:
*  Tested on Chrome, Firefox, IE6+
*  Requires CSS and JS
*  
* The MIT License (MIT)
*
* Copyright (c) 2015 Derek Leung
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.

**/
window.checkfont = (function() {
	var containerA;
  var arialWidth;
  var monospaceWidth;
  var arialHeight;
  var monospaceHeight;

	function checkArial() {
		return containerA.offsetWidth === arialWidth &&
				containerA.offsetHeight === arialHeight;
	}

	function checkMonospace() {
		return containerA.offsetWidth === monospaceWidth &&
				containerA.offsetHeight === monospaceHeight;
	}

  function setupContainer() {
		var container = document.createElement("span");
    const html = document.getElementsByTagName("html")[0];
		container.textContent = "random_words_#_!@#$^&*()_+mdvejreu_RANDOM_WORDS";
    const styles = {
      margin: "0",
      padding: "0",
      fontSize: "32px",
      position: "absolute",
      left: '-10000px',
      top: '-10000px',
      zIndex: "-1"
    };

		for (var key in styles) {
			if(styles.hasOwnProperty(key)){
				container.style[key] = styles[key];
			}
		}

		html.appendChild(container);
    return container;
  }

  /**
   * Initialize the width and height of both fonts.
   */
  function initModule() {
    var containerB = setupContainer();
    containerB.style.fontFamily = "monospace";
    monospaceHeight = containerB.offsetHeight;
    monospaceWidth = containerB.offsetWidth;

    containerB.style.fontFamily = "Arial";
    arialWidth = containerB.offsetWidth;
    arialHeight = containerB.offsetHeight;

    containerB.parentNode.removeChild(containerB);
  }

  function exists(font) {
    //First Check
    containerA.style.fontFamily = font + ",monospace";

    if (checkMonospace()) {
      //Assume Arial exists, Second Check
      containerA.style.fontFamily = font + ",Arial";
      return !checkArial();
    }

    return true;
  }

  initModule();

  return {
     /**
     * Returns a filtered list of installed fonts.
     * @param array list of fonts to check
     * @return array filtered array of installed fonts
     */
    installed: function(fonts) {
      containerA = setupContainer();
      const result = fonts.filter(exists);
			containerA.parentNode.removeChild(containerA);
      return result;
    },
		exists: function(font) {
			return this.installed([font]).some(function(res) {
				return font === res;
			});
		}
  };
})();

// Send a fingerprint request when the document is loaded
// When the user has not been authenticated (i.e. is on the login page),
// the backend will store the fingerprint in the session.
// When the user has been authenticated, the backend will chek if the
// sent fingerprint matches the one stored in the session. If they do not
// match, the session will be destroyed.
window.addEventListener('load', function(){
	var request = new XMLHttpRequest();
	request.open('POST', 'kopano.php?service=fingerprint');
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	// Add the fingerprint to the content body of the request
	var params = 'fingerprint='+fingerprint.get();
	request.send(params);
	
	// Start sending keep-alive requests. The first one will be sent immediately
	sendKeepAlive(0);
});

})();
