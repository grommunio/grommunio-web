Ext.namespace('Zarafa.common.dialogs');

/**
 * @class Zarafa.common.dialogs.CustomMessageBox
 * @extends Ext.Window
 *
 * Custom message box display message box with given message.
 * It will offers create message box with custom elements and custom buttons.
 */
Zarafa.common.dialogs.CustomMessageBox = Ext.extend(Ext.Window, {

	/**
	 * List of {@link Ext.Element} which will append into body of message box.
	 * @type Array
	 */
	customItems: [],

	/**
	 * List of {@link Ext.Button} which will append into footer bar of message box.
	 * @type Array
	 */
	customButtons: [],

	/**
	 * The maximum width in pixels of the message box (defaults to 600)
	 * @type Number
	 */
	maxWidth: 600,
	/**
	 * The minimum width in pixels of the message box (defaults to 100)
	 * @type Number
	 */
	minWidth: 320,

	/**
	 * A callback function which is called when the dialog is dismissed either by clicking on the configured buttons,
	 * or on the dialog close button, or by pressing the return button to enter input.
	 * @type Function
	 */
	fn: Ext.emptyFn,

	/**
	 * A CSS class that provides a background image to be used as the body icon for the dialog.
	 *@type String
	 */
	icon: '',

	/**
	 * A string that will replace the existing message box body text
	 * @type String
	 */
	msg : '&#160;',

	/**
	 * Body element of the dialog.
	 * @type Ext.Element
	 */
	bodyEl : undefined,

	/**
	 * Body icon for the dialog.
	 * @type Ext.Element
	 */
	iconEl : undefined,

	/**
	 * Body message element of the dialog.
	 * @type Ext.Element
	 */
	msgEl : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config)
	{
		config = config || {};
		Ext.each(config.customButtons, function (btn) {
			Ext.applyIf(btn, {
				handler: this.handleButton,
				hideMode: 'offsets',
				scope: this
			});
		}, this);

		Ext.applyIf(config, {
			xtype: 'panel',
			modal: true,
			shim: true,
			resizable: false,
			constrain: true,
			constrainHeader: true,
			minimizable: false,
			maximizable: false,
			stateful: false,
			buttonAlign: 'center',
			autoHeight: true,
			fbar: config.customButtons,
			listeners: {
				beforeshow: this.onBeforeShow,
				scope: this
			}
		});

		Zarafa.common.dialogs.CustomMessageBox.superclass.constructor.call(this, config);
		this.show();
	},

	/**
	 * Handler which is fires before the component is shown by calling the show method.
	 * It will create child elements of message body and initialize value of the child elements.
	 */
	onBeforeShow: function ()
	{
		this.bodyEl = this.body.createChild({
			html:'<div class="ext-mb-icon"></div><div class="ext-mb-content"><span class="ext-mb-text"></span></div>'
		});
		this.iconEl = Ext.get(this.bodyEl.dom.firstChild);
		var contentEl = this.bodyEl.dom.childNodes[1];
		this.msgEl = Ext.get(contentEl.firstChild);
		this.addClass('x-window-dlg');
		this.initDialog([{
			xtype: 'container',
			anchor: '100% 100%',
			items: [this.customItems]
		}]);
		this.setIcon();
		this.updateText();

		// Set default button which has 'zarafa-action' class.
		var defaultButton = this.buttons.find(function (btn) {
			if (btn.getEl()) {
				return btn.getEl().hasClass('zarafa-action');
			}
		});
		Ext.applyIf(this, {
			defaultButton: defaultButton
		});
	},


	/**
	 * Initialize the {@link Zarafa.common.dialogs.CustomMessageBox Dialog} with {#customItems}.
	 * @param {Array} items The array of items which must be added to the Custom MessageBox.
	 * @private
	 */
	initDialog: function (items)
	{
		// Add a container to be able to position the items after a possible msg text
		if (!this.dlgItemContainer) {
			this.dlgItemContainer = this.dlgItemContainer || new Ext.Container({
					border: false
				});
			this.dlgItemContainer.render(this.body);
		}

		// Before showing the dialog, we must first
		// add all items to the dialog.
		this.on('show', function () {
			this.dlgItemContainer.add(items);
			this.dlgItemContainer.doLayout();
		}, this, {single: true});
	},

	/**
	 * Updates the custom message box body text with {#msg} and
	 * resize the dialog width as per content of message.
	 */
	updateText: function ()
	{
		this.msgEl.update(this.msg);
		var iw = this.iconCls != '' ? (this.iconEl.getWidth() + this.iconEl.getMargins('lr')) : 0,
			mw = this.msgEl.getWidth() + this.msgEl.getMargins('lr'),
			fw = this.getFrameWidth('lr'),
			bw = this.body.getFrameWidth('lr'),
			w;

		// Width of {@link #msgEl message element} including frame width, {@link #iconEl icon width} and
		// it should be smaller than {@link #maxWidth}.
		var msgElWidth = Math.min(this.width || iw + mw + fw + bw, this.maxWidth);

		// Width of footer toolbar, It is considering width of all toolbar buttons.
		var fbarWidth = 0;
		this.buttons.forEach(function (button) {
			fbarWidth += button.getResizeEl() ? button.getWidth() : button.minWidth;
		});

		w = Math.max(msgElWidth, this.minWidth, fbarWidth);

		this.msgEl.update(this.msg || '&#160;');
		this.setSize(w, 'auto').center();
	},

	/**
	 * Adds {#icon} class into the {#iconEl} icon element of the dialog.
	 * If icon is not available then set hidden class for the {#iconEl} icon element
	 */
	setIcon: function ()
	{
		if (!Ext.isEmpty(this.icon)) {
			this.iconEl.addClass(this.icon);
			this.bodyEl.addClass('x-dlg-icon');
		} else {
			this.iconEl.addClass('x-hidden');
			this.bodyEl.removeClass('x-dlg-icon');
		}
	},

	/**
	 * Handler for click event of all {#customButtons buttons}
	 * It will call callback of button and close the custom message box.
	 * @param {Ext.Button} button button which is clicked.
	 */
	handleButton: function (button)
	{
		if (!button.keepOpenWindow) {
			this.close();
		}
		Ext.callback(this.fn, this, [button]);
	}
});
