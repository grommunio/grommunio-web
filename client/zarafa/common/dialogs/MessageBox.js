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
Zarafa.common.dialogs.MessageBox = Ext.apply({}, {
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
		var dlg = this.getDialog();

		// Add a container to be able to position the items after a possible msg text
		if ( !this.dlgItemContainer ){
			this.dlgItemContainer = this.dlgItemContainer || new Ext.Container({
				border: false,
				cls: 'my-cont'
			});
			this.dlgItemContainer.render(dlg.body);
		}

		// Automatically remove all items which we had added.
		// This makes sure we can use the same Dialog multiple times
		dlg.on('hide', function(dlg) {
			this.dlgItemContainer.removeAll();
		}, this, {single: true});

		// In case the 'hide' event was not fired,
		// we also listen to the destroy event as fallback.
		dlg.on('destroy', function(dlg) {
			this.dlgItemContainer.removeAll();
		}, this, {single: true});

		// Before showing the dialog, we must first
		// add all items to the dialog.
		dlg.on('show', function(dlg) {
			this.dlgItemContainer.add(items);
			this.dlgItemContainer.doLayout();
		}, this, {single: true});
	},

    /**
     * Extension of {@link Ext.MessageBox.show} that adds the following configuration options:<ul>
     * <li><b>checkbox</b> : Boolean<div class="sub-desc">When set to true a checkbox will be added to the bottom
     * of the MessageBox.</div></li>
     * <li><b>checkboxLabel</b> : String<div class="sub-desc">The label of the checkbox that will be added when
     * the checkbox config option is set to true. (defaults to 'Do not show this message again')</div></li>
     * <li><b>fn</b> : Function<div class="sub-desc">A callback function which is called when the dialog is dismissed either
     * by clicking on the configured buttons, or on the dialog close button, or by pressing
     * the return button to enter input.
     * <p>Progress and wait dialogs will ignore this option since they do not respond to user
     * actions and can only be closed programmatically, so any required function should be called
     * by the same code after it closes the dialog. Parameters passed:<ul>
     * <li><b>buttonId</b> : String<div class="sub-desc">The ID of the button pressed, one of:<div class="sub-desc"><ul>
     * <li><tt>ok</tt></li>
     * <li><tt>yes</tt></li>
     * <li><tt>no</tt></li>
     * <li><tt>cancel</tt></li>
     * </ul></div></div></li>
     * <li><b>text</b> : String<div class="sub-desc">Value of the input field if either <tt><a href="#show-option-prompt" ext:member="show-option-prompt" ext:cls="Ext.MessageBox">prompt</a></tt>
     * or <tt><a href="#show-option-multiline" ext:member="show-option-multiline" ext:cls="Ext.MessageBox">multiline</a></tt> is true</div></li>
     * <li><b>checked</b> : Boolean<div class="sub-desc">Value of the checkbox field. (Will only be passed when the
     * checkbox option was set to true in the config object)</div></li>
     * <li><b>opt</b> : Object<div class="sub-desc">The config object passed to show.</div></li>
     * </ul></p></div></li>
     * </ul>
     *
     * @param {Object} config The configuration options of the the MessageBox. See above and {@link Ext.MessageBox.show}
     * for more information.
     * @return {Zarafa.common.dialogs.MessageBox} this
     */
	show : function(config)
	{
		config.title = config.title || _('Kopano WebApp');

		if ( config.checkbox !== true ){
			return Ext.MessageBox.show.call(this, config);
		}

		// If no checkboxState was set we will set it to false (=unchecked)
		var checkboxState = !!config.checkboxState;

		var cb = {
			xtype: 'container',
			cls: 'k-cb-dontshowagain',
			items: [{
				xtype: 'checkbox',
				ctCls: 'k-cb-dontshowagain',
				boxLabel: config.checkboxLabel || _('Do not show this message again.'),
				checked: checkboxState,
				listeners: {
					check: function(cb, checked){
						checkboxState = checked;
					}
				},
				scope: this
			}]
		};

		this.initDialog([cb]);

		// Make sure the checkbox state is also passed to the callback function
		if ( Ext.isFunction(config.fn) ){
			var origFn = config.fn;
			config.fn = function(buttonid, text, opts){
				origFn.call(this, buttonid, text, checkboxState, opts);
			}.bind(config.scope || null);
		}

		return Ext.MessageBox.show.call(this, config);
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
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the callback is executed. Defaults to the browser window.
	 * @param {Array} selections (optional) Array of configuration objects for the {@link Ext.form.Radio radios} from which the user can select.
	 * @param {String} value (optional) Default value for the {@link Ext.form.RadioGroup radiogroup}.
	 * @param {String} customButton (optional) buttons which need to show in message box. this buttons contains custom name's.
	 * @return {Zarafa.common.dialogs.RadioMessageBox} this
	 */
	select : function(title, msg, fn, scope, selections, value, customButton)
	{
		var radioGroup = Ext.create({
			xtype: 'radiogroup',
			hideLabel: true,
			style: 'padding-left: 50px;',
			columns: 1,
			items: selections,
			value: value,
			listeners : {
				change : this.onChange,
				scope : this
			}
		});
		this.initDialog([{
			xtype: 'container',
			anchor: '100% 100%',
			items: [ radioGroup ]
		}]);

		if(!Ext.isEmpty(customButton)) {
			var config = {};
			Ext.apply(config, {
				title : title,
				msg: msg + '<br />',
				minWidth: this.minPromptWidth,
				maxWidth: 250,
				scope : scope,
				fn : fn,
				prompt: false,
				value: value,
				customButton : customButton,
				radioGroup : radioGroup
			});
			this.addCustomButtons(config);
		} else {
			this.show({
				title : title,
				msg: msg + '<br />',
				buttons: Ext.MessageBox.OKCANCEL,
				fn: function(button) {
					Ext.callback(fn, scope || window, [button, radioGroup.getValue()], 1);
				},
				minWidth: this.minPromptWidth,
				maxWidth: 250,
				scope : scope,
				prompt: false,
				value: value
			});
		}
		return this;
	},

	/**
	 * Event handler triggered when radio button of {@link #select} message box
	 * gets changed.
	 *
	 * @param {Ext.form.RadioGroup} radioGroup the radioGroup which triggers this event.
	 * @param {Ext.form.Radio} radio the radio which listen the event.
	 */
	onChange : function (radioGroup, radio) {
		if(radio.hideButtonText) {
			var fbar = this.getDialog().getFooterToolbar();
			var btn = fbar.find('name', radio.hideButtonText)[0];
			if(Ext.isDefined(btn)) {
				btn.setText(Ext.util.Format.capitalize(radio.showButtonText));
				btn.name = radio.showButtonText;
			}
		}
	},

	/**
	 * Display {@link Ext.MessageBox messagebox} with custom buttons.
	 * @param {Object} config The config contains the configuration
	 * options of message box as wall as custom buttons.
	 */
	addCustomButtons : function(config)
	{
		var dlg = this.getDialog();
		this.customButton = dlg.getFooterToolbar().add(config.customButton);
		this.show(config);

		if(!Ext.isEmpty(this.customButton)) {
			Ext.each(this.customButton, function(button) {
				var args = [];
				args.push(config.fn);
				if(Ext.isDefined(config.radioGroup)) {
					args.push(config.radioGroup);
				}
				dlg.mon(button, 'click', Ext.createDelegate(this.onButtonClick, config.scope, args, true), this);
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
	 * @parma {Ext.form.RadioGroup} radioGroup The radioGroup contains if message box triggered from {@link #select} message box.
	 */
	onButtonClick : function(button, event, callback, radioGroup)
	{
		var buttonName = button.name || 'cancel';
		Zarafa.common.dialogs.MessageBox.hide();
		if(radioGroup) {
			callback.call(this, buttonName, radioGroup.getValue());
		} else {
			callback.call(this, buttonName);
		}
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
}, Ext.MessageBox);
