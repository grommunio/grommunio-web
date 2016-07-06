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

(function(){
	var fingerprint = {};
	
	/**
	 * Returns a fingerprint based on the navigator info, the
	 * installed plugins, and available fonts.
	 */
	fingerprint.get = function(){
		var navInfo = _getNavigatorInfo();
		var fonts = _getFonts();
		var plugins = _getPlugins();

		return _hashCode(JSON.stringify([navInfo, fonts, plugins]));
	}
	
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
		}
	}
	
	/**
	 * Returns an array with fonts that are available on
	 * the system.
	 */
	function _getFonts(){
		// First we define a list of fonts that we will check
		// for availability.
		var fonts = [
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
		
		var ret = [];
		for ( var i=0; i<fonts.length; i++ ){
			if ( checkfont(fonts[i]) ){
				ret.push(fonts[i]);
			}
		}
		
		return ret;
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
	  var hash = 0, i, chr, len;
	  if (str.length === 0) return hash;
	  for (i = 0, len = str.length; i < len; i++) {
	    chr   = str.charCodeAt(i);
	    hash  = ((hash << 5) - hash) + chr;
	    hash |= 0; // Convert to 32bit integer
	  }
	  return hash;
	};
	
	/**
	 * Sends a request to the backend to keep the php session alive.
	 * This is needed for the login page because the fingerprint is
	 * stored in the session.
	 * @param {Number} wait Time in milliseconds that the function must wait
	 * before it sends the keep-alive request.
	 */
	function _sendKeepAlive(wait) {
		setTimeout(function(){
			var request = new XMLHttpRequest();
			request.open('POST', 'kopano.php?service=fingerprint&type=keepalive');
			request.onload = function(e) {
				var phpGcMaxLifTime = !!request.response ? parseInt(request.response, 10) : 0;
				if ( phpGcMaxLifTime > 1 ){
					// Send keep-alive request at half the session expiration time
					// Note: phpGcMaxLifTime is in seconds, while the timeout is given in milliseconds
					_sendKeepAlive(parseInt(Math.round(1000*phpGcMaxLifTime/2)));
				}
			}
			request.send();
		}, wait);
	}

	// Export the module
	this.fingerprint = fingerprint;
	// Export the keep-alive function
	this.sendKeepAlive = _sendKeepAlive;
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
(function(){
	var containerA, containerB, html = document.getElementsByTagName("html")[0],
		filler = "random_words_#_!@#$^&*()_+mdvejreu_RANDOM_WORDS";

	function createContainers(){
		containerA = document.createElement("span");
		containerB = document.createElement("span");

		containerA.textContent = filler;
		containerB.textContent = filler;

		var styles = {
			margin: "0",
			padding: "0",
			fontSize: "32px",
			position: "absolute",
			left: '-10000px',
			top: '-10000px',
			zIndex: "-1"
		};

		for(var key in styles){
			if(styles.hasOwnProperty(key)){
				containerA.style[key] = styles[key];
				containerB.style[key] = styles[key];
			}
		}

		return function(){
			//clean up
			containerA.parentNode.removeChild(containerA);
			containerB.parentNode.removeChild(containerB);
		};
	}

	function checkDimension(){
		return containerA.offsetWidth === containerB.offsetWidth &&
			   containerA.offsetHeight === containerB.offsetHeight;
	}

	function checkfont(font, DOM){
		var rootEle = html;
		if(DOM && DOM.children && DOM.children.length) rootEle = DOM.children[0];

		var result = null,
			reg = /[\,\.\/\;\'\[\]\`\<\>\\\?\:\"\{\}\|\~\!\@\#\$\%\^\&\*\(\)\-\=\_\+]/g,
			cleanUp = createContainers();

		font = font.replace(reg, "");

		rootEle.appendChild(containerA);
		rootEle.appendChild(containerB);

		//First Check
		containerA.style.fontFamily = font + ",monospace";
		containerB.style.fontFamily = "monospace";

		if(checkDimension()){
		   	//Assume Arial exists, Second Check
			containerA.style.fontFamily = font + ",Arial";
			containerB.style.fontFamily = "Arial";
			result = !checkDimension();
		}else{
			result = true;
		}

		cleanUp();
		return result
	}

	this.checkfont = checkfont;
})();

// Send a fingerprint request when the document is loaded
// When the user has not been authenticated (i.e. is on the login page),
// the backend will store the fingerprint in the session.
// When the user has been authenticated, the backend will chek if the
// sent fingerprint matches the one stored in the session. If they do not
// match, the session will be destroyed.
window.addEventListener('load', function(event){
	var request = new XMLHttpRequest();
	request.open('POST', 'kopano.php?service=fingerprint');
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	// Add the fingerprint to the content body of the request
	var params = 'fingerprint='+fingerprint.get();
	request.send(params);
	
	// Start sending keep-alive requests. The first one will be sent immediately
	sendKeepAlive(0);
});
