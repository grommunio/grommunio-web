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
	updatedLast: undefined,

	/**
	 * Overridden to test for custom columns.
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

				if (this.updatedLast) {
					this.last = this.updatedLast;
					this.clearUpdatedLast();
				}

				// Index of the last record might have changed.
				// So, fetch the latest index for the the last record.
				rowIndex = store.indexOf(recordAtEndIndex);
			}

			Zarafa.mail.ui.MailRowSelectionModel.superclass.handleMouseDown.call(this, g, rowIndex, event);
		}
	},

	/**
	 * Helper function to know whether the given index is out of range for this grid or not.
	 *
	 * @param {Number} index Number which required to be checked if it exists in grid.
	 */
	isIndexOutOfRange: function(index)
	{
		return index < 0 || index >= this.grid.store.getCount();
	},

	/**
	 * Selects the row immediately following the last selected row.
	 * @param {Boolean} keepExisting (optional) <tt>true</tt> to keep existing selections
	 * @param {Integer} rowIndex (optional) The index of row whose next row needs to be selected.
	 * @return {Boolean} <tt>true</tt> if there is a next row, else <tt>false</tt>
	 */
	selectNext: function(keepExisting, rowIndex)
	{
		var nextRowIndex = Ext.isEmpty(rowIndex) ? this.last + 1 : rowIndex+1;
		if (!this.isIndexOutOfRange(nextRowIndex)){
			var store = this.grid.getStore();
			var record = store.getAt(nextRowIndex);
			// Check if its header record.
			if (record.isConversationHeaderRecord()) {
				// If conversation was opened then skip the header record and
				// select the first item of the conversation instead.
				if (store.isConversationOpened(record)) {
					return this.selectNext(keepExisting, nextRowIndex);
				}

				// If conversation was closed then expand it and select its first item.
				store.expandConversation(record);
				nextRowIndex += 1;
			}

			this.selectRow(nextRowIndex, keepExisting);
			this.grid.getView().focusRow(this.last);

			if (this.grid.expandSingleConversation && !keepExisting) {
				var currHeader = store.getHeaderRecordFromItem(store.getAt(nextRowIndex));
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
	selectPrevious: function(keepExisting, rowIndex)
	{
		var prvRowIndex = Ext.isEmpty(rowIndex) ? this.last-1 : rowIndex-1;
		if (!this.isIndexOutOfRange(prvRowIndex)) {
			var store = this.grid.getStore();
			var record = store.getAt(prvRowIndex);
			var isHeaderRecord = record.isConversationHeaderRecord();
			// Check if its header record.
			if (isHeaderRecord) {
				// If conversation was opened the select previous record of the header record.
				if (store.isConversationOpened(record)) {
					this.selectPrevious(keepExisting, prvRowIndex);
					return true;
				}

				// If conversation was closed then select last item of it.
				// Note: conversation_count can include sent items that have not
				// been fetched yet, so count the actually present items.
				store.expandConversation(record);
				prvRowIndex += store.getConversationItemsFromHeaderRecord(record).length;
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
	 * Helper function of {@link #onKeyPress} function.
	 * Which will update the end index for the selection range. It will also expand the conversation found at the endIndex.
	 * This might also update {@link #updatedLast} as new rows would be added in the grid due to expansion of the conversations.
	 *
	 * @param {Number} endIndex end index of the selection range
	 * @param {Boolean} up true if up key is pressed.
	 * @param {Number} add addend to add in endIndex in accordance with the direction.
	 */
	prepareEndSelectionIndex: function(endIndex, up, add)
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
				// Note: conversation_count can include sent items that have not
				// been fetched yet, so count the actually present items.
				var conversationCount = store.getConversationItemsFromHeaderRecord(record).length;
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
	 * This function will reset the config {@link #updatedLast}
	 */
	clearUpdatedLast: function()
	{
		this.updatedLast = undefined;
	},

	/**
	 * Overridden to batch select all rows without firing events per row.
	 * The base implementation calls selectRow in a loop for every row.
	 */
	selectAll: function()
	{
		var count = this.grid.store.getCount();
		if (this.isLocked() || count === 0) {
			return;
		}
		// Clear selection data without per-row deselect events,
		// matching the base selectAll behavior.
		this.selections.clear();
		this.selectRange(0, count - 1, true);
	},

	/**
	 * Overridden to batch select rows without firing events per row.
	 * The base implementation calls selectRow in a loop, which fires
	 * selectionchange and rowselect events for every row — causing
	 * O(n²) DOM updates when selecting hundreds of rows.
	 *
	 * @param {Number} startRow The index of the first row in the range
	 * @param {Number} endRow The index of the last row in the range
	 * @param {Boolean} keepExisting (optional) True to retain existing selections
	 */
	selectRange: function(startRow, endRow, keepExisting)
	{
		if (this.isLocked()) {
			return;
		}
		if (!keepExisting) {
			this.clearSelections();
		}

		var view = this.grid.getView();
		var store = this.grid.store;
		var count = Math.abs(endRow - startRow) + 1;

		// For small selections, use the default per-row approach
		if (count <= 20) {
			var i;
			if (startRow <= endRow) {
				for (i = startRow; i <= endRow; i++) {
					this.selectRow(i, true);
				}
			} else {
				for (i = startRow; i >= endRow; i--) {
					this.selectRow(i, true);
				}
			}
			return;
		}

		// For large selections, suppress per-row events and view updates
		this.silent = true;
		var step = (startRow <= endRow) ? 1 : -1;
		var end = endRow + step;
		for (var i = startRow; i !== end; i += step) {
			if (i < 0 || i >= store.getCount()) {
				continue;
			}
			if (keepExisting && this.isSelected(i)) {
				continue;
			}
			var r = store.getAt(i);
			if (r && this.fireEvent('beforerowselect', this, i, true, r) !== false) {
				this.selections.add(r);
				this.last = this.lastActive = i;
				view.onRowSelect(i);
			}
		}
		this.silent = false;

		// Fire events once for the entire batch
		this.fireEvent('selectionchange', this);
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
	onKeyPress: function(e, name)
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

				last = this.updatedLast;
				this.clearUpdatedLast();
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
