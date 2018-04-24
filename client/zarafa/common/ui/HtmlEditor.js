/*
 * #dependsFile client/zarafa/mail/data/ActionTypes.js
 */
Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.HtmlEditor
 * @extends Ext.ux.form.TinyMCETextArea
 * @xtype zarafa.htmleditor
 *
 * Our HtmlEditor is a simple override of the TinyMCE provided HtmlEditor.
 * It automatically enables all buttons which are needed within Zarafa, and adds
 * plugins to extend the HtmlEditor with additional features.
 * The toolbar is extended with the overflow option, which moves all buttons
 * which do not fit within the length of the toolbar to a new popup menu at
 * the right position of the toolbar.
 */
Zarafa.common.ui.HtmlEditor = Ext.extend(Ext.ux.form.TinyMCETextArea, {

	/**
	 * @cfg {String} defaultFontFamily is contains the default font family,
	 * which is apply in html editor.
	 */
	defaultFontFamily : undefined,

	/**
	 * @cfg {String} defaultFontSize is contains the default font size,
	 * which is apply in html editor.
	 */
	defaultFontSize : undefined,

	/**
	 * @constructor
	 * @param config configuration object
	 * @cfg enableOverflow set {@link Ext.Toolbar.enableOverflow enableOverflow} on the toolbar.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Get supported font families and sizes
		var fontSizes = Zarafa.common.ui.htmleditor.Fonts.getFontSizeString();
		var fontFamilies = Zarafa.common.ui.htmleditor.Fonts.getFontFamilies();

		var powerpasteConfig = container.getServerConfig().getPowerpasteConfig();

		var baseUrl = container.getServerConfig().getBaseUrl();

		var webdingsStyle = '';
		if ( (Ext.isGecko && !Ext.isIE && !Ext.isEdge) || !Zarafa.wingdingsInstalled ){
			webdingsStyle =
				"@font-face {" +
					"font-family: 'Wingdings';" +
					"src: url('"+baseUrl+"client/resources/fonts/kopanowebappdings.eot');" +
					"src: url('"+baseUrl+"client/resources/fonts/kopanowebappdings.eot?#iefix') format('embedded-opentype')," +
						"url('"+baseUrl+"client/resources/fonts/kopanowebappdings.woff2') format('woff2')," +
						"url('"+baseUrl+"client/resources/fonts/kopanowebappdings.woff') format('woff')," +
						"url('"+baseUrl+"client/resources/fonts/kopanowebappdings.ttf') format('truetype');" +
					"font-weight: normal;" +
					"font-style: normal;" +
				"}";
		}

		config = Ext.applyIf(config, {
			xtype: 'zarafa.tinymcetextarea',
			hideLabel: true,
			hideMode: 'offsets',
			readOnly: false,
			tinyMCEConfig :{
				delta_height: 1,
				plugins: ["advlist emoticons directionality lists image charmap searchreplace textcolor table"],
				// Add the powerpaste as an external plugin so we can update tinymce by just replacing
				// the contents of its folder without removing the powerpaste plugin
				// Note: the path is relative to the path of tinymce
				external_plugins: {
					link: "../tinymce-plugins/link/plugin.js",
					powerpaste: "../tinymce-plugins/powerpaste/plugin.min.js"
				},
				powerpaste_word_import: powerpasteConfig.powerpaste_word_import,
				powerpaste_html_import: powerpasteConfig.powerpaste_html_import,
				powerpaste_allow_local_images: powerpasteConfig.powerpaste_allow_local_images,
				toolbar1 : "fontselect fontsizeselect | bold italic underline strikethrough | subscript superscript | forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | ltr rtl | bullist numlist | table | searchreplace | link unlink | undo redo | charmap emoticons image hr removeformat",
				extended_valid_elements : 'a[name|href|target|title|onclick|dir],img[class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name|style],table[style|dir|class|border=1|cellspacing|cellpadding|bgcolor|id],colgroup,col[style|dir|width],tbody,tr[style|dir|class],td[style|dir|class|colspan|rowspan|width|height],hr[class|width|size|noshade],font[face|size|color|style|dir],span[class|align|style|dir|br],p[class|style|dir|span|br]',
				paste_data_images : true,
				automatic_uploads: false,
				remove_trailing_brs: false,
				valid_children : '+body[style]',
				font_formats : fontFamilies,
				fontsize_formats: fontSizes,
				browser_spellcheck : true,
				menubar : false,
				statusbar : false,
				// Note: When the skin is changed, be sure to also update the import statement in design.scss!
				skin: 'white',
				// Set our own class on anchor's to override TinyMCE's default anchor class.
				visual_anchor_class : 'zarafa_tinymce_anchor',
				relative_urls : false,
				remove_script_host : false,
				/*
				 * Using capital latter because value of forced_root_block config option used to compare
				 * node name at many places in tinymce library(specially in createNewTextBlock function
				 * of 'lists' plugin). Default value is small 'p'. Given the fact that node name comparison
				 * resulted in desired manner with capital node names.
				 */
				forced_root_block: 'P',
				forced_root_block_attrs: {
					'style' : 'padding: 0; margin: 0;'
				},
				content_style :
					webdingsStyle +
					'body{ '+
						'word-wrap: break-word;' +
					'}' +
					'p,blockquote{'+
						'font-family : initial;'+
                    	'font-size : medium;'+
					'}'+
					'td, th, p{' +
						'font-family : inherit !important;' +
						'font-size : inherit !important;' +
					'}',
				table_default_styles: {
					width: '10%',
					borderSpacing: 0
				}
			},
			defaultFontFamily : container.getSettingsModel().get('zarafa/v1/main/default_font'),
			defaultFontSize : Zarafa.common.ui.htmleditor.Fonts.getDefaultFontSize()
		});

		// Set the correct language for tinymce
		var lang = container.getSettingsModel().get('zarafa/v1/main/language', true);
		var tinyLanguageCode = Zarafa.common.ui.htmleditor.LanguageMap.getTinyLanguageCode(lang);
		if ( !Ext.isEmpty(tinyLanguageCode) ){
			config.tinyMCEConfig.language = tinyLanguageCode;
			config.tinyMCEConfig.language_url = baseUrl + 'client/tinymce-languages/'+tinyLanguageCode+'.js';
		}


		// Give plugins the option to change the tinyMCE configuration
		container.populateInsertionPoint('common.htmleditor.tinymceconfig', {scope: this, config: config.tinyMCEConfig});

		this.addEvents(
			/**
			 * @event valuecorrection
			 * Fires after {@link #setValue} has been called, and the given value has been
			 * formatted by the browser or tinymce. This allows the user of this component
			 * to better determine what the user-made changes were.
			 * @param {Zarafa.common.ui.HtmlEditor} this The component which fired the event
			 * @param {String} correctedValue The new (by browser corrected) value
			 * @param {String} originalValue The value as set by the caller of setValue
			 */
			'valuecorrection'
		);

		Zarafa.common.ui.HtmlEditor.superclass.constructor.call(this, config);

		this.on('initialized', this.onEditorInitialized, this);
		this.on('beforedestroy', this.onBeforeDestroy, this);
	},

	/**
	 * Function is called when the tinymce editor is initialized.
	 * @param {Zarafa.common.ui.HtmlEditor} htmlEditor The editor which is initialized.
	 * @param {tinymce.Editor} tinymceEditor The tinymce editor instance
	 * @private
	 */
	onEditorInitialized : function(htmlEditor, tinymceEditor)
	{
		var server = container.getServerConfig();
		var clientTimeout = server.getClientTimeout();
		if (clientTimeout){
			this.setIdleTimeEventListeners();
		}

		tinymceEditor.on('keydown', this.onKeyDown.createDelegate(this), this);
		tinymceEditor.on('paste', this.onPaste.createDelegate(this), this);
		tinymceEditor.on('mousedown', this.relayIframeEvent.createDelegate(this), this);

		// Hack alert !
		// hide the Cell menu item from table menu item.
		var tableMenu = tinymceEditor.buttons.table.menu;
		Ext.each(tableMenu, function(menu, i) {
			if(menu.text === 'Cell') {
				delete tinymceEditor.buttons.table.menu[i];
			}
		}, this);

		// Listen for wheel event on underlying iframe as tinyMCE editor isn't providing
		// wheel event.
		if (Zarafa.isDeskApp) {
			var iframeElement = this.getEditor().iframeElement;
			iframeElement.contentWindow.addEventListener('wheel', this.relayIframeEvent.createDelegate(this), true);
		}

        if (Ext.isGecko) {
            tinymceEditor.on('dblclick', this.onDBLClick.createDelegate(this));
            // Get the tab panel only if mainPanel is available to prevent UI rendering
            // while initializing tinymce to just load the source code of tinymce.
            if (container.mainPanel) {
                var contentPanel = container.getTabPanel();
                this.mon(contentPanel, 'beforetabchange', this.onBeforeTabChange, this);
            }
        }

		var listeners = {
			'blur' : this.onBlur,
			'focus' : this.onFocus,
			scope : this
		};

		Ext.EventManager.on(this.getEditor().getWin(), listeners);

		/*
		 * _hasCaretEvents config is used to initialize or avoid the 'disableCaretContainer' function on 'mouseup' and 'keydown'.
		 * 'disableCaretContainer' function removes all elements with id as '_mce_caret'.
		 * We needs to prevent the above mentioned mechanism to keep the first node until default formatting gets applied.
		 */
		tinymceEditor._hasCaretEvents = true;

		tinymceEditor.on('focus', this.onFocus.createDelegate(this), this);
		tinymceEditor.on('blur', this.onBlur.createDelegate(this), this);

		/**
		 * @FIXME: We don't have any way to get the font family and size combo box from tinyMCE,
		 * so we have get combo box like this way.
		 */
		var toolbarGroup = tinymceEditor.theme.panel.find(".toolbar-grp")[0];
		var buttonGroup = toolbarGroup.items()[0];
		var firstGroup = buttonGroup.items();
		var fontFamilyCombo = firstGroup[0];
		var fontSizeCombo = firstGroup[1];

		fontFamilyCombo.on('select', this.onFontFamilyChange.createDelegate(this), this);
		fontSizeCombo.on('select', this.onFontSizeChange.createDelegate(this), this);
		this.applyFontStyles();
		/**
		 * @FIXME: The default formatting needs to be applied after the editor is completely initialized,
		 * and a record needs to be attached/loaded with editor.
		 * But there was a race condition between 'setrecord' event of Zarafa.core.plugins.RecordComponentPlugin
		 * and 'init' event of tinymce, having different behavior between
		 * 1) first instance of tinymce editor
		 * 2) other than first instance
		 * Any event/method based implementation is more reliable as compared to delay/timer based implementation.
		 */
		var defaultFormatTask = new Ext.util.DelayedTask(this.applyEmptyLines, this, [tinymceEditor]);
		defaultFormatTask.delay(5);
	},

	/**
	 * Set event listeners on the iframe that will reset the
	 * {@link Zarafa#idleTime idle time} when the user performs
	 * an action in the iframe (i.e. click, mousemove, keydown)
	 * @private
	 */
	setIdleTimeEventListeners : function()
	{
		var doc = this.getEditorDocument();

		if ( !doc.addEventListener ) {
			// User is using a browser that does not support addEventListener.
			// Probably IE<9 which we don't support.
			// However there is no reason to create errors for IE<9
			// Client timeout will still be handled by the backend though,
			// but the message will only be shown to the user when he tries to
			// connect to the backend after the session has timed out.
			return;
		}

		doc.addEventListener('click', function(){
			Zarafa.idleTime = 0;
		}, true);
		doc.addEventListener('mousemove', function(){
			Zarafa.idleTime = 0;
		}, true);
		doc.addEventListener('keydown', function(){
			Zarafa.idleTime = 0;
		}, true);
	},

	/**
	 * Event handler for the beforedestroy event
	 * The handler will call the remove function the tinyMCE editor, so it can clean up properly.
	 */
	onBeforeDestroy : function()
	{
		var editor = this.getEditor();
		// Check if the editor was activated
		if ( editor ){
			editor.remove();
		}
	},

	/**
	 * Event handler is called when content will be pasted in editor.
	 * the clipboardData is a read-only property of DataTransfer object, the data
	 * affected by the user-initialed cut, copy, or paste operation, along with its MIME type.
	 * if clipboardData and MIME type is specified then register a handler which replace the
	 * carriage return to Br and white space to &nbsp; on {@link tinymce.pasteplugin.Clipboard BeforePastePreProcess} event.
	 * @param {object} event the event object.
	 */
	onPaste : function(event)
	{
		var editor = this.getEditor();
		var editorMgr = editor.editorManager;

		/**
		 * check that current selected browser webkit supported. also check clipboardData and types are
		 * there.
		 */
		if(editorMgr.Env.webkit && event.clipboardData && event.clipboardData.types) {
			var clipboardHtmlContent = event.clipboardData.getData('text/html');
			if(Ext.isEmpty(clipboardHtmlContent)) {
				var clipboardContent = event.clipboardData.getData('text');
				if (clipboardContent && clipboardContent.length > 0) {
					editor.once('BeforePastePreProcess', function(args){
						var replaceCarriage = clipboardContent.replace(/\n/g, '<br/>');
						var replaceWithSpace = replaceCarriage.replace(/\s/g,'&nbsp;');
						args.content = replaceWithSpace;
						return args;
					});
				}
			}
		}

		/**
		 * If browser is IE then before the paste content in editor make it proper formatted content.
		 */
		if (Ext.isIE) {
			var fontName = this.defaultFontFamily;
			var fontSize = this.defaultFontSize;
			editor.once('BeforePastePreProcess', function(args){
				var content = args.content;
				var startingTags = "<p style=\"margin: 0px; padding: 0px; data-mce-style=\"margin: 0px; padding: 0px;\">";
				startingTags += "<span style=\"font-family:"+ fontName +"; font-size:"+ fontSize +"; data-mce-style=\"font-family:"+ fontName +"; font-size:"+ fontSize +";>";
				var closingTags = "<br data-mce-bogus=\"1\"></span></p>";

				var replaceStartingTags = content.replace(/<p>|<P>/g, startingTags);
				var formattedString  = replaceStartingTags.replace(/<\/p>|<\/P>/g, closingTags);

				args.content = formattedString;

				/**
				 * After the paste operation set the cursor position at proper place.
				 */
				editor.once('NodeChange', function(arg) {
					var node = editor.selection.getNode();
					var parentNode = editor.dom.getParent(node, 'p');
					if(parentNode && parentNode.nextSibling) {
						editor.selection.setCursorLocation(parentNode.nextSibling.firstChild , 0);
					}
				});
				return args;
			});
		}
	},

	/**
	 * Event handler is called when fonct family combobox gets change the font type.
	 * @param {object} event the event object
	 */
	onFontFamilyChange : function(event)
	{
		this.defaultFontFamily = event.control.settings.value;
	},

	/**
	 * Event handler is called when fonct size combobox gets change the font size.
	 * @param {object} event the event object
	 */
	onFontSizeChange : function(event)
	{
		this.defaultFontSize = event.control.settings.value;
	},

	/**
	 * Adds an empty line with default formatting before the content in the editor
	 */
	addEmptyLineBeforeContent : function()
	{
		var editor = this.getEditor();

		// Add a P tag to apply default formatting, we can use that empty node it self.
		var firstNode = editor.getBody().firstChild;
		var bogusHtml = '<br data-mce-bogus="1" />';
		var newNode = editor.dom.create('p', editor.settings.forced_root_block_attrs, bogusHtml);
		editor.getBody().insertBefore(newNode, firstNode);
		editor.selection.setCursorLocation(editor.getBody().firstChild, 0);
		this.composeDefaultFormatting(editor);
	},

	/**
	 * Function which is use to set empty lines before composing new mail.
	 * It will add empty lines as per the mail {@link Zarafa.mail.data.ActionTypes action types}.
	 * @param {tinymce.Editor} tinymceEditor The tinymce editor instance
	 * @private
	 */
	applyEmptyLines: function (tinymceEditor)
	{
		if (!this.isDisabled() && this.record && this.record.phantom) {

			// When using the html editor without a MAPIRecord (e.g. for the signature editor), the getMessageAction
			// is not defined, so check for it.
			var actionType = Ext.isDefined(this.record.getMessageAction) ? this.record.getMessageAction('action_type') : false;

			//For reply, replyall and forward we must add two empty lines to the top.
			//For "edit as new email" this should not be done!
			if (Zarafa.mail.data.ActionTypes.isSendOrForward(actionType)) {
				this.addEmptyLineBeforeContent();
				this.addEmptyLineBeforeContent();
			} else if (!Ext.isEmpty(tinymceEditor.getContent()) && actionType !== Zarafa.mail.data.ActionTypes.EDIT_AS_NEW) {
					this.addEmptyLineBeforeContent();
            } else {
				var focusedElement = document.activeElement;
                tinymceEditor.selection.setCursorLocation(tinymceEditor.getBody().firstChild, 0);
                this.composeDefaultFormatting(tinymceEditor);

				// Somehow tinymce fire focus event after setting range selection,
				// Therefor in IE11 focus is on editor so,
                // Force fully set focus on the previously focused element field.
				if (Ext.isIE11) {
					Ext.defer(function () {
						focusedElement.focus();
					}, 1, this);
				}
            }

			// HTML styles will be applied while selecting default values from comboboxes.
			// We need to set those styles into the record to avoid change detection in record.
			this.checkValueCorrection(this, "");

			// Remove all the undo level from tinymce, so that user can't rollback the default HTML styles.
			tinymceEditor.undoManager.clear();
		}
	},

	/**
	 * Function is used to execute a tinymce command to compose
	 * default formatting as a style attribute of currently selected node.
	 * @param {tinymce.Editor} editor The tinymce editor instance
	 * @private
	 */
	composeDefaultFormatting : function(editor)
	{
		editor.execCommand('FontSize', false, this.defaultFontSize, {skip_focus : true});
		editor.execCommand('FontName', false, this.defaultFontFamily, {skip_focus : true});
		this.repositionBrTag(editor);
	},

	/**
	 * Function is used to add the BR tag to inner SPAN tag of P tag and remove BR tag from P tag.
	 * it required because BR tag is used to identify the cursor location as wall as after pressing
	 * enter or pasting content in editor default formatting gets repeated in next line , to make cursor
	 * position ideal it required that BR tag must be in SPAN tag.
	 * @param {tinymce.Editor} editor The tinymce editor instance
	 */
	repositionBrTag : function(editor)
	{
		var node = editor.selection.getNode();
		editor.dom.add(node, 'br');
		var parentNode = editor.dom.getParent(node, 'p');
		if(parentNode && parentNode.lastChild.nodeName === 'BR') {
			parentNode.removeChild(parentNode.lastChild);
		}

		/*
		 * Particularly, somehow in IE11 current selection changed to the newly created BR tag instead of SPAN.
		 * The cursor must have to point to the proper element to keep the default formatting.
		 */
		if(Ext.isIE11){
			editor.selection.setCursorLocation(node, 0);
		}
	},

	/**
	 * Function will set value in the editor and will call {@link #checkValueCorrection}
	 * to update tinymce's editor value into record. for more information check code/comments
	 * of {@link #checkValueCorrection}.
	 * @param {String} value The value which was being set on the editor
	 */
	setValue : function (value)
	{
		var self = this;
		this.withEd(function () {
			var setValue = value;
			var editor = self.getEditor();
			if (editor) {
				var currentValue = editor.getContent();
				if (currentValue === value) {
					// No changes, so we don't need to update
					return;
				}
			}

			Zarafa.common.ui.HtmlEditor.superclass.setValue.call(this, setValue);

			if (self.rendered) {
				// checkValueCorrection function will be only called when editor is created and
				//  initialized. Otherwise, it will it wait for that.
				self.checkValueCorrection(this, value);
			}
		});
	},

	/**
	 * Enable this component by calling parent class {@link Ext.ux.form.TinyMCETextArea.enable enable} function.
	 * It also call the {@link #applyEmptyLines} function to apply empty lines while composing signature.
	 */
	enable: function()
	{
		if(this.disabled){
			Zarafa.common.ui.HtmlEditor.superclass.enable.apply(this, arguments);

			var editor = this.getEditor();

			// Reset the remembered selection value to its default value, because the single instance of
			// tinymce editor is being used by composing multiple signatures. it just enabled/disabled
			// with new/updated content.
			editor.selection.lastFocusBookmark = null;

			// Apply empty lines only if new signature is being composed.
			if(Ext.isEmpty(editor.getContent())) {
				this.applyEmptyLines(editor);
			}
		}
	},

	/**
	 * This is called after {@link #setValue} and determines if the value has been adjusted by the tinymce.
	 * Normally the value is applied to the <iframe> element where it is being rendered, tinymce will
	 * however also apply extra formatting, and change the ordering of some attributes. Because we only
	 * want to detect when the user made changes rather then the browser, we will check here what
	 * {@link #getValue} returns and check if that is different then the value which was being set.
	 * If a difference was found, the {@link #valuecorrection} event will be fired to inform the
	 * component user that he might need to implement some workaround.
	 *
	 * @param {Zarafa.common.ui.htmleditor.HtmlEditor} editor The HTML editor
	 * @param {String} value The value which was being set on the <iframe>
	 * @private
	 */
	checkValueCorrection : function(editor, value)
	{
		var correctedValue = editor.getValue();

		if (value !== correctedValue) {
			editor.fireEvent('valuecorrection', editor, correctedValue, value);
		}
	},

    /**
     * Function is called when double clicked in the editor.
     * While body is empty and double click in editor then firefox consider current selection on P tag instead of Span
     * and P tag doesn't have formatting that's way default formatting will remove.
     * Handle above situation by setting up selection on Span tag then after fire nodechange event of editor.
     */
    onDBLClick : function ()
    {
        var editor = this.getEditor();
        var element = editor.selection.getStart();
        // tinymce used zero width space characters as character container in empty line,
        // So needs to verify body is empty or not.
        var isEmptyBody = editor.selection.getContent({ format: 'text' }) === "";
        if (element === editor.getBody().firstChild && isEmptyBody) {
            editor.selection.setCursorLocation(element.firstChild.firstChild, 0);
        }
    },

	/**
	 * Function is called when mouse is clicked in the editor.
	 * Editor mousedown event needs to be relayed for the document element of WebApp page,
	 * to hide the context-menu.
	 * wheel event propagated from underlying iframe needs to be relayed to WepApp document
	 * to perform zoom functionality in DeskApp.
	 * @param {Object} event The event object
	 */
	relayIframeEvent : function(event)
	{
		Ext.getDoc().fireEvent(event.type, event);
	},

	/**
	 * Function is called when any key is pressed in the editor.
	 * @param {Object} event The event object
	 */
	onKeyDown : function(event)
	{
		var editor = this.getEditor();

		/*
		 * HACK: for IE and webkit browsers backspace/delete removes default formatting, so we have to
		 * add it again, so we will set empty content and rest will be handled by BeforeSetContent
		 * event. Here we need defer because this keydown handler is called first before other
		 * handlers which clears the content of editor.
		 */
		if (event.keyCode === Ext.EventObject.BACKSPACE || event.keyCode === Ext.EventObject.DELETE) {

			/*
			 * Specifically in IE while selecting all of the editor content,
			 * Somehow tinymce selection range not selecting whole body.
			 * Selecting whole body content manually before deleting all content.
			 */
			if (Ext.isIE11 || Ext.isEdge) {
				var oldRange = editor.selection.getRng();
				var editorBodyElement = editor.getBody();
				if (oldRange.startContainer === editorBodyElement) {
					var newRange = editor.dom.createRng();
					newRange.selectNodeContents(editorBodyElement);
					editor.selection.setRng(newRange);
				}
			}

			(function(){
				var content = editor.getContent({ format: 'text' });
				var node;
				if(Ext.isEmpty(content) || content === '\n' || content === ' &#13;') {
					editor.setContent('');
                    this.applyFontStyles();
                    editor.selection.setCursorLocation(editor.getBody().firstChild, 0);
					this.composeDefaultFormatting(editor);
                } else {
                    node = editor.selection.getNode();
                    if(node.nodeName === 'P') {
                        if(!node.hasChildNodes() || node.firstChild.nodeName === 'BR') {
                            this.composeDefaultFormatting(editor);
                            this.getEditorDocument().execCommand('Delete', false, null);
                        }
                    } else if(node.nodeName === 'SPAN' && node.hasChildNodes() &&  node.firstChild.nodeName === 'BR') {
                        var textNode = this.getEditorDocument().createTextNode('');
                        node.insertBefore(textNode, node.firstChild);
                    }
                }
			}.createDelegate(this)).defer(1);
		}

		if(event.keyCode === Ext.EventObject.ENTER) {
			// Ctrl + ENTER (and CMD + ENTER on a Mac) is the shortcut for sending an item. Because
			// we do not want to add the ENTER to the content then, we stop processing the event.
			if (event.ctrlKey || ( Ext.isMac && event.metaKey) ) {
				event.preventDefault();
				return false;
			}

			// Check if we are in a blockquote, and if so break the blockquote,
			// so the user can add his comments between the blockquotes.
			var blockquote = this.inBlockquote(editor);
			if ( blockquote ){
				// Prevent normal enter-behaviour as we will handle it
				event.preventDefault();
				this.handleEnterInBlockquote();
				return false;
			}

			// We will do this in a deferred function to make sure that tiny first adds the bogus BR element to empty paragraphs
			(function(){
				var node = editor.selection.getNode();

				// When we created an empty P tag by pressing ENTER we must apply default formatting to it.
				// When we already have an empty SPAN with formatting in the P tag tiny adds a BR node with the attribute
				// 'data-mce-bogus' because otherwise it is not possible to move the cursor there. Tiny will remove those
				// bogus nodes when we get the content value. But we have removed the padding and margin of P-tags,
				// resulting in empty P nodes not being visible to the user. That's why we will remove the attribute
				// 'data-mce-bogus' of the BR nodes, so tiny will not remove them.
				if(node.nodeName === 'P') {
					if(!node.hasChildNodes() || node.firstChild.nodeName === 'BR') {
						this.composeDefaultFormatting(editor);
					}
				} else if(node.nodeName === 'SPAN' && node.hasChildNodes() &&  node.firstChild.nodeName === 'BR') {
					// This one is for when we created an empty paragraph by pressing ENTER while on the cursor was on end of a line
					node.firstChild.removeAttribute('data-mce-bogus');
				} else {
					// This one is for when we created an empty paragraph by pressing ENTER while the cursor was on the begin of a
					// line that already contained text
					var parentPNode = editor.dom.getParent(node, 'p');
					var prevPNode = editor.dom.getPrev(parentPNode, 'p');
					if ( prevPNode ){
						if ( prevPNode.hasChildNodes() && prevPNode.firstChild.nodeName === 'SPAN' && prevPNode.firstChild.hasChildNodes() && prevPNode.firstChild.firstChild.nodeName === 'BR' ){
							prevPNode.firstChild.firstChild.removeAttribute('data-mce-bogus');
						}
					}
				}
			}.createDelegate(this)).defer(1);
		}

		/*
		 * HACK: Prevent the tab event to stop moving focus out of the editor.
		 * Instead of that, Insert four spaces while user presses TAB key.
		 */
		if ( event.keyCode === Ext.EventObject.TAB && !event.shiftKey ) {
			var listElement = editor.dom.getParent(editor.selection.getStart(), 'LI,DT,DD');

			// check if cursor is not pointing to any list element to allow increase/decrease
			// indent of UL/OL instead of adding four white spaces.
			if(!listElement) {
				editor.dom.events.cancel(event);
				/*
				 * Need to insert four spaces one by one to update the range offset accordingly.
				 * Inserting four space at once will throw error while changing font type
				 * if there is no content in editor body.
				 */
				for (var i = 0; i <= 3; i++) {
					editor.execCommand('mceInsertContent', false, "&nbsp;");
				}
			}
			return;
		}

		this.fireEvent("keypress", this, Ext.EventObject);
	},

	/**
	 * Checks if the cursor is positioned inside a blockquote
	 * @param {tinymce.Editor} editor The editor we will check
	 * @return {DOMElement} The blockquote element if found or false otherwise
	 */
	inBlockquote : function(editor)
	{
		var blockquoteElement = null;
		var node = editor.selection.getNode();
		if ( node.nodeName === 'BLOCKQUOTE' ){
			blockquoteElement = node;
		}else{
			blockquoteElement = editor.dom.getParent(node, 'BLOCKQUOTE', editor.getBody());
		}

		return blockquoteElement!==null ? blockquoteElement : false;
	},

	/**
	 * Splits a blockquote DOM element at the position of the cursor
	 * @param {tinymce.Editor} editor The editor we will work in
	 * @param {DOMElement} blockquote The blockquote element that must be split.
	 */
	splitBlockquote : function(editor, blockquote)
	{
		// Add a node where we will split the blockquote
		editor.selection.setContent('<span id="zarafa-splitter"></span>');
		var splitElement = editor.dom.get('zarafa-splitter');
		editor.dom.split(blockquote, splitElement);

		var firstBlockquoteElement = editor.dom.getPrev(splitElement, 'blockquote');
		var secondBlockquoteElement = editor.dom.getNext(splitElement, 'blockquote');

		// Add some margin to the blockquotes for readability
		if ( firstBlockquoteElement ){
			editor.dom.setStyle(firstBlockquoteElement, 'margin-bottom', '1em');
		}

		// If the user pressed ENTER at the end of a blockquote, a new blockquote
		// will not be created, so check if it exists
		if ( secondBlockquoteElement ){
			editor.dom.setStyle(secondBlockquoteElement, 'margin-top', '1em');

			// Remove <br> from the beginning of the new blockquote, as we will have added one
			var firstChild = secondBlockquoteElement.firstChild;
			if ( firstChild ){
				if ( firstChild.nodeName === 'DIV' && editor.dom.hasClass(firstChild, 'bodyclass') ){
					firstChild = firstChild.firstChild;
				}
				if ( firstChild && firstChild.firstChild && firstChild.firstChild.nodeName==='BR' ){
					editor.dom.remove(firstChild.firstChild);

					// If the BR was the only child of a SPAN, then we can remove that SPAN
					if ( firstChild.nodeName==='SPAN' && editor.dom.isEmpty(firstChild) ){
						editor.dom.remove(firstChild);
					}
				}
			}
		}

		// Put a default root block at the caret position
		var bogusHtml = '<br data-mce-bogus="1" />';
		var newNode = editor.dom.create('p', editor.settings.forced_root_block_attrs, bogusHtml);
		editor.dom.replace(newNode, splitElement);
		editor.selection.select(newNode);

	},

	/**
	 * Handles the event when the user presses ENTER when the cursor is positioned
	 * in a blockquote
	 */
	handleEnterInBlockquote : function()
	{
		var editor = this.getEditor();
		var blockquote = this.inBlockquote(editor);

		// Add an undo snapshot and do all other things in a transact,
		// so we will add only one undo level for it
		editor.undoManager.add();
		editor.undoManager.transact(function(){

			// Use a loop to split all blockquotes we're in, since we might in more
			// than one when the user replies to a reply or forward.
			while ( blockquote ){
				this.splitBlockquote(editor, blockquote);
				blockquote = this.inBlockquote(editor);
			}

			// Set the cursor to the caret position
			// This will set the correct font and size in the dropdowns of the editor
			var newNode = editor.selection.getNode();
			editor.selection.setCursorLocation(newNode);
		}.createDelegate(this));
	},

	/**
	 * Event handler which is raised when the component looses the focus
	 * of the user. This will determine if the typed in value has changed
	 * since the moment it gained focus, and will raise the 'change' event
	 * in that case.
	 * @private
	 */
	onBlur : function()
	{
		// if container of HtmlEditor, i.e. dialog, is closed then component is
		// also destroyed or removed and we won't be able to get value/content.
		if(this.isDestroyed === true || this.getEditor().removed ) {
			return;
		}

		// This event can be triggered multiple times, so we don't need to check
		// for changed when we blur without being focused. However, we do want to
		// invoke the 'blur' event since that will produce a consistent behavior
		// with other UI components from ExtJs.
		if (this.hasFocus === true) {
			var v = this.getRawValue();
			if (v.length !== this.originalValue.length || v !== this.originalValue) {
				this.fireEvent('change', this, v, this.originalValue);
			}
		}
		this.hasFocus = false;
		this.fireEvent('blur', this);
	},

	/**
	 * Event handler which is raised when the component gains the focus
	 * of the user. This will update the originalValue field so later,
	 * when the component looses focus, it can be determined if the
	 * value has been changed.
	 * @private
	 */
	onFocus : function()
	{
		// This event can be triggered multiple times,
		// even when it looses focus the onFocus will
		// be raised twice before the onBlur is called.
		if (this.hasFocus === true) {
			return;
		}

		this.originalValue = this.getRawValue();
		this.hasFocus = true;
		this.fireEvent('focus', this);
        // While body is empty and switching a focus in editor after tab change then
        // some how firefox consider current selection on P tag instead of span and
        // P tag doesn't have formatting that's way default formatting will remove.
        if (this.isTabChanged) {
            this.getEditor().selection.setCursorLocation();
            this.isTabChanged = false;
        }
	},

	/**
	 * Function is used to set the cursor within editor while mail replay/forward.
	 * It fires the 'focusin' event of editor.
	 */
	setCursorLocation : function()
	{
		var editor = this.getEditor();

		// check If editor instance is available or not
		if (!editor){
			/*
			 * if editor instance is not available yet to do auto focus than we have to reschedule the
			 * auto focus mechanism un till editor instance will be available, simply register on
			 * {@link #initialized} event.
			 */
			this.on('initialized', function() {
				var focusCmp = this.ownerCt;
				focusCmp.focus.defer(1, focusCmp);
				focusCmp.fireEvent('setAutoFocusCursor', focusCmp.getEditor());
			}, this);
		} else {
			this.withEd(function() {
				/*
				 * Here we need to fire the focusin event of editor because
				 * in default formatting we have two span tags, so somehow
				 * when mail is reply/forward cursor set in first outer span which is not contains any
				 * formatting so default formatting gets lost. to overcome this problem
				 * we need to fire the focusin event of editor.
				 */
				editor.fire('focusin', {});
			});
		}
	},

	/**
	 * Function will get the editor and fetch document element of the editor.
	 * @return {HTMLDocument} it will return document element of the editor iframe
	 */
	getEditorDocument: function() {
		return this.getEditor().getDoc();
	},

	/**
	 * Function will get the editor and fetch body element of the editor.
	 * @return {HTMLBodyElement} it will return body element of the editor iframe
	 */
	getEditorBody: function() {
		return this.getEditor().getBody();
	},

	/**
	 * bind an {@link Zarafa.core.data.IPMRecord} to this component
	 * record is necessary to properly convert img tags, for which store and entryid are needed
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	bindRecord : function(record)
	{
		this.record = record;
	},

    /**
     * Event handler triggers when content tab panel is changed
     */
    onBeforeTabChange : function ()
    {
        this.isTabChanged = true;
        
       	if(this.hasFocus){
     	   this.getEditor().fire('blur', this);
    	}
    },

	/**
	 * Function to set formatting with default font family and font size
	 */
	applyFontStyles : function ()
	{
		var body = Ext.get(this.getEditorBody());
		body.setStyle('font-family',this.defaultFontFamily);
		body.setStyle('font-size',this.defaultFontSize);
	}
});

Ext.reg('zarafa.htmleditor', Zarafa.common.ui.HtmlEditor);

// Create a hidden html editor to prefetch all tiny files
Zarafa.onReady(function(){
	var body = Ext.getBody();
	// Only prefetch for the webclient not for the welcome screen
	if ( body.hasClass('zarafa-webclient') ){
		var el = body.createChild({
			id: 'tiny-prefetch',
			style: {
				width: '10px',
				height: '10px',
				'z-index' : -10,
				top: '-10000px',
				left: '-10000px',
				visibility: 'hidden',
				position: 'absolute'
			}
		});

		new Ext.Panel({
			xtype: 'panel',
			applyTo: el,
			layout: 'fit',
			border: false,
			flex: 1,
			autoHeight: false,
			items: [{
				xtype: 'zarafa.editorfield',
				ref: '../editorField',
				flex: 1,
				useHtml: true
			}]
		});
	}
});