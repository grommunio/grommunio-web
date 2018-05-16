Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.RecipientLinks
 * @extends Ext.DataView
 * @xtype zarafa.recipientlinks
 *
 * If the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Zarafa.core.data.MAPIRecord record} into the component.
 * Otherwise the user of this component needs to call {@link #setRecord}.
 */
Zarafa.common.ui.messagepanel.RecipientLinks = Ext.extend(Ext.DataView, {
	/**
	 * @cfg {Number} ellipsisStringStartLength maximum length of text allowed before truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringStartLength : 30,

	/**
	 * @cfg {Number} ellipsisStringEndLength maximum length of text allowed after truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringEndLength : 30,

	/**
	 * @cfg {Number} maxHeight The maximum height the element which holds all
	 * recipient is allowed to take before a scrollbar will be shown.
	 */
	maxHeight : 50,

	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	/* # TRANSLATORS: This message is used as label for the field which to indicates to whom the given mail was sent */
	fieldLabel : pgettext('mail.previewpanel', 'Recipients'),

	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} recipientType The recipientType
	 * which should be displayed in the DataView. If not provided, no filtering
	 * will occur and all recipients will be displayed.
	 */
	recipientType : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config,{
			xtype: 'zarafa.recipientlinks',
			border : false,
			autoScroll:true,
			anchor : '100%',
			cls : 'preview-header-recipients',
			multiSelect : false,
			overClass: 'zarafa-recipient-link-over',
			itemSelector: 'span.zarafa-recipient-link',
			tpl : new Ext.XTemplate(
				'<tpl if="values.length &gt; 0">' +
					'<div class="preview-header-recipientbox">' +
						'<div class="preview-recipient-title">{this.fieldLabel}:</div>' +
						'<div class="preview-recipient-data" style="max-height: {this.maxHeight}px">' +
							'<tpl for=".">' +
								'<span viewIndex="{viewIndex}" class="zarafa-emailaddress-link zarafa-recipient-link">' +
									'<span class="zarafa-presence-status {[Zarafa.core.data.PresenceStatus.getCssClass(values.presence_status)]}">'+
										'<span class="zarafa-presence-status-icon"></span>' +
										'<tpl if="!Ext.isEmpty(values.display_name)">' +
											'{display_name:htmlEncodeElide(this.ellipsisStringStartLength, this.ellipsisStringEndLength)} ' +
										'</tpl>' +
										'<tpl if="!Ext.isEmpty(values.smtp_address)">' +
											'&lt;{smtp_address:htmlEncode}&gt;' +
										'</tpl>' +
										'<tpl if="Ext.isEmpty(values.smtp_address) && !Ext.isEmpty(values.email_address)">' +
											'&lt;{email_address:htmlEncode}&gt;' +
										'</tpl>' +
									'</span>' +
								'</span>' +
								'<tpl if="xindex &gt; 0 && xindex != xcount">' +
									'<span>; </span>' +
								'</tpl>' +
							'</tpl>' +
						'</div>' +
					'</div>' +
				'</tpl>',
				{
					compiled : true,
					fieldLabel : config.fieldLabel || this.fieldLabel,
					maxHeight : config.maxHeight || this.maxHeight,
					ellipsisStringStartLength : config.ellipsisStringStartLength || this.ellipsisStringStartLength,
					ellipsisStringEndLength : config.ellipsisStringEndLength || this.ellipsisStringEndLength
				}
			)
		});

		// The fieldLabel should not be sent to the superclass
		this.fieldLabel = config.fieldLabel || this.fieldLabel;
		delete config.fieldLabel;
		Zarafa.common.ui.messagepanel.RecipientLinks.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the component.
	 * This will register the {@link #onAttachmentClicked} event handler.
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.common.ui.messagepanel.RecipientLinks.superclass.initComponent.call(this);

		container.populateInsertionPoint('previewpanel.toolbar.recipientlinks', this);

		this.on('contextmenu', this.onRecipientRightClick, this);
		this.on('dblclick', this.onRecipientDoubleClick, this);
		this.on('mouseenter',this.onMouseEnter, this, {buffer : 10});
	},

	/**
	 * Apply a record on the DataView. If the record is {@link Zarafa.core.data.IPMRecord#isOpened},
	 * then the {@link Zarafa.core.data.IPMRecord#getAttachmentStore attachment store} will be
	 * {@link #bindStore bound} to this view.
	 * @param {Zarafa.core.data.IPMRecord} record The record to apply
	 */
	setRecord : function(record)
	{
		if (record) {
			if (record.isOpened()) {
				this.bindStore(record.getRecipientStore());
			}
		} else {
			this.bindStore(null);
		}
	},

	/**
	 * overriden to get the viewIndex from an HTML element's attribute
	 * by default the index is taken from the element's position within the group;
	 * however if there are more than one groups, the indexes are wrong
	 * @private
	 */
	updateIndexes : function(startIndex, endIndex)
	{
		var ns = this.all.elements;
		startIndex = startIndex || 0;
		endIndex = endIndex || ((endIndex === 0) ? 0 : (ns.length - 1));
		for(var i = startIndex; i <= endIndex; i++){
				ns[i].viewIndex = ns[i].getAttribute('viewIndex');
		}
	},

	/**
	 * <p>Function which can be overridden which returns the data object passed to this
	 * DataView's {@link #tpl template} to render the whole DataView.</p>
	 * <p>This is usually an Array of data objects, each element of which is processed by an
	 * {@link Ext.XTemplate XTemplate} which uses <tt>'&lt;tpl for="."&gt;'</tt> to iterate over its supplied
	 * data object as an Array. However, <i>named</i> properties may be placed into the data object to
	 * provide non-repeating data such as headings, totals etc.</p>
	 * @param {Array} records An Array of {@link Ext.data.Record}s to be rendered into the DataView.
	 * @param {Number} startIndex the index number of the Record being prepared for rendering.
	 * @return {Array} An Array of data objects to be processed by a repeating XTemplate. May also
	 * contain <i>named</i> properties.
	 * @private
	 */
	collectData : function(records, startIndex)
	{
		var r = [];
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			if (!Ext.isDefined(this.recipientType) || this.recipientType === record.get('recipient_type')) {
				r[r.length] = this.prepareData(record.data, record.get('rowid'), record);
			}
		}
		return r;
	},

	/**
	 * overriden to provide the correct index to {@link Ext.DataView#getRecord}
	 * otherwise behaviour breaks when there is more than one group in the records (e.g. CC, BCC, etc.)
	 * @param {Zarafa.core.data.IPMRecipientRecord} data The recipient record to be prepared
	 * @param {Number} index
	 * @param {Ext.data.Record} record
	 * @return {Object} new object with index appended
	 * @private
	 */
	prepareData : function(data, index, record)
	{
		return Ext.apply({viewIndex: index}, data);
	},

	/**
	 * Gets an array of the records from an array of nodes
	 * @param {Array} nodes The nodes to evaluate
	 * @return {Array} records The {@link Ext.data.Record} objects
	 */
	getRecords : function(nodes)
	{
		var records = [];

		for(var i = 0, len = nodes.length; i < len; i++){
			records[records.length] = this.store.getAt(this.store.findExact('rowid', parseInt(nodes[i].viewIndex)));
		}

		return records;
	},

	/**
	 * Gets a record from a node
	 * @param {HTMLElement} node The node to evaluate
	 * @return {Record} record The {@link Ext.data.Record} object
	 * @override
	 */
	getRecord : function(node)
	{
		return this.store.getAt(this.store.findExact('rowid', parseInt(node.viewIndex, 10)));
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (record && record instanceof Zarafa.core.data.MAPIRecord) {
			// In case the recordcomponentupdaterplugin is installed
			// we have a special action to update the component.
			if (contentReset && record.isOpened()) {
				this.setRecord(record);
			}
		} else {
			// The recordcomponentupdaterplugin is not installed and the
			// caller really wants to perform the update() function. Probably
			// a bad move, but lets not disappoint the caller.
			Zarafa.common.ui.messagepanel.RecipientLinks.superclass.update.apply(this, arguments);
		}
	},

	/**
	 * Function that is called to refresh a single node of this DataView. Overwritten
	 * because all {@link Zarafa.common.ui.messagepanel.RecipientLinks RecipientLinks} (To,
	 * CC, BCC) share a single store for which only records with the correct {@link #recipientType}
	 * are shown. Therfore we might not have rendered nodes for all records and we must
	 * keep that in mind.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store that holds the updated record
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record that was updated
	 * @private
	 */
	onUpdate : function(store, record)
	{
		if ( record.get('recipient_type') !== this.recipientType ){
			// We didn't render a node for this record, so we cannot update it
			return;
		}

        var index = this.store.indexOf(record);

        // Get the index when regarding only records with our recipientType
        // This is the major difference from the original function. Because
        // we do not render all recipients in the store but only those that
        // have the same recipient_type as this DataView, we must calculate
        // the index of the record a little differently.
        var filteredIndex = -1;
        Ext.each(this.store.getRange(), function(rec){
        	if ( rec.get('recipient_type') === this.recipientType ){
        		filteredIndex++;
        	}
        }, this);

        if(index > -1){
            var sel = this.isSelected(filteredIndex),
                original = this.all.elements[filteredIndex],
                node = this.bufferRender([record], index)[0];

            this.all.replaceElement(filteredIndex, node, true);
            if(sel){
                this.selected.replaceElement(original, node);
                this.all.item(filteredIndex).addClass(this.selectedClass);
            }
            this.updateIndexes(filteredIndex, filteredIndex);
        }
	},

	/**
	 * Refreshes the view by reloading the data from the store and re-rendering the template.
	 * Overriden in order to hide this component also if *filtered* records are empty
	 * @override
	 */
	refresh : function()
	{
		this.clearSelections(false, true);
		var el = this.getTemplateTarget(),
			records = this.store.getRange();

		el.update('');
		if(records.length < 1){
			if(!this.deferEmptyText || this.hasSkippedEmptyText){
				el.update(this.emptyText);
			}
			this.all.clear();
			this.setVisible(false);
		}else{
			var filteredRecords = this.collectData(records, 0);
			Ext.each(filteredRecords, function(filteredRecord, index){
				var user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(new Ext.data.Record(filteredRecord));
				filteredRecords[index].presence_status = Zarafa.core.PresenceManager.getPresenceStatusForUser(user);
			});
			this.tpl.overwrite(el, filteredRecords);
			this.all.fill(Ext.query(this.itemSelector, el.dom));
			this.updateIndexes(0);
			if (filteredRecords.length < 1) {
				this.setVisible(false);
			} else {
				this.setVisible(true);
			}
		}
		this.hasSkippedEmptyText = true;
	},

	/**
	 * Called when user right-clicks on an item in {@link Zarafa.common.ui.messagepanel.RecipientLinks}
	 * It will show {@link Zarafa.common.recipientfield.ui.RecipientHoverCardView}
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} e The mouse event
	 * @private
	 */
	onRecipientRightClick: function (dataView, index, node, e)
	{
		var recipientRecord = this.createRecipientFromNode(node);
		Zarafa.core.data.UIFactory.openHoverCard(recipientRecord, {
			position: e.getXY(),
			recipientView : dataView
		});
	},

	/**
	 * Called when user double-clicks on an item in {@link Zarafa.common.ui.messagepanel.RecipientLinks}
	 * invokes {@link Zarafa.common.Actions#openViewRecipientContent} with the selected {@link Zarafa.core.data.IPMRecord}
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} evt The mouse event
 	 * @private
	 */
	onRecipientDoubleClick : function(dataView, index, node, evt)
	{
		var record = dataView.getRecord(node);
		Zarafa.common.Actions.openViewRecipientContent(record);
	},

	/**
	 * Function will get recipient record from node and will remove some properties which are not usefull,
	 * because we are sending a new mail, so we don't want to copy all the properties from original recipient record.
	 * @param {Ext.Element} node data view element which is attached to the store record
	 * @return {Zarafa.core.data.IPMRecipientRecord} recipient record that will be used for sending the mail
 	 * @private
	 */
	createRecipientFromNode : function(node)
	{
		var record = this.getRecord(node);
		record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, record.data);

		// remove not needed properties
		record.set('rowid', '');
		record.set('recipient_trackstatus', '');
		record.set('recipient_trackstatus_time', '');

		return record;
	},

	/**
	 * Event handler which handel mouse enter event.
	 * It will show {@link Zarafa.common.recipientfield.ui.RecipientHoverCardView}
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} e The mouse event
	 */
	onMouseEnter: function (dataView, index, node, e)
	{
		var recipientRecord = this.createRecipientFromNode(node);
		Zarafa.core.data.UIFactory.openHoverCard(recipientRecord, {
			position: e.getXY(),
			recipientView : dataView
		});
	}
});

Ext.reg('zarafa.recipientlinks', Zarafa.common.ui.messagepanel.RecipientLinks);
