Ext.namespace('Zarafa.plugins.smime');

/**
 * @class Zarafa.plugins.smime.SmimeText
 * Singleton which holds two functions with translation messages for certain status codes from PHP for S/MIME messages
 * One helper function to create a message.
 * @singleton
 */
Zarafa.plugins.smime.SmimeText = function () {
	return {
		/*
		 * Helper function to create the popup body message
		 *
		 * @param {String} text
		 * @return {String} popup text
		 */
		createMessage: function (text) {
			return _('grommunio Web can verify digital signatures of emails. A successful verification reassures you that the message has not been tampered with and validates the identity of the sender.') +
				"<br><br>" + _('You are seeing this message because the verification of the digital signature') + "<b>" + _(' has failed') + "</b>" + _(' for this message.') + "<br>" +
				"<br><b>" + _('What caused this issue?') + "</b><br><br>" +
				text +
				"<br><br><b>" + _('What should I do?') + "</b><br><br>" +
				_('You can continue to work. However, you should keep in mind that the identity and the authenticity of the message content could not be verified.') +
				"<br><br>" + _('You can contact your helpdesk or system administrator if you are not sure what to do next.');
		},

		/**
		 * S/MIME Popup text
		 * Function which returns the text for the popup which is drawn when a users clicks on the smimeInfo button
		 *
		 * @param {Number} index status code from PHP
		 * @return {String} popup text
		 */
		getPopupText: function (index) {
			switch (index) {
			// Verified successfully
			case 0:
				return _('grommunio Web can verify digital signatures of emails. A successful verification reassures you ') +
					_('that the message has not been tampered with and validates the identity of the sender.') + "<br><br>" +
					_('The verification of the digital signature was successful for this email message.');
			// Could not verify, missing public certificate
			case 1:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('grommunio Web could not find a public certificate for the recipient.'));
			// Signature verified, but certificate expired
			case 2:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The identity of the sender and authenticity of the message content have been verified, but the certificate used to sign the message expired on [d-m-Y].'));
			// Signature could not be verified
			case 3:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The digital signature could not be verified for unknown reasons.'));
			// Signature has been revoked
			case 4:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The digital certificate used to sign this message has been revoked (i.e. the sender has marked it as compromised)'));
			// The verification step with the Certificate Authority failed
			case 5:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The verification service of the certificate authority that signed the sender\'s certificate is not available. The validity of the certificate could not be verified.'));
			// Certificate does not support OCSP
			case 9:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The revocation status of the digital certificate used to sign this email is unknown (Server is unavailable or certificate does not support OCSP). The validity of the certificate could not be verified.'));
			// OCSP check disabled
			case 10:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The revocation status of the digital certificate used to sign this email is disabled (OCSP). The validity of the certificate could not be verified.'));
			// OCSP server offline
			case 11:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('The certificate verification server (OCSP) is temporarily offline.'));
			// User
			case 13:
				return Zarafa.plugins.smime.SmimeText.createMessage(_('Sender is removed from the server.'));
			}
		},

		/**
		 * Function to retrieve the status messages for the corresponding status code from PHP
		 * The translated text is drawn in the S/MIME previewpanel button
		 *
		 * @param {Number} index
		 * @return {String} text 
		 */
		getMessageInfo: function (index) {
			switch (index) {
			case 0:
				return _('Signature verified successfully');
			case 1:
				return _('Could not verify signature, missing public certificate');
			case 2:
				return _('Signature verification successful, but certificate is expired');
			case 3:
				return _('Signature could not be verified');
			case 4:
				return _('Certificate has been revoked');
			case 5:
				return _('Verification with Certificate Authority failed');
			case 6:
				return _('Message decrypted succesfully');
			case 7:
				return _('Message decryption failed');
			case 8:
				return _('Please') + '<b> ' + _('click here') + ' </b> ' + _('to unlock your certificate');
			case 9:
				return _('Cannot determine revocation status of certificate');
			case 10:
				return _('Signature verified');
			case 11:
				return _('Cannot determine revocation status of certificate');
			case 12:
				return _('Unable to decrypt this message. Certificate does not match');
			case 13:
				return _('Verification failed. User is removed from the server.');
			}
		},

		/**
		 * Function which returns the css class for the corresponding error code
		 *
		 * @param {Number} index
		 * @return {String} text 
		 */
		getStatusMessageClass: function (index) {
			switch (index) {
			case 0:
				return 'smime-info-good';
			case 1:
				return 'smime-info-partial';
			case 2:
				return 'smime-info-fatal';
			case 3:
				return 'smime-info-info';
			}
		},

		/**
		 * Function which returns the popup status for the corresponding error code
		 *
		 * @param {Number} index
		 * @return {String} text 
		 */
		getPopupStatus: function (index) {
			switch (index) {
			case 0:
				return '';
			case 1:
				return 'warning';
			case 2:
				return 'error';
			}
		}
	};
}();
