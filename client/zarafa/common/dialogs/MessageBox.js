Ext.namespace('Zarafa.common.dialogs');

/**
 * @class Zarafa.common.dialogs.MessageBox
 * @extends Ext.MessageBox
 *
 * Extension to the default {@link Ext.MessageBox MessageBox} which
 * offers some special features like displaying a selection list.
 */
// Use Ext.apply instead of Ext.extend because Ext.MessageBox is not
// a class but an instantiated object. The Ext.apply({}, a, b) trick
// is used to create a full copy of Ext.MessageBox instead of changing
// the existing object.
Zarafa.common.dialogs.MessageBox = Ext.apply({}, Ext.MessageBox, {
	/**
	 * The custom buttons which are added in {@link Ext.MessageBox messagebox}.
	 * it will be removed when {@link Ext.MessageBox messagebox} gets hide.
	 * 
	 * @property
	 * @type Array
	 * @private
	 */
	customButton : undefined,

	/**
	 * Initialize the {@link Ext.MessageBox.dlg Dialog}.
	 * Because the {@link Ext.MessageBox MessageBox} hides the usable
	 * interface from use, we must apply a hack to access the Dialog
	 * before it is displayed to the user.
	 *
	 * This function will add a list of {@link Ext.Component Components}
	 * to the dialog, which can be used to fine-tune the look&feel.
	 *
	 * @param {Array} items The array of items which must be added to the
	 * MessageBox.
	 * @private
	 */
	initDialog : function(items)
	{
		var dlg = Ext.MessageBox.getDialog();

		// Automatically remove all items which we had added.
		// This makes sure we can use the same Dialog multiple times
		dlg.on('hide', function(dlg) {
			dlg.removeAll();
		}, dlg, {single: true});

		// In case the 'hide' event was not fired,
		// we also listen to the destroy event as fallback.
		dlg.on('destroy', function(dlg) {
			dlg.removeAll();
		}, dlg, {single: true});

		// Before showing the dialog, we must first
		// add all items to the dialog.
		dlg.on('beforeshow', function(dlg) {
			dlg.add(items);
		}, dlg, {single: true});
	},

	/**
	 * Displays a message box with OK and Cancel buttons prompting the user to make a selection
	 * from a list of {@link Ext.form.Radio radio} buttons.
	 * If a callback function is passed it will be called after the user
	 * clicks either button, and the id of the button that was clicked (could also be the top-right
	 * close button) and the selected {@link Ext.form.Radio radio} as the two parameters to the callback.
	 * @param {String} title The title bar text
	 * @param {String} msg The message box body text
	 * @param {Function} fn (optional) The callback function invoked after the message box is closed
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the callback is executed. Defaults to the browser wnidow.
	 * @param {Array} selections (optional) Array of configuration objects for the {@link Ext.form.Radio radios} from which the user can select.
	 * @param {String} value (optional) Default value for the {@link Ext.form.RadioGroup radiogroup}.
	 * @return {Zarafa.common.dialogs.RadioMessageBox} this
	 */
	select : function(title, msg, fn, scope, selections, value)
	{
		var label = Ext.create({
			xtype: 'displayfield',
			autoHeight: true,
			autoWidth: true,
			value: msg,
			hideLabel : true,
			htmlEncode : true
		});
		var radioGroup = Ext.create({
			xtype: 'radiogroup',
			hideLabel: true,
			style: 'padding-left: 50px;',
			columns: 1,
			items: selections,
			value: value
		});

		this.initDialog([{
			xtype: 'container',
			anchor: '100% 100%',
			items: [ label, radioGroup ]
		}]);

		Ext.MessageBox.show({
			title : title,
			buttons: Ext.MessageBox.OKCANCEL,
			fn: function(button) {
				Ext.callback(fn, scope || window, [button, radioGroup.getValue()], 1);
			},
			minWidth: Ext.MessageBox.minPromptWidth,
			scope : scope,
			prompt: false,
			value: value
		});

		return this;
	},

	/**
	 * Display {@link Ext.MessageBox messagebox} with custom buttons.
	 * @param {Object} config The config contains the configuration
	 * options of message box as wall as custom buttons.
	 */
	addCustomButtons : function(config)
	{
		var dlg = Ext.MessageBox.getDialog();
		this.customButton = dlg.getFooterToolbar().add(config.customButton);
		Ext.MessageBox.show(config);

		if(!Ext.isEmpty(this.customButton)) {
			Ext.each(this.customButton, function(button) {
				dlg.mon(button, 'click', Ext.createDelegate(this.onButtonClick, config.scope, [config.fn], true), this);
			}, this);
		}

		dlg.on('hide', this.onDestroy, this, {single : true});
		dlg.on('destroy', this.onDestroy, this, {single : true});
	},

	/**
	 * Event handler triggered when custom button is clicked. 
	 * it will hide the {@link Ext.MessageBox messagebox}.
	 * @param {Ext.Button}  button The button which user pressed.
	 * @param {Ext.EventObject} event the event object
	 * @parma {Function} callback The callback function to call when button is pressed.
	 */
	onButtonClick : function(button, event, callback)
	{
		var buttonName = button.name || 'cancel';
		Ext.MessageBox.hide();
		callback.call(this, buttonName);
	},

	/**
	 * Event handler which is triggered when {@link Ext.MessageBox messagebox} gets hide.
	 * also it will remove all custom buttons from message box.
	 * @param {Ext.Window} dlg The window
	 */
	onDestroy : function(dlg)
	{
		if(!Ext.isEmpty(this.customButton)) {
			for(var i = 0; i < this.customButton.length; i++) {
				dlg.getFooterToolbar().remove(this.customButton[i]);
			}
			this.customButton = [];
		}
	}
});
