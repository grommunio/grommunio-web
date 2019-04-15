const userManager = (function(){
	"use strict"; 
	var onLogonPage = false;
	var mgr;

	Oidc.Log.logger = console;
	Oidc.Log.level = Oidc.Log.DEBUG;

	function remove_hash_from_url()
	{
	    var uri = window.location.toString();
	    if (uri.indexOf("#") > 0) {
		var clean_uri = uri.substring(0, uri.indexOf("#"));
		window.history.replaceState({}, document.title, clean_uri);
	    }
	}


	function onLoad() {
		try {
			var data = JSON.parse(this.responseText);
		} catch(e) {
			console.error('oidc unable to parse post token response', e);
		}
		if (data.error) {
			console.error('oidc post token failed', data);
		} else if (onLogonPage) {
			window.location.href = window.location.origin + window.location.pathname;
		}
	}

	function postToken(user) {
		// Post to webapp service with token.
		var http = new XMLHttpRequest();
		var data = "token=" + user.access_token;
		if (onLogonPage) {
			data += "&new=true";
		}

		http.open("POST", "kopano.php?service=token", true);
		http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		http.addEventListener("load", onLoad);
		http.send(data);
	}

	function logOut() {
		window.onunload = function(){}; // eslint-disable-line no-empty-function
		window.location = "?logout";
	}

	function init(oidcSettings, loginPage) {
		onLogonPage = loginPage;
		var url = window.location.href;
		if (!url.endsWith('/')) {
			url += '/';
		}
		oidcSettings.redirect_uri = url + '#oidc-callback';
		oidcSettings.post_logout_redirect_uri = url + '?logout';
		oidcSettings.silent_redirect_uri = url + "?oidc-silent-refresh";

		mgr = new Oidc.UserManager(oidcSettings);
		mgr.clearStaleState();

		mgr.events.addAccessTokenExpired(function() {
			console.warn("oidc token expired");
      			mgr.removeUser();
			logOut();
		});

		mgr.events.addSilentRenewError(function (err) {
			console.error("oidc silent renew error", err.error);
			if (err) {
				switch (err.error) {
					case 'interaction_required':
					case 'login_required':
						mgr.removeUser();
						logOut();
						return;
					default:
						return;
				}
			}
		});

		mgr.events.addUserLoaded(function (user) {
			mgr.getUser().then(function(user){
				postToken(user);
			});
		});

		mgr.events.addUserSignedOut(function() {
			mgr.removeUser();
		});

		mgr.events.addUserUnloaded(function() {
			logOut();
		});

		if (onLogonPage && window.location.hash.startsWith('#oidc-callback')) {
			mgr.signinRedirectCallback().then(function(user) {
				postToken(user);
				return user;
			}).catch(function(err) {
				console.error('oidc failed to complete authentication', err);
				return null;
			}).then(function(user) {
				remove_hash_from_url();
				if (!user) {
					mgr.signinRedirect();
				}
			});

			return;
		}

		mgr.getUser().then(function(user){
			if (user) {
				postToken(user);
				return;
			}

			mgr.signinSilent().then(function(user) {
				if (user) {
					postToken(user);
				}
				return user;
			}).catch(function(err) {
				console.error('oidc signin silent failed', err);
				return null;
			}).then(function(user) {
				if (!user && onLogonPage) {
					console.debug('oidc signin silent did not return a user');
					// Silent signin failed, login normal
					mgr.signinRedirect().then(function(user) {
						console.debug('oidc signing redirect', user);
					});
				}
			});
		});
	}

	function signOut() {
		mgr.signoutRedirect();
	}

	return {
		init,
		signOut
	};
})();


document.addEventListener('DOMContentLoaded', function() {
	const elem = document.getElementById('oidc-settings');
	if (!elem) {
		return;
	}

	const oidcSettings = JSON.parse(elem.getAttribute('content'));
	const firstLogon = elem.getAttribute('logon') === "";
	userManager.init(oidcSettings, firstLogon);
});
