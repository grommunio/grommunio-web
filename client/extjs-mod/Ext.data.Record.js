(function() {
	Ext.override(Ext.data.Record, {
		/**
		 * Method to extract the initial letters of a sender's name.
		 * If the name is not available, use the email address's first letter.
		 *
		 * @return {String} The string containing the initials
		 */
		getSenderInitials: function()
		{
			var senderName = this.get('sent_representing_name') || this.get('display_name') || this.get('sender_name');
			if (!Ext.isEmpty(senderName)) {
				senderName = senderName.replace(/\(.*?\)/g, '').trim().split(' ');
				var senderInitials = senderName.length > 1 ? senderName.shift().charAt(0) + senderName.pop().charAt(0) : senderName.shift().charAt(0);
				return senderInitials.toUpperCase();
			}

			if (!Ext.isEmpty(this.get('smtp_address'))) {
				var senderInitials = this.get('smtp_address').charAt(0);
				return senderInitials.toUpperCase();
			}

			return "";
		}
	});
})();