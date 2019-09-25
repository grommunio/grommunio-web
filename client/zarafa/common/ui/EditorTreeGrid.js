Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.EditorTreeGrid
 * @extends Zarafa.common.ui.TreeGrid
 * @xtype zarafa.editortreegrid
 *
 * Special extension of the {@link Zarafa.common.ui.TreeGrid} to add editing
 * capabilities into the treegrid. This works similar to the {@link Ext.grid.EditorGrid}.
 */
Zarafa.common.ui.EditorTreeGrid = Ext.extend(Zarafa.common.ui.TreeGrid, {
	/**
	 * @cfg {Number} clicksToEdit
	 * The number of clicks on a cell required to display the cell's editor (defaults to 2).
	 */
	clicksToEdit: 2,

	/**
	 * The currently active {@link Ext.form.Field Form Field} which is currently
	 * displayed as editor inside the grid.
	 * @property
	 * @type Ext.grid.GridEditor
	 */
	activeEditor : undefined,

	/**
	 * True when a cell is currently being edited by the user.
	 * @property
	 * @type Boolean
	 */
	editing : false,

	/**
	 * @cfg {Boolean} autoEncode
	 * True to automatically HTML encode and decode values pre and post edit (defaults to false)
	 */
	autoEncode : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		this.addEvents(
			/**
			 * @event beforeedit
			 * Fires before cell editing is triggered.
			 * @param {Zarafa.common.ui.EditorTreeGrid} grid The grid which fired the event
			 * @param {Ext.tree.TreeNode} node The node which is going to be edited
			 * @param {Number} column The column which is going to be edited
			 */
			'beforeedit',
			/**
			 * @event afteredit
			 * Fires after a cell is edited.
			 * @param {Zarafa.common.ui.EditorTreeGrid} grid The grid which fired the event
			 * @param {Ext.tree.TreeNode} node The node which was edited
			 * @param {Number} column The column which was edited
			 * @param {Mixed} value The new value which is applied into the node
			 */
			'afteredit',
			/**
			 * @event validateedit
			 * Fires after a cell is edited, but before the value is set in the record. Return false
			 * to cancel the change.
			 * @param {Zarafa.common.ui.EditorTreeGrid} grid The grid which fired the event
			 * @param {Ext.tree.TreeNode} node The node which was edited
			 * @param {Number} column The column which was edited
			 * @param {Mixed} value The new value which should be validated
			 */
			'validateedit'
		);

		Zarafa.common.ui.EditorTreeGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Called by Extjs to intialize all event handlers.
	 * This will register the {@link #onClickEdit} function on the {@link #click} or
	 * {@link #dblclick} event (depending on the {@link #clicksToEdit} configuration option.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.ui.EditorTreeGrid.superclass.initEvents.call(this);

		// When the columns are being resized, stop all editing
		this.mon(this.colResizer.tracker, 'dragstart', this.stopEdit, this, [true]);

		// Depending on the clicksToEdit configuration option,
		// we must listen to the single-click or double-click event
		// to instantiate the editing.
		if (this.clicksToEdit == 1) {
			this.on('click', this.onClickEdit, this);
		} else {
			this.on('dblclick', this.onClickEdit, this);
		}
	},

	/**
	 * Event handler called when the user either clicked or double-clicked on this grid
	 * (depending on {@link #clicksToEdit}. This will determine if the node can be edited
	 * (When the node is a {@link Ext.tree.TreeNode#leaf leaf}. If so, it will determine
	 * which column was clicked and call {@link #startEdit}.
	 * @param {Ext.tree.TreeNode} node The node which was clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onClickEdit : function(node, event)
	{
		if (node.leaf) {
			var td = Ext.get(event.target);
			if (td.dom.nodeName !== 'TD') {
				td = td.parent('td');
			}
			var tr = td.parent('tr');
			var index = [].slice.call(tr.dom.childNodes).indexOf(td.dom);

			this.startEdit(node, index);
		}
	},

	/**
	 * Called to initiate the editing of a given column for the provided node.
	 * This will obain the {@link #getCellEditor editor} to be used for the column,
	 * if an editor is provided it will be rendered into the given cell to allow
	 * the user to edit the cell.
	 * @param {Ext.tree.TreeNode} node The node on which the editing will take place
	 * @param {Number} column The column index in which the editing will start
	 * @private
	 */
	startEdit : function(node, column)
	{
		this.stopEdit();

		if (this.isCellEditable(node, column)) {
			if (this.fireEvent('beforeedit', this, node, column) !== false) {
				this.editing = true;

				var editor = this.getCellEditor(node, column);
				if (!editor) {
					return;
				}

				if (!editor.rendered) {
					this.mon(editor, {
						render: this.onEditRender,
						complete: this.onEditComplete,
						canceledit: this.stopEdit.createDelegate(this, [true]),
						scope: this
					});
				}

				Ext.apply(editor, {
					node : node,
					column : column
				});

				this.activeEditor = editor;

				var value = this.preEditValue(node, column);
				editor.startEdit(this.getCell(node, column), value);
			}
		}
	},

	/**
	 * Event handler called when the {@link #activeEditor} is being rendered.
	 * This will force the focus to be applied to the editor, and make sure
	 * that the editor is correctly blurred when needed.
	 * @param {Ext.grid.GridEditor} editor The editor which is being rendered
	 * @private
	 */
	onEditRender : function(editor)
	{
		// When rendering, we need to directly place the focus on the editor
		editor.field.focus();

		// When the user clicks on the component, we must preserve the focus
		// to prevent the component being blurred and the editor to be disabled
		// again. This is especially needed for CheckBox component which requires
		// a 'click' event to change the value.
		this.mon(editor.field.el, 'mousedown', function() {
			editor.selectSameEditor = true;
			// A few milliseconds after the event, we must clear the status again.
			(function(){
				delete editor.selectSameEditor;
				// Force the focus back to the field, otherwise we will miss the
				// next blur event and are we stuck with the editor.
				editor.field.focus();
			}).defer(50);
		});
	},

	/**
	 * Called to end all editing on the current cell. This will reset the {@link #editing}
	 * and {@link #activeEditor} fields.
	 * @param {Boolean} cancel True when the editing is stopped due to a cancellation, and the
	 * changes should not be saved.
	 * @private
	 */
	stopEdit : function(cancel)
	{
		if (this.editing === true) {
			var editor = this.activeEditor;
			if (editor) {
				editor[cancel === true ? 'cancelEdit' : 'completeEdit']();
			}
			this.activeEditor = null;
		}
		this.editing = false;
	},

	/**
	 * Event handler which is called when the editing in the {@link #activeEditor} has been
	 * completed and a new value must be applied to the cell.
	 * @param {Ext.grid.GridEditor} editor The grid editor used to modify the field
	 * @param {Mixed} value The new value which must be applied to the cell
	 * @param {Mixed} oldValue The previous value which was applied to the cell
	 * @private
	 */
	onEditComplete : function(editor, value, oldValue)
	{
		var node = editor.node;
		var column = editor.column;

		this.editing = false;
		this.activeEditor = null;

		value = this.postEditValue(node, column, value, oldValue);

		if (String(value) !== String(oldValue)) {
			if (this.fireEvent('validateedit', this, node, column, value) !== false) {
				var columnObj = this.getColumn(column);

				node.attributes[columnObj.dataIndex] = value;

				// Check if the column has a templated,
				// if that is the case format the value before
				// applying it to the cell.
				if (columnObj.tpl) {
					var data = {};
					data[columnObj.dataIndex] = value;
					this.getCell(node, column).innerHTML = columnObj.tpl.apply(data);
				} else {
					this.getCell(node, column).innerHTML = value;
				}

				this.fireEvent('afteredit', this, node, column, value);
			}
		}
	},

	/**
	 * Obtain the correct value for the requested cell, and if {@link #autoEncode needed} then
	 * the value will be {@link Ext.util.Format.htmlDecode decoded}.
	 * @param {Ext.tree.TreeNode} node The node which is going to be edited
	 * @param {Number} column The column index which is going to be edited
	 * @return {Mixed} value The value which will be placed in the editor component
	 * @private
	 */
	preEditValue : function(node, column)
	{
		var value = node.attributes[this.getColumn(column).dataIndex];
		return this.autoEncode && Ext.isString(value) ? Ext.util.Format.htmlDecode(value) : value;
	},

	/**
	 * If {@link #autoEncode needed} then the value will be {@link Ext.util.Format.htmlEncode encoded}
	 * before it is saved into the cell.
	 * @param {Ext.tree.TreeNode} node The node which was edited
	 * @param {Number} column The column index which was edited
	 * @param {Mixed} value The new value which was entered into the editor
	 * @param {Mixed} oldValue The old value which was inside the editor
	 * @private
	 */
	postEditValue : function(node, column, value, oldValue)
	{
		return this.autoEncode && Ext.isString(value) ? Ext.util.Format.htmlEncode(value) : value;
	},

	/**
	 * Checks if the cell which was selected by the user is editable
	 * @param {Ext.tree.TreeNode} node The node on which we are going to edit
	 * @param {Number} column The column which is going to be edited
	 * @return {Boolean} True when the given cell is editable
	 */
	isCellEditable : function(node, column)
	{
		return this.getColumn(column).editable === true;
	},

	/**
	 * Obtain the {@link Ext.grid.Column column} belonging to the given index.
	 * @param {Number} column The index number of the column which is requested
	 * @return {Ext.grid.Column} The column which belongs to the given index
	 */
	getColumn : function(column)
	{
		return this.columns[column];
	},

	/**
	 * Obtain the HTMLElement which belongs to the cell indicated by the node and the column.
	 * @param {Ext.tree.TreeNode} node The node for which the cell is looked up
	 * @param {Number} column The index number of the column for which we are looking up the cell
	 * @return {Ext.Element} The element which represents the cell
	 */
	getCell : function(node, column)
	{
		return node.ui.elNode.childNodes[column].firstChild;
	},

	/**
	 * Obtain the {@link Ext.form.Field} which should be used for editing the cell
	 * indicated by the given node and column.
	 * @param {Ext.tree.TreeNode} node The node for which the required editor is looked up
	 * @param {Number} column The column index for which the editor is looked up
	 * @return {Ext.form.Field} The editor used to edit the given cell
	 */
	getEditor : function(node, column)
	{
		return this.columns[column].editor;
	},

	/**
	 * Obtain the {@link Ext.grid.GridEditor} for the {@link #getEditor editor} that should be
	 * used for editing the given cell.
	 * @param {Ext.tree.TreeNode} node The node for which the required editor is looked up
	 * @param {Number} column The column index for which the editor is looked up
	 * @return {Ext.grid.GridEditor} The grid editor which wraps the editor from {@link #getEditor}.
	 */
	getCellEditor : function(node, column)
	{
		var editor = this.getEditor(node, column);
		if (editor) {
			if (!editor.startEdit) {
				if (!editor.gridEditor) {
					// We remove the default x-small-editor CSS class as that makes the trigger
					// image smaller then the actual textfield.
					editor.gridEditor = new Ext.grid.GridEditor(editor, { cls: 'x-grid-editor' });
				}
				editor = editor.gridEditor;
			}
		}

		return editor;
	}
});

Ext.reg('zarafa.editortreegrid', Zarafa.common.ui.EditorTreeGrid);
