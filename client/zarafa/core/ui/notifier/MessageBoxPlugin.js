/*
 * #dependsFile client/zarafa/core/Container.js
 */
Ext.namespace('Zarafa.core.ui.notifier');

/**
 * @class Zarafa.core.ui.notifier.MessageBoxPlugin
 * @extends Zarafa.core.ui.notifier.NotifyPlugin
 *
 * Special {@link Zarafa.core.ui.notifier.NotifyPlugin NotifyPlugin} which sends all
 * messages to the user using a {@link Ext.messageBox MessageBox}. This plugin will be registered to the
 * {@link Zarafa.core.ui.notifier.Notifier notifier} using the name 'messagebox'.
 */
Zarafa.core.ui.notifier.MessageBoxPlugin = Ext.extend(Zarafa.core.ui.notifier.NotifyPlugin, {

	/**
	 * Notify the user with a message.
	 *
	 * The category can be either  "error", "warning", "info" or "debug", or a subtype thereof (e.g. "info.newmail").
	 *
	 * @param {String} category The category which applies to the notification.
	 * @param {String} title The title which must be shown in the message.
	 * @param {String} message The message which should be displayed.
	 * @param {Object} config Configuration object which can be applied to the notifier
	 * This object can contain keys like:
	 * - container: Which is the container to which the notifier should be restricted
	 * - persistent: True to make the message persistent and don't disappear automatically
	 * - destroy: Don't create new message, but destroy previous one
	 * - update: Don't create a new message, but update previous one
	 * - reference: The original message which must be updated by this action
	 * - listeners: Event handlers which must be registered on the element
	 * @return {Ext.MessageBox} The message box
	 */
	notify : function(category, title, message, config)
	{
		var icon;
		if (category.indexOf('info') === 0) {
			icon = Ext.MessageBox.INFO;
		} else if (category.indexOf('warning') === 0) {
			icon = Ext.MessageBox.WARNING;
		} else if (category.indexOf('error') === 0) {
			icon = Ext.MessageBox.ERROR;
		}

		if (Ext.isDefined(config) && !Ext.isEmpty(config.details_message)) {
			return new Zarafa.common.dialogs.CustomMessageBox({
				title: title,
				msg: message,
				buttonAlign: 'left',
				icon: icon,
				cls: 'k-show-more-details',
				customItems: this.getCustomItems(config),
				customButtons: this.getCustomButtons(),
				fn: this.customButtonsHandler
			});
		} else {
			return Ext.MessageBox.show({
				title: title,
				msg: message,
				icon: icon,
				buttons: Ext.MessageBox.OK
			});
		}
	},

	/**
	 * Helper function which will return the array of items for custom message box.
	 * @param {Object} config Configuration object which can be applied to the notifier.
	 * @returns {Array} Items the array of items which will show in custom message box.
	 */
	getCustomItems: function (config)
	{
		return [{
			xtype: 'textarea',
			grow: true,
			cls: 'k-show-more-details-textarea',
			growMax: 190,
			growMin: 120,
			name: 'textarea',
			ref: '../showmoretextarea',
			hidden: true,
			readOnly: true,
			value: config.details_message,
			listeners: {
				'render': function () {
					this.setWidth(this.ownerCt.getWidth());
				}
			}
		}];
	},

	/**
	 * Helper function use to return array of custom buttons,
	 * Which will add in custom message box.
	 * @returns {Array} Buttons array of button which will show in message box.
	 */
	getCustomButtons: function ()
	{
		return [{
			name: 'showdetails',
			cls: 'zarafa-normal k-window-text-button',
			text: _('Show Details'),
			keepOpenWindow: true
		}, '->', {
			name: 'copydetails',
			cls: 'zarafa-normal',
			iconCls: 'icon_copy',
			hidden: true,
			text: _('Copy Details'),
			keepOpenWindow: true
		}, {
			name: 'cancel',
			cls: 'zarafa-action',
			text: _('Close')
		}];
	},

	/**
	 * Helper function which will return handler function for custom message box.
	 * @param {String} buttonName name of button which was click.
	 * @param {Ext.Button} button Button which was click.
	 */
	customButtonsHandler: function (button)
	{
		var showMoreTextArea = this.dlgItemContainer.showmoretextarea;
		var buttonName = button.name;
		if (buttonName === 'showdetails') {
			var isShowMoreTextVisible = showMoreTextArea.isVisible();
			var showMoreText = isShowMoreTextVisible ? _("Show Details") : _("Hide Details");
			showMoreTextArea.setVisible(!isShowMoreTextVisible);
			button.setText(showMoreText);
			var copyDetailsBtn = this.buttons.find(function (btn) {
				return btn.name === "copydetails";
			});
			copyDetailsBtn.setVisible(!isShowMoreTextVisible);
			this.center();
		} else if (buttonName === 'copydetails') {
			Zarafa.core.Util.copyToClipboard(showMoreTextArea.getValue());
			this.close();
		}
	}
});

Zarafa.onReady(function() {
	container.getNotifier().registerPlugin('messagebox', new Zarafa.core.ui.notifier.MessageBoxPlugin());
});
