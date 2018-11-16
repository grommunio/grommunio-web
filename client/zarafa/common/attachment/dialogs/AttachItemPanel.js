Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.AttachItemPanel
 * @extends Ext.Panel
 * @xtype zarafa.attachitempanel
 */
Zarafa.common.attachment.dialogs.AttachItemPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.core.data.MAPIRecord} record record in which we will add embedded attachment if user is adding it as attachment.
	 */
	record : undefined,

	/**
	 * @cfg {Zarafa.common.ui.EditorField} editor editor in which we will be adding message as text if user has selected to add text in body.
	 */
	editor : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			layout: {
				type: 'vbox',
				align : 'stretch',
				pack  : 'start',
				padding : 10
			},
			items : [{
				xtype : 'displayfield',
				value : _('Look in:'),
				hideLabel : true,
				height : 20
			}, {
				xtype : 'container',
				flex : 1,
				layout : {
					type : 'hbox',
					align : 'stretch',
					pack : 'start'
				},
				items : [{
					xtype: 'zarafa.hierarchytree',
					flex : 1,
					border : true,
					enableDD : false,
					treeSorter : true,
					ref : '../hierarchyTree',
					listeners : {
						// Register event that will initially select a default folder
						'load' : this.onTreeNodeLoad,
						scope : this
					}
				}, {
					xtype : 'container',
					width : 150,
					defaults : {
						style : {
							margin : '0px 0px 10px 5px'
						}
					},
					style : {
						padding : '0px 0px 0px 10px'
					},
					items : [{
						xtype : 'button',
						text : _('Ok'),
						disabled : true,
						cls: 'zarafa-action',
						ref : '../../okButton',
						handler : this.onOK,
						scope : this
					}, {
						xtype : 'button',
						text : _('Cancel'),
						ref : '../../cancelButton',
						handler : this.onCancel,
						scope : this
					}, {
						xtype : 'fieldset',
						title : _('Insert as'),
						padding : '0px 5px 5px 5px',
						layout : {
							type : 'fit'
						},
						items : [{
							xtype : 'radiogroup',
							vertical : true,
							columns : 1,
							ref : '../../../attachTypeRadioGroup',
							defaults : {
								style : {
									margin : '5px 0px 0px 5px'
								}
							},
							items : [{
								xtype : 'radio',
								boxLabel : _('Text only'),
								inputValue : 'text_only',
								name : 'attach_item'
							}, {
								xtype : 'radio',
								boxLabel : _('Attachment'),
								inputValue : 'attachment',
								name : 'attach_item'
							}],
							listeners : {
								// Register event that will select default radio group item
								'afterrender' : this.onRadioGroupAfterRender,
								// Register event that will save current selected radio item in state settings
								'change' : this.onRadioSelectionChange,
								scope : this
							}
						}]
					}]
				}]
			}, {
				xtype: 'zarafa.attachitemgrid',
				flex : 1,
				ref : 'attachItemGrid'
			}]
		});

		Zarafa.common.attachment.dialogs.AttachItemPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the event handlers
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.common.attachment.dialogs.AttachItemPanel.superclass.initEvents.apply(this, arguments);

		// Register event that will be fired when selection in hierarchy is changed
		var sm = this.hierarchyTree.getSelectionModel();
		this.mon(sm, 'selectionchange', this.onTreeSelectionChange, this);

		// Register event that will enable/disable ok button based on current selection
		this.mon(this.attachItemGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * Function will call {@link Zarafa.common.attachment.dialogs.AttachItemGrid#attachItem}.
	 * @private
	 */
	onOK : function()
	{
		this.attachItem();
	},

	/**
	 * Handler will called when user presses the cancel button, this will simply close the {@link Zarafa.common.attachment.AttachItemContentPanel AttachItemContentPanel}
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} intially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 * @param {Ext.tree.TreeNode} node node that has been loaded
	 * @private
	 */
	onTreeNodeLoad : function(node)
	{
		var folder = this.dialog.getSelectedFolder();

		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(folder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Invoked when {@link Ext.form.RadioGroup RadioGroup} is rendered fully and {@link Ext.form.RadioGroup#afterrender} event is fired.
	 * This function will try to select the {@link Ext.form.Radio Radio} in {@link Ext.form.RadioGroup RadioGroup} intially.
	 * @param {Ext.form.RadioGroup} radioGroup radio group that has been rendered.
	 * @private
	 */
	onRadioGroupAfterRender : function(radioGroup)
	{
		var option = this.dialog.getSelectedRadioItem();

		radioGroup.setValue(option);
	},

	/**
	 * Fired when a radio item is selected in {@link Ext.form.RadioGroup RadioGroup}.
	 * It will store inputValue of selected radio item into state settings.
	 * @param {Ext.form.RadioGroup} radioGroup radio group that has fired change event.
	 * @param {Ext.form.Radio} checkedRadio radio item which is selected.
	 * @private
	 */
	onRadioSelectionChange : function(radioGroup, checkedRadio)
	{
		// save new selection in state settings
		this.dialog.setRadioItemInState(checkedRadio);
	},

	/**
	 * Fired when a node is selected in {@link Zarafa.hierarchy.ui.Tree}. It loads items of the folder in grid.
	 * @param {Ext.tree.DefaultSelectionModel} selectionModel selection model that is used in {@link Zarafa.hierarchy.ui.Tree HierarchyTree}
	 * @param {Ext.tree.TreeNode} node node which is selected
	 * @private
	 */
	onTreeSelectionChange : function(selectionModel, node)
	{
		var folder = node.getFolder();

		var store = this.dialog.getStoreByFolder(folder);
		var colModel = this.dialog.getColumnModelByFolder(folder);

		this.attachItemGrid.reconfigure(store, colModel);

		// load the contents of the store
		store.load();

		// update state settings, and store newly selected folder entryid as last selected folder
		this.dialog.setFolderInState(folder);
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.calendar.ui.CounterProposalGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onGridSelectionChange : function(selectionModel)
	{
		var count = selectionModel.getCount();

		this.okButton.setDisabled(count === 0);
	},

	/**
	 * Wrapper function to call {@link #attachItemAsAttachment} or {@link #attachItemAsText} based on selected radio item.
	 * @param {String} radioValue String that indicates which radio item is selected, based on this value different function will be called.
	 * @private
	 */
	attachItem : function(radioValue)
	{
		var selected = this.attachItemGrid.getSelectionModel().getSelected();
		var selectedRadio = this.attachTypeRadioGroup.getValue().inputValue;

		if (Ext.isEmpty(selected)) {
			Ext.MessageBox.alert(_('Attach Item'), _('No message selected'));
			return;
		}

		if(selectedRadio === 'text_only') {
			// add selected message data to parent message's body
			this.attachItemAsText(selected);
		} else {
			// add selected message as an attachment to parent message
			this.attachItemAsAttachment(selected);
		}
	},

	/**
	 * Function will be used to add selected message to another message as an embedded attachment.
	 * @param {Zarafa.core.data.IPMRecord} record record that is selected in grid and which should be added as attachment.
	 * @private
	 */
	attachItemAsAttachment : function(record)
	{
		// add new attachment into parent record
		this.record.getAttachmentStore().addAsAttachment(record);

		// now close the dialog
		this.dialog.close();
	},

	/**
	 * Function will be used to add selected message to another message as body contents.
	 * @param {Zarafa.core.data.IPMRecord} record record that is selected in grid and which should be added as text.
	 * @private
	 */
	attachItemAsText : function(record)
	{
		// if record is not opened then open it and get all contents of the record
		if(!record.isOpened()) {
			this.openRecord(record, this.attachItemAsText);
			return;
		}

		var renderer = this.dialog.getRendererByMessage(record);

		// Get the editor in which we need to add text and add text generated by renderer
		this.dialog.editor.insertAtCursor(renderer.generateText(record, this.record.get('isHTML')));

		// now close the dialog
		this.dialog.close();
	},

	/**
	 * Function will send an 'open' request to server to get all data of the passed {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * After record is opened function will call function specified in callback parameter.
	 * @param {Zarafa.core.data.IPMRecord} record record which needs to be opened to get all data.
	 * @param {Ext.Function} callback callback function that will be called after successfully opening the record.
	 */
	openRecord : function(record, callback)
	{
		// show load mask till we fetch full data from server
		this.dialog.showLoadMask();

		// store a reference of record's store which can be used to deregister events in exception handler
		var store = record.getStore();

		var fnOpen = function(recStore, rec) {
			if (record === rec) {
				// remove registered handlers
				store.un('open', fnOpen, this);
				store.un('exception', fnException, this);

				// hide load mask as data has arrived
				this.dialog.hideLoadMask();

				// call the callback function
				callback.call(this, record);
			}
		};

		var fnException = function(proxy, type, action, options, response, args) {
			if(action === Ext.data.Api.actions.open) {
				// remove registered handlers, this exception has been fired by Proxy so we will not get store in parameters
				store.un('open', fnOpen, this);
				store.un('exception', fnException, this);

				// actual error message will be shown by common exception handler
				// we will just hide the load mask
				this.dialog.hideLoadMask();
			}
		};

		store.on('open', fnOpen, this);
		store.on('exception', fnException, this);

		record.open();
	}
});

Ext.reg('zarafa.attachitempanel', Zarafa.common.attachment.dialogs.AttachItemPanel);
