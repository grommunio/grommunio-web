Ext.namespace('Ext.MessageBox');
 /**
 * Override the MessageBox singleton provided by ExtJS library to
 * avoid using static/local variables.
 * Making this as a proper class with converting all the local
 * variables into properties and config options.
 * 
 * @class Ext.MessageBox
 * <p>Utility class for generating different styles of message boxes.  The alias Ext.Msg can also be used.<p/>
 * <p>Note that the MessageBox is asynchronous.  Unlike a regular JavaScript <code>alert</code> (which will halt
 * browser execution), showing a MessageBox will not cause the code to stop.  For this reason, if you have code
 * that should only run <em>after</em> some user feedback from the MessageBox, you must use a callback function
 * (see the <code>function</code> parameter for {@link #show} for more details).</p>
 * <p>Example usage:</p>
 *<pre><code>
// Basic alert:
Ext.Msg.alert('Status', 'Changes saved successfully.');

// Prompt for user data and process the result using a callback:
Ext.Msg.prompt('Name', 'Please enter your name:', function(btn, text){
	if (btn == 'ok'){
		// process text value and close...
	}
});

// Show a dialog using config this.options:
Ext.Msg.show({
   title:'Save Changes?',
   msg: 'You are closing a tab that has unsaved changes. Would you like to save your changes?',
   buttons: Ext.Msg.YESNOCANCEL,
   fn: processResult,
   animEl: 'elId',
   icon: Ext.MessageBox.QUESTION
});
</code></pre>
 * 
 */
Ext.MessageBox = Ext.extend(Object, {
	/**
	 * Button config that displays a single OK button
	 * @type Object
	 */
	OK : undefined,
	/**
	 * Button config that displays a single Cancel button
	 * @type Object
	 */
	CANCEL : undefined,
	/**
	 * Button config that displays OK and Cancel buttons
	 * @type Object
	 */
	OKCANCEL : undefined,
	/**
	 * Button config that displays Yes and No buttons
	 * @type Object
	 */
	YESNO : undefined,
	/**
	 * Button config that displays Yes, No and Cancel buttons
	 * @type Object
	 */
	YESNOCANCEL : undefined,
	/**
	 * The CSS class that provides the INFO icon image
	 * @type String
	 */
	INFO : 'ext-mb-info',
	/**
	 * The CSS class that provides the WARNING icon image
	 * @type String
	 */
	WARNING : 'ext-mb-warning',
	/**
	 * The CSS class that provides the QUESTION icon image
	 * @type String
	 */
	QUESTION : 'ext-mb-question',
	/**
	 * The CSS class that provides the ERROR icon image
	 * @type String
	 */
	ERROR : 'ext-mb-error',

	/**
	 * The default height in pixels of the message box's multiline textarea if displayed (defaults to 75)
	 * @type Number
	 */
	defaultTextHeight : 75,
	/**
	 * The maximum width in pixels of the message box (defaults to 600)
	 * @type Number
	 */
	maxWidth : 600,
	/**
	 * The minimum width in pixels of the message box (defaults to 100)
	 * @type Number
	 */
	minWidth : 100,
	/**
	 * The minimum width in pixels of the message box if it is a progress-style dialog.  This is useful
	 * for setting a different minimum width than text-only dialogs may need (defaults to 250).
	 * @type Number
	 */
	minProgressWidth : 250,
	/**
	 * The minimum width in pixels of the message box if it is a prompt dialog.  This is useful
	 * for setting a different minimum width than text-only dialogs may need (defaults to 250).
	 * @type Number
	 */
	minPromptWidth: 250,
	/**
	 * An object containing the default button text strings that can be overriden for localized language support.
	 * Supported properties are: ok, cancel, yes and no.  Generally you should include a locale-specific
	 * resource file for handling language support across the framework.
	 * Customize the default text like so: Ext.MessageBox.buttonText.yes = "oui"; //french
	 * @type Object
	 */
	buttonText : undefined,

	/**
	 * Array which have list of {@Link Ext.MessageBox} properties which should be unique for all browser window
	 * @type Array
	 */
	browserWindowsMessageBoxProps : [
		'dlg',
		'opt',
		'mask',
		'msgEl',
		'buttons',
		'textboxEl',
		'textareaEl',
		'progressBar',
		'iconEl',
		'iconCls'
	],

	/**
	 * The list of registered browser window. It contains object which will hold {@Link Ext.MessageBox.browserWindowsMessageBoxProps props}
	 * which should be unique for all browser window
	 * @property
	 * @type Ext.util.MixedCollection
	 * @private
	 */
	browserWindowsMessageBox : undefined,

	dlg : undefined,
	opt : undefined,
	mask : undefined,
	waitTimer : undefined,
	bodyEl : undefined,
	msgEl : undefined,
	textboxEl : undefined,
	textareaEl : undefined,
	progressBar : undefined,
	pp : undefined, 
	iconEl : undefined,
	spacerEl : undefined,
	buttons : undefined,
	activeTextEl : undefined,
	bwidth : undefined,
	bufferIcon : '',
	iconCls : '',
	buttonNames : ['ok', 'yes', 'no', 'cancel'],
	activeWindowName : undefined,

	constructor : function(config)
	{
		config = config || {};
		this.OK = {ok:true};
		this.CANCEL = {cancel:true};
		this.OKCANCEL = {ok:true, cancel:true};
		this.YESNO = {yes:true, no:true};
		this.YESNOCANCEL = {yes:true, no:true, cancel:true};
		this.buttonText = {
			ok : "OK",
			cancel : "Cancel",
			yes : "Yes",
			no : "No"
		};
		this.browserWindowsMessageBox = new Ext.util.MixedCollection();
	},

	// private
	handleButton : function(button){
		var activeWindow = Zarafa.core.BrowserWindowMgr.getActive();
		this.buttons[button].blur();
		if(this.dlg.isVisible()){
			this.dlg.hide();
			this.handleHide();
			Ext.callback(this.opt.fn, this.opt.scope || activeWindow, [button, this.activeTextEl.dom.value, this.opt], 1);
		}
	},

	// private
	handleHide : function(){
		if(this.opt && this.opt.cls){
			this.dlg.el.removeClass(this.opt.cls);
		}
		this.progressBar.reset();        
	},

	// private
	handleEsc : function(d, k, e){
		if(this.opt && this.opt.closable !== false){
			this.dlg.hide();
			this.handleHide();
		}
		if(e){
			e.stopEvent();
		}
	},

	// private
	updateButtons : function(b){
		var width = 0,
			cfg;
		if(!b){
			Ext.each(this.buttonNames, function(name){
				this.buttons[name].hide();
			}, this);
			return width;
		}
		this.dlg.footer.dom.style.display = '';
		Ext.iterate(this.buttons, function(name, btn){
			cfg = b[name];
			if(cfg){
				btn.show();
				btn.setText(Ext.isString(cfg) ? cfg : Ext.MessageBox.buttonText[name]);
				width += btn.getEl().getWidth() + 15;
			}else{
				btn.hide();
			}
		});
		return width;
	},


	/**
	 * Returns a reference to the underlying {@link Ext.Window} element
	 * @return {Ext.Window} The window
	 */
	getDialog : function(titleText){
		if(!this.dlg){
			var btns = [];
			
			this.buttons = {};
			Ext.each(this.buttonNames, function(name){
				btns.push(this.buttons[name] = new Ext.Button({
					text: this.buttonText[name],
					handler: this.handleButton.createDelegate(this, [name]),
					hideMode: 'offsets'
				}));
			}, this);
			this.dlg = new Ext.Window({
				autoCreate : true,
				title:titleText,
				resizable:false,
				constrain:true,
				constrainHeader:true,
				minimizable : false,
				maximizable : false,
				stateful: false,
				modal: true,
				shim:true,
				buttonAlign:"center",
				width:400,
				height:100,
				minHeight: 80,
				plain:true,
				footer:true,
				closable:true,
				close : function(){
					if(this.opt && this.opt.buttons && this.opt.buttons.no && !this.opt.buttons.cancel){
						this.handleButton("no");
					}else{
						this.handleButton("cancel");
					}
				}.createDelegate(this),
				fbar: new Ext.Toolbar({
					items: btns,
					enableOverflow: false
				})
			});
			// Get proper browser window to render the message box into body element of the same.
			var activeWindow = Zarafa.core.BrowserWindowMgr.getActive();
			this.dlg.render(activeWindow.document.body);
			this.dlg.getEl().addClass('x-window-dlg');
			this.mask = this.dlg.mask;
			this.bodyEl = this.dlg.body.createChild({
				html:'<div class="ext-mb-icon"></div><div class="ext-mb-content"><span class="ext-mb-text"></span><br /><div class="ext-mb-fix-cursor"><input type="text" class="ext-mb-input" /><textarea class="ext-mb-textarea"></textarea></div></div>'
			});
			this.iconEl = Ext.get(this.bodyEl.dom.firstChild);
			var contentEl = this.bodyEl.dom.childNodes[1];
			this.msgEl = Ext.get(contentEl.firstChild);
			this.textboxEl = Ext.get(contentEl.childNodes[2].firstChild);
			this.textboxEl.enableDisplayMode();
			this.textboxEl.addKeyListener([10,13], function(){
				if(this.dlg.isVisible() && this.opt && this.opt.buttons){
					if(this.opt.buttons.ok){
						this.handleButton("ok");
					}else if(this.opt.buttons.yes){
						this.handleButton("yes");
					}
				}
			});
			this.textareaEl = Ext.get(contentEl.childNodes[2].childNodes[1]);
			this.textareaEl.enableDisplayMode();
			this.progressBar = new Ext.ProgressBar({
				renderTo:this.bodyEl
			});
			this.bodyEl.createChild({cls:'x-clear'});

			/**
			 * register browser window with the object of {@Link Ext.MessageBox.browserWindowsMessageBoxProps props}
			 * which should be unique for all browser window.
			 */
			this.browserWindowsMessageBox.add(activeWindow.name,Ext.copyTo({}, this,this.browserWindowsMessageBoxProps ));
			this.activeWindowName = activeWindow.name;
		} else {
			this.textboxEl.enableDisplayMode();
			this.textareaEl.enableDisplayMode();
			this.browserWindowsMessageBox.replace(this.activeWindowName, Ext.copyTo({}, this, this.browserWindowsMessageBoxProps));
		}
		return this.dlg;
	},

	/**
	 * Updates the message box body text
	 * @param {String} text (this.optional) Replaces the message box element's innerHTML with the specified string (defaults to
	 * the XHTML-compliant non-breaking space character '&amp;#160;')
	 * @return {Ext.MessageBox} this
	 */
	updateText : function(text){
		if(!this.dlg.isVisible() && !this.opt.width){
			this.dlg.setSize(this.maxWidth, 100); // resize first so content is never clipped from previous shows
		}
		// Append a space here for sizing. In IE, for some reason, it wraps text incorrectly without one in some cases
		this.msgEl.update(text ? text + ' ' : '&#160;');

		var iw = this.iconCls != '' ? (this.iconEl.getWidth() + this.iconEl.getMargins('lr')) : 0,
			mw = this.msgEl.getWidth() + this.msgEl.getMargins('lr'),
			fw = this.dlg.getFrameWidth('lr'),
			bw = this.dlg.body.getFrameWidth('lr'),
			w;
			
		w = Math.max(Math.min(this.opt.width || iw+mw+fw+bw, this.opt.maxWidth || this.maxWidth),
				Math.max(this.opt.minWidth || this.minWidth, this.bwidth || 0));

		if(this.opt.prompt === true){
			this.activeTextEl.setWidth(w-iw-fw-bw);
		}
		if(this.opt.progress === true || this.opt.wait === true){
			this.progressBar.setSize(w-iw-fw-bw);
		}
		if(Ext.isIE9m && w == this.bwidth){
			w += 4; //Add offset when the content width is smaller than the buttons.    
		}
		this.msgEl.update(text || '&#160;');
		this.dlg.setSize(w, 'auto').center();
		return this;
	},

	/**
	 * Updates a progress-style message box's text and progress bar. Only relevant on message boxes
	 * initiated via {@link Ext.MessageBox#progress} or {@link Ext.MessageBox#wait},
	 * or by calling {@link Ext.MessageBox#show} with progress: true.
	 * @param {Number} value Any number between 0 and 1 (e.g., .5, defaults to 0)
	 * @param {String} progressText The progress text to display inside the progress bar (defaults to '')
	 * @param {String} msg The message box's body text is replaced with the specified string (defaults to undefined
	 * so that any existing body text will not get overwritten by default unless a new value is passed in)
	 * @return {Ext.MessageBox} this
	 */
	updateProgress : function(value, progressText, msg){
		this.progressBar.updateProgress(value, progressText);
		if(msg){
			this.updateText(msg);
		}
		return this;
	},

	/**
	 * Returns true if the message box is currently displayed
	 * @return {Boolean} True if the message box is visible, else false
	 */
	isVisible : function(){
		return this.dlg && this.dlg.isVisible();
	},

	/**
	 * Hides the message box if it is displayed
	 * @return {Ext.MessageBox} this
	 */
	hide : function(){
		var proxy = this.dlg ? this.dlg.activeGhost : null;
		if(this.isVisible() || proxy){
			this.dlg.hide();
			this.handleHide();
			if (proxy){
				// unghost is a private function, but i saw no better solution
				// to fix the locking problem when dragging while it closes
				this.dlg.unghost(false, false);
			} 
		}
		return this;
	},

	/**
	 * Displays a new message box, or reinitializes an existing message box, based on the config this.options
	 * passed in. All display functions (e.g. prompt, alert, etc.) on MessageBox call this function internally,
	 * although those calls are basic shortcuts and do not support all of the config this.options allowed here.
	 * @param {Object} config The following config this.options are supported: <ul>
	 * <li><b>animEl</b> : String/Element<div class="sub-desc">An id or Element from which the message box should animate as it
	 * opens and closes (defaults to undefined)</div></li>
	 * <li><b>buttons</b> : Object/Boolean<div class="sub-desc">A button config object (e.g., Ext.MessageBox.OKCANCEL or {ok:'Foo',
	 * cancel:'Bar'}), or false to not show any buttons (defaults to false)</div></li>
	 * <li><b>closable</b> : Boolean<div class="sub-desc">False to hide the top-right close button (defaults to true). Note that
	 * progress and wait dialogs will ignore this property and always hide the close button as they can only
	 * be closed programmatically.</div></li>
	 * <li><b>cls</b> : String<div class="sub-desc">A custom CSS class to apply to the message box's container element</div></li>
	 * <li><b>defaultTextHeight</b> : Number<div class="sub-desc">The default height in pixels of the message box's multiline textarea
	 * if displayed (defaults to 75)</div></li>
	 * <li><b>fn</b> : Function<div class="sub-desc">A callback function which is called when the dialog is dismissed either
	 * by clicking on the configured buttons, or on the dialog close button, or by pressing
	 * the return button to enter input.
	 * <p>Progress and wait dialogs will ignore this this.option since they do not respond to user
	 * actions and can only be closed programmatically, so any required function should be called
	 * by the same code after it closes the dialog. Parameters passed:<ul>
	 * <li><b>buttonId</b> : String<div class="sub-desc">The ID of the button pressed, one of:<div class="sub-desc"><ul>
	 * <li><tt>ok</tt></li>
	 * <li><tt>yes</tt></li>
	 * <li><tt>no</tt></li>
	 * <li><tt>cancel</tt></li>
	 * </ul></div></div></li>
	 * <li><b>text</b> : String<div class="sub-desc">Value of the input field if either <tt><a href="#show-this.option-prompt" ext:member="show-this.option-prompt" ext:cls="Ext.MessageBox">prompt</a></tt>
	 * or <tt><a href="#show-this.option-multiline" ext:member="show-this.option-multiline" ext:cls="Ext.MessageBox">multiline</a></tt> is true</div></li>
	 * <li><b>this.opt</b> : Object<div class="sub-desc">The config object passed to show.</div></li>
	 * </ul></p></div></li>
	 * <li><b>scope</b> : Object<div class="sub-desc">The scope of the callback function</div></li>
	 * <li><b>icon</b> : String<div class="sub-desc">A CSS class that provides a background image to be used as the body icon for the
	 * dialog (e.g. Ext.MessageBox.WARNING or 'custom-class') (defaults to '')</div></li>
	 * <li><b>iconCls</b> : String<div class="sub-desc">The standard {@link Ext.Window#iconCls} to
	 * add an this.optional header icon (defaults to '')</div></li>
	 * <li><b>maxWidth</b> : Number<div class="sub-desc">The maximum width in pixels of the message box (defaults to 600)</div></li>
	 * <li><b>minWidth</b> : Number<div class="sub-desc">The minimum width in pixels of the message box (defaults to 100)</div></li>
	 * <li><b>modal</b> : Boolean<div class="sub-desc">False to allow user interaction with the page while the message box is
	 * displayed (defaults to true)</div></li>
	 * <li><b>msg</b> : String<div class="sub-desc">A string that will replace the existing message box body text (defaults to the
	 * XHTML-compliant non-breaking space character '&amp;#160;')</div></li>
	 * <li><a id="show-this.option-multiline"></a><b>multiline</b> : Boolean<div class="sub-desc">
	 * True to prompt the user to enter multi-line text (defaults to false)</div></li>
	 * <li><b>progress</b> : Boolean<div class="sub-desc">True to display a progress bar (defaults to false)</div></li>
	 * <li><b>progressText</b> : String<div class="sub-desc">The text to display inside the progress bar if progress = true (defaults to '')</div></li>
	 * <li><a id="show-this.option-prompt"></a><b>prompt</b> : Boolean<div class="sub-desc">True to prompt the user to enter single-line text (defaults to false)</div></li>
	 * <li><b>proxyDrag</b> : Boolean<div class="sub-desc">True to display a lightweight proxy while dragging (defaults to false)</div></li>
	 * <li><b>title</b> : String<div class="sub-desc">The title text</div></li>
	 * <li><b>value</b> : String<div class="sub-desc">The string value to set into the active textbox element if displayed</div></li>
	 * <li><b>wait</b> : Boolean<div class="sub-desc">True to display a progress bar (defaults to false)</div></li>
	 * <li><b>waitConfig</b> : Object<div class="sub-desc">A {@link Ext.ProgressBar#waitConfig} object (applies only if wait = true)</div></li>
	 * <li><b>width</b> : Number<div class="sub-desc">The width of the dialog in pixels</div></li>
	 * </ul>
	 * Example usage:
	 * <pre><code>
Ext.Msg.show({
title: 'Address',
msg: 'Please enter your address:',
width: 300,
buttons: Ext.MessageBox.OKCANCEL,
multiline: true,
fn: saveAddress,
animEl: 'addAddressBtn',
icon: Ext.MessageBox.INFO
});
</code></pre>
	 * @return {Ext.MessageBox} this
	 */
	show : function(options){
		if(this.isVisible()){
			this.hide();
		}
		this.opt = options;
		var d = this.getDialog(this.opt.title || "&#160;");

		d.setTitle(this.opt.title || "&#160;");
		var allowClose = (this.opt.closable !== false && this.opt.progress !== true && this.opt.wait !== true);
		d.tools.close.setDisplayed(allowClose);
		this.activeTextEl = this.textboxEl;
		this.opt.prompt = this.opt.prompt || (this.opt.multiline ? true : false);
		if(this.opt.prompt){
			if(this.opt.multiline){
				this.textboxEl.hide();
				this.textareaEl.show();
				this.textareaEl.setHeight(Ext.isNumber(this.opt.multiline) ? this.opt.multiline : this.defaultTextHeight);
				this.activeTextEl = this.textareaEl;
			}else{
				this.textboxEl.show();
				this.textareaEl.hide();
			}
		}else{
			this.textboxEl.hide();
			this.textareaEl.hide();
		}
		this.activeTextEl.dom.value = this.opt.value || "";
		if(this.opt.prompt){
			d.focusEl = this.activeTextEl;
		}else{
			var bs = this.opt.buttons;
			var db = null;
			if(bs && bs.ok){
				db = this.buttons["ok"];
			}else if(bs && bs.yes){
				db = this.buttons["yes"];
			}
			if (db){
				d.focusEl = db;
			}
		}
		if(Ext.isDefined(this.opt.iconCls)){
		  d.setIconClass(this.opt.iconCls);
		}
		this.setIcon(Ext.isDefined(this.opt.icon) ? this.opt.icon : this.bufferIcon);
		this.bwidth = this.updateButtons(this.opt.buttons);
		this.progressBar.setVisible(this.opt.progress === true || this.opt.wait === true);
		this.updateProgress(0, this.opt.progressText);
		this.updateText(this.opt.msg);
		if(this.opt.cls){
			d.el.addClass(this.opt.cls);
		}
		d.proxyDrag = this.opt.proxyDrag === true;
		d.modal = this.opt.modal !== false;
		d.mask = this.opt.modal !== false ? this.mask : false;
		if(!d.isVisible()){
			// force it to the end of the z-index stack so it gets a cursor in FF
			// Get proper browser window to render the message box into body element of the same.
			var activeWindow = Zarafa.core.BrowserWindowMgr.getActive();
			activeWindow.document.body.appendChild(this.dlg.el.dom);
			d.setAnimateTarget(this.opt.animEl);
			//workaround for window internally enabling keymap in afterShow
			d.on('show', function(){
				if(allowClose === true){
					d.keyMap.enable();
				}else{
					d.keyMap.disable();
				}
			}, this, {single:true});
			d.show(this.opt.animEl);
		}
		if(this.opt.wait === true){
			this.progressBar.wait(this.opt.waitConfig);
		}
		return this;
	},

	/**
	 * Adds the specified icon to the dialog.  By default, the class 'ext-mb-icon' is applied for default
	 * styling, and the class passed in is expected to supply the background image url. Pass in empty string ('')
	 * to clear any existing icon. This method must be called before the MessageBox is shown.
	 * The following built-in icon classes are supported, but you can also pass in a custom class name:
	 * <pre>
Ext.MessageBox.INFO
Ext.MessageBox.WARNING
Ext.MessageBox.QUESTION
Ext.MessageBox.ERROR
	 *</pre>
	 * @param {String} icon A CSS classname specifying the icon's background image url, or empty string to clear the icon
	 * @return {Ext.MessageBox} this
	 */
	setIcon : function(icon){
		if(!this.dlg){
			this.bufferIcon = icon;
			return;
		}
		this.bufferIcon = undefined;
		if(icon && icon != ''){
			this.iconEl.removeClass('x-hidden');
			this.iconEl.replaceClass(this.iconCls, icon);
			this.bodyEl.addClass('x-dlg-icon');
			this.iconCls = icon;
		}else{
			this.iconEl.replaceClass(this.iconCls, 'x-hidden');
			this.bodyEl.removeClass('x-dlg-icon');
			this.iconCls = '';
		}
		return this;
	},

	/**
	 * Displays a message box with a progress bar.  This message box has no buttons and is not closeable by
	 * the user.  You are responsible for updating the progress bar as needed via {@link Ext.MessageBox#updateProgress}
	 * and closing the message box when the process is complete.
	 * @param {String} title The title bar text
	 * @param {String} msg The message box body text
	 * @param {String} progressText (this.optional) The text to display inside the progress bar (defaults to '')
	 * @return {Ext.MessageBox} this
	 */
	progress : function(title, msg, progressText){
		this.show({
			title : title,
			msg : msg,
			buttons: false,
			progress:true,
			closable:false,
			minWidth: this.minProgressWidth,
			progressText: progressText
		});
		return this;
	},

	/**
	 * Displays a message box with an infinitely auto-updating progress bar.  This can be used to block user
	 * interaction while waiting for a long-running process to complete that does not have defined intervals.
	 * You are responsible for closing the message box when the process is complete.
	 * @param {String} msg The message box body text
	 * @param {String} title (this.optional) The title bar text
	 * @param {Object} config (this.optional) A {@link Ext.ProgressBar#waitConfig} object
	 * @return {Ext.MessageBox} this
	 */
	wait : function(msg, title, config){
		this.show({
			title : title,
			msg : msg,
			buttons: false,
			closable:false,
			wait:true,
			modal:true,
			minWidth: this.minProgressWidth,
			waitConfig: config
		});
		return this;
	},

	/**
	 * Displays a standard read-only message box with an OK button (comparable to the basic JavaScript alert prompt).
	 * If a callback function is passed it will be called after the user clicks the button, and the
	 * id of the button that was clicked will be passed as the only parameter to the callback
	 * (could also be the top-right close button).
	 * @param {String} title The title bar text
	 * @param {String} msg The message box body text
	 * @param {Function} fn (this.optional) The callback function invoked after the message box is closed
	 * @param {Object} scope (this.optional) The scope (<code>this</code> reference) in which the callback is executed. Defaults to the browser wnidow.
	 * @return {Ext.MessageBox} this
	 */
	alert : function(title, msg, fn, scope){
		this.show({
			title : title,
			msg : msg,
			buttons: this.OK,
			fn: fn,
			scope : scope,
			minWidth: this.minWidth
		});
		return this;
	},

	/**
	 * Displays a confirmation message box with Yes and No buttons (comparable to JavaScript's confirm).
	 * If a callback function is passed it will be called after the user clicks either button,
	 * and the id of the button that was clicked will be passed as the only parameter to the callback
	 * (could also be the top-right close button).
	 * @param {String} title The title bar text
	 * @param {String} msg The message box body text
	 * @param {Function} fn (this.optional) The callback function invoked after the message box is closed
	 * @param {Object} scope (this.optional) The scope (<code>this</code> reference) in which the callback is executed. Defaults to the browser wnidow.
	 * @return {Ext.MessageBox} this
	 */
	confirm : function(title, msg, fn, scope){
		this.show({
			title : title,
			msg : msg,
			buttons: this.YESNO,
			fn: fn,
			scope : scope,
			icon: this.QUESTION,
			minWidth: this.minWidth
		});
		return this;
	},

	/**
	 * Displays a message box with OK and Cancel buttons prompting the user to enter some text (comparable to JavaScript's prompt).
	 * The prompt can be a single-line or multi-line textbox.  If a callback function is passed it will be called after the user
	 * clicks either button, and the id of the button that was clicked (could also be the top-right
	 * close button) and the text that was entered will be passed as the two parameters to the callback.
	 * @param {String} title The title bar text
	 * @param {String} msg The message box body text
	 * @param {Function} fn (this.optional) The callback function invoked after the message box is closed
	 * @param {Object} scope (this.optional) The scope (<code>this</code> reference) in which the callback is executed. Defaults to the browser wnidow.
	 * @param {Boolean/Number} multiline (this.optional) True to create a multiline textbox using the defaultTextHeight
	 * property, or the height in pixels to create the textbox (defaults to false / single-line)
	 * @param {String} value (this.optional) Default value of the text input element (defaults to '')
	 * @return {Ext.MessageBox} this
	 */
	prompt : function(title, msg, fn, scope, multiline, value){
		this.show({
			title : title,
			msg : msg,
			buttons: this.OKCANCEL,
			fn: fn,
			minWidth: this.minPromptWidth,
			scope : scope,
			prompt:true,
			multiline: multiline,
			value: value
		});
		return this;
	},

	/**
	 * Function which is use to set active browser window messageBox.
	 * It will check that given browser window was registered in {@Link Ext.MessageBox.browserWindowsMessageBox}
	 * If it was not registered then re initialize a set of {@Link Ext.MessageBox.browserWindowsMessageBoxProps props}
	 * of {@link Ext.MessageBox} so it will create new object and registered in {@Link Ext.MessageBox.browserWindowsMessageBox}
	 * And if given browser window was already registered then get {@Link Ext.MessageBox.browserWindowsMessageBox}
	 * for particular browser window and apply it to {@link Ext.MessageBox}
	 */
	setActiveWindowMessageBox: function (browserWindowName)
	{
		var activeMessageBox = this.browserWindowsMessageBox.get(browserWindowName);
		if (!activeMessageBox) {
			var defaultMessageBoxConfig = {};
			Ext.each(this.browserWindowsMessageBoxProps, function (item) {
				defaultMessageBoxConfig[item] = undefined;
			});
			Ext.apply(this, defaultMessageBoxConfig);
		} else {
			this.browserWindowsMessageBox.replace(this.activeWindowName, Ext.copyTo({}, this, this.browserWindowsMessageBoxProps));
			Ext.apply(this, activeMessageBox);
		}

		this.activeWindowName = browserWindowName;
	},

	/**
	 * De-register an already registered message box for given browser window object from the {@link Ext.MessageBox#browserWindowsMessageBox}.
	 * @param {Object} browserWindowName The browser window object name
	 */
	removeBrowserWindowMessageBox : function(browserWindowName)
	{
		this.browserWindowsMessageBox.removeKey(browserWindowName);
	}
});
Ext.MessageBox = new Ext.MessageBox();

/**
 * Shorthand for {@link Ext.MessageBox}
 */
Ext.Msg = Ext.MessageBox;
