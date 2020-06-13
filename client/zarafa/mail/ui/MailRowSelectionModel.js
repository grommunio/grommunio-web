Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailRowSelectionModel
 * @extends Ext.grid.RowSelectionModel
 *
 * The {@link Zarafa.mail.ui.MailRowSelectionModel MailRowSelectionModel}
 * is the {@link Ext.grid.RowSelectionModel RowSelectionModel} used in the
 * {@link Zarafa.mail.ui.MailGrid MailGrid}.
 * It checks columns that have the preventRowSelection property and triggers actions depending on it.
 * See {@link #handleMouseDown}
 */
Zarafa.mail.ui.MailRowSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
	/**
	 * This property will help to store value for {@link #last} property.
	 * As we loose the track for {@link #last} because of the dynamically addition of rows
	 * on the expansion of the conversations.
	 *  
	 * @property
	 * @type Number
	 */
	updatedLast : undefined,

	/**
	 * Overriden to test for custom columns.
	 * If one of the columns of interest is clicked, then the row should not be selected.
	 * Otherwise call original handler.
	 * 'cellmousedown' does not fire when drag&drop is installed on a component,
	 * otherwise it may have been possible to cancel selection from there by returning false.
	 *
	 * @param {Zarafa.mail.ui.MailGrid} g The mail grid from which the event came
	 * @param {Number} rowIndex Index of the row that was clicked
	 * @param {Ext.EventObject} event The mouse event
	 *
	 * @override
	 * @private
	 */
	handleMouseDown: function (g, rowIndex, event) {
		var cm = g.getColumnModel();
		// get cell index from event object
		var cellIndex = g.getView().findCellIndex(event.getTarget());
		// boolean to determine what we are going to do
		var preventRowSelection = false;
		if (Ext.get(event.target).hasClass('icon_flag')) {
			preventRowSelection = true;
		} else if (cellIndex !== false && cm.config[cellIndex].dataIndex === 'sent_representing_name' && Ext.fly(event.target).hasClass('k-icon')) {
			preventRowSelection = true;
		} else if (cellIndex !== false && cellIndex >= 0) {
			preventRowSelection = cm.config[cellIndex].preventRowSelection;
		} else if (cellIndex === false && Ext.get(event.target).hasClass('k-category-add')) {
			// Prevent selection when the mousedown event is on the 'add category icon'
			preventRowSelection = true;
		}
		if (preventRowSelection === true) {
			// We must still set the focus on the clicked element, or else the grid will jump to
			// the previous focussed element when we close a dialog
			g.getView().focusRow(rowIndex);
		} else {
			if (event.shiftKey && !this.singleSelect && this.last !== false) {
				// Store the last index record as it might get changed after the expansion of the conversation.
				// So later it will be used to get the correct index for rowIndex.
				// No need to store the start index as we are maintaining {@link #updatedLast}. Which will update 
				// {@link #last}.
				var store = this.grid.getStore();
				var recordAtEndIndex = store.getAt(rowIndex);
				this.expandAllConversationsInRange(this.last, rowIndex);

				if (this.updatedLast) {
					this.last = this.updatedLast;
				}

				// Index of the last record might have changed.
				// So, fetch the latest index for the the last record.
				rowIndex = store.indexOf(recordAtEndIndex);
			}

			Zarafa.mail.ui.MailRowSelectionModel.superclass.handleMouseDown.call(this, g, rowIndex, event);
		}
	},

	/**
	 * Helper function for {@link #handleMouseDown} function. 
	 * This will expand all the closed conversations which resides in the given range.
	 * And also update {@link #updatedLast} if the selection direction is upwards.
	 * 
	 * @param {Number} startRow start index of the selection range.
	 * @param {Number} endRow end index of the selection range.
	 */
	expandAllConversationsInRange: function(startRow, endRow) 
	{
		var conversationHeaders = [];
		var i = Math.min(startRow, endRow);
		var j = Math.max(startRow, endRow);
		var updatedlast = startRow;
		var store = this.grid.getStore();
		for(; i<j; i++) {
			var record = store.getAt(i);
			var isHeaderRecord = record.isConversationHeaderRecord();
			if (isHeaderRecord && !store.isConversationOpened(record)) {
				conversationHeaders.push(record);
			}

		}

		conversationHeaders.forEach(function(headerRecord) {
			if (startRow > endRow) {
				updatedlast += headerRecord.get('conversation_count');
			}
			store.expandConversation(headerRecord);
		});

		this.updatedLast = updatedlast;
	},

	/**
	 * Helper function to know whether the given index is out of range for this grid or not.
	 * 
	 * @param {Number} index Number which required to be checked if it exists in grid. 
	 */
	isIndexOutOfRange : function(index)
	{
		return index < 0 || index >= this.grid.store.getCount();
	},

	/**
     * Selects the row immediately following the last selected row.
     * @param {Boolean} keepExisting (optional) <tt>true</tt> to keep existing selections
	 * @param {Integer} rowIndex (optional) The index of row whose next row needs to be selected.
     * @return {Boolean} <tt>true</tt> if there is a next row, else <tt>false</tt>
     */
	selectNext : function(keepExisting, rowIndex)
	{
		var nextRowIndex = Ext.isEmpty(rowIndex) ? this.last + 1 : rowIndex+1;
        if (!this.isIndexOutOfRange(nextRowIndex)){
			var store = this.grid.getStore();
			var record = store.getAt(nextRowIndex);
			var isHeaderRecord = record.isConversationHeaderRecord();
			// Check if its header record and if so then select next record after it.
			if (isHeaderRecord) {
				if (!store.isConversationOpened(record)) {
					store.expandConversation(record);
				}

				this.selectNext(keepExisting, nextRowIndex);
				return true;
			}
            this.selectRow(nextRowIndex, keepExisting);
            this.grid.getView().focusRow(this.last);
			
			if (this.grid.expandSingleConversation && !keepExisting) {
				var currHeader = store.getHeaderRecordFromItem(record);
				store.collapseAllConversation(currHeader);
			}
			
			return true;
        }
        return false;
    },

    /**
     * Selects the row that precedes the last selected row.
     * @param {Boolean} keepExisting (optional) <tt>true</tt> to keep existing selections
	 * @param {Integer} rowIndex (optional) The index of row whose previous row needs to be selected.
     * @return {Boolean} <tt>true</tt> if there is a previous row, else <tt>false</tt>
     */
	selectPrevious : function(keepExisting, rowIndex)
	{
		var prvRowIndex = Ext.isEmpty(rowIndex) ? this.last-1 : rowIndex-1;
        if (!this.isIndexOutOfRange(prvRowIndex)) {
			var store = this.grid.getStore();
			var record = store.getAt(prvRowIndex);
			var isHeaderRecord = record.isConversationHeaderRecord();
			// Check if its header record.
			if (isHeaderRecord) {
				//  If conversation was opened the select previous record of the header record.
				if (store.isConversationOpened(record)) {
					this.selectPrevious(keepExisting, prvRowIndex);
					return true;
				} 
				
				// If conversation was closed then select last item of it.
				store.expandConversation(record);
				prvRowIndex += record.get('conversation_count');
			}

			this.selectRow(prvRowIndex, keepExisting);
			this.grid.getView().focusRow(this.last);
			
			if (this.grid.expandSingleConversation && !keepExisting) {
				var currHeader = store.getHeaderRecordFromItem(record);
				store.collapseAllConversation(currHeader);
			}

			return true;
        }
        return false;
    },

	/**
	 * Helper function of {@link #onKeyPress} funciton.
	 * Which will update the end index for the selection range. It will also expand the conversation found at the endIndex.
	 * This might also update {@link #updatedLast} as new rows would be added in the grid due to expansion of the conversations.
	 * 
	 * @param {Number} endIndex end index of the selection range 
	 * @param {Boolean} up true if up key is pressed. 
	 * @param {Number} add addend to add in endIndex in accordance with the direction. 
	 */
	prepareEndSelectionIndex : function(endIndex, up, add)
	{
		var store = this.grid.getStore();
		var record = store.getAt(endIndex);
		var isHeaderRecord = record.isConversationHeaderRecord();

		// If header record is found at the end index of the selection range
		// and if that conversation is closed then expand that conversation.
		// And update endIndex accordig to the selection direction.
		if (isHeaderRecord && !store.isConversationOpened(record)) { 
			store.expandConversation(record);
			if (up) {
				// If selection direction is up then select last item of the conversation.
				// And update the {@link #updatedLast}.
				var conversationCount = record.get('conversation_count');
				endIndex += conversationCount;
				this.updatedLast += conversationCount;
			} else {
				// If selection direction is down then select first item of the conversation.
				// No need to update the {@link #updatedLast} for downwards selection.
				endIndex += add;
			}
		} else if (isHeaderRecord && !this.isIndexOutOfRange(endIndex + add)) {
			// If header record of an open conversation is found at the endIndex then
			// extend the endIndex and check whether new endIndex is out of range.
			// If its in the range then check for the closed conversation at the new endIndex;
			endIndex = this.prepareEndSelectionIndex(endIndex + add, up, add);
		}

		return endIndex;
	},

	/**
	 * Handler for the key press event.
	 * 
	 * Note: we need to modify this function because on dynamically addintion of rows in grid
	 * {@link #last} might be changed. So to overcome this situation we are getting updated value
	 * for {@link #last} from {@link #selectRange} method.
	 * 
	 * @param {Ext.EventObject} e keypress event
	 * @param {String} name The name of the key which is pressed. 
	 */
	onKeyPress : function(e, name)
	{
        var up = name == 'up',
            method = up ? 'selectPrevious' : 'selectNext',
            add = up ? -1 : 1,
            last;
        if (!e.shiftKey || this.singleSelect){
            this[method](false);
        } else if (this.last !== false && this.lastActive !== false){
			this.updatedLast = this.last;
			var endIndex = this.lastActive + add;
			
			// Avoid getting endIndex for out of range index. 
			if (!this.isIndexOutOfRange(endIndex)) {
				endIndex = this.prepareEndSelectionIndex(endIndex, up, add);
			}
			
			var last = this.updatedLast;
			this.selectRange(last, endIndex, undefined, up);
			this.grid.getView().focusRow(this.lastActive);
            if (last !== false){
                this.last = last;
            }
        } else {
           this.selectFirstRow();
        }
    }

});

Ext.reg('zarafa.mailrowselectionmodel', Zarafa.mail.ui.MailRowSelectionModel);
