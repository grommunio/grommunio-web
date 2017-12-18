/*
 * Test the Zarafa.common.ui.BoxField component.
 */
describe('BoxField', function() {
	var field;
	var boxStore;
	var recordType;

	beforeEach(function() {
		field = new Zarafa.common.ui.BoxField({
			boxConfig: {
				textTpl: '<tpl if="!Ext.isEmpty(values.display_name)">' +
						'{values.display_name}' +
					'</tpl>'
			},
			store : new Ext.data.Store()
		});
		boxStore = new Ext.data.Store();
		field.setBoxStore(boxStore);

		recordType = Ext.data.Record.create([ 'display_name', 'type' ]);

		field.render(Ext.getBody());
	});

	afterEach(function() {
		field.destroy();
		boxStore.destroy();
	});

	var getKeyEvent = function(key) {
		const e = new Ext.EventObjectImpl();
		e.keyCode = key;
		e.ctrlKey = false;
		e.shiftKey = false;
		e.altKey = false;
		return e;
	};

	/*
	 * Test if all events are working for the BoxField.
	 *
	 * For checking if an event has been fired we add
	 * a spy on the BoxField.fireEvent() function.
	 */
	describe('Events', function() {
		var box;

		beforeEach(function() {
			boxStore.add(new recordType({ 'display_name' : 'nonsense', 'type' : 1 }));
			box = field.items.first();
			spyOn(field, 'fireEvent').and.callThrough();
		});

		it('will resize the input field when the user presses a non-special key', function() {
			spyOn(field, 'sizeInputfield').and.callThrough();

			field.onKeyDownHandler(getKeyEvent('A'.charCodeAt(0)));

			expect(field.sizeInputfield).toHaveBeenCalled();
		});

		it('will not resize the input field when the user presses a special key', function() {
			spyOn(field, 'sizeInputfield').and.callThrough();

			field.onKeyDownHandler(getKeyEvent(Ext.EventObject.ENTER));

			expect(field.sizeInputfield).not.toHaveBeenCalled();
		});

		it('will select the input field when the user clicks on the field', function() {
			spyOn(field.el, 'focus').and.callThrough();

			field.getContentTarget().dom.click();

			expect(field.el.focus).toHaveBeenCalled();
		});

		it('will select the input field when the user clicks on the input field', function() {
			spyOn(field.el, 'focus').and.callThrough();

			field.el.dom.click();

			expect(field.el.focus).toHaveBeenCalled();
		});

		it('will select the last box when the user clicks on the non-editable field', function() {
			field.editable = false;
			spyOn(box, 'focus').and.callThrough();

			field.getContentTarget().dom.click();

			expect(box.focus).toHaveBeenCalled();
		});

		it('fires the \'boxadd\' when a record is added to the boxStore', function() {
			boxStore.add(new recordType({ 'display_name' : 'nonsense', 'type' : 1 }));
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxadd');
		});

		it('fires the \'boxremove\' event when a box is removed', function() {
			box.delBtnEl.dom.click();
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxremove');
		});

		it('fires the \'boxcontextmenu\' event when a box gets right clicked', function() {
			box.onContextMenu(Ext.EventObject);
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxcontextmenu');
		});

		it('fires the \'boxfocus\' event when a box wants the focus', function() {
			box.focus();
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxfocus');
		});

		it('fires the \'boxblur\' event when a box wants to blur', function() {
			box.blur();
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxblur');
		});

		it('fires the \'boxclick\' event when a box is clicked', function() {
			box.getEl().dom.click();
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxclick');
		});

		it('fires the \'boxdblclick\' event when a box is double clicked', function() {
			box.onDblClick(Ext.EventObject);
			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxdblclick');
		});
	});

	/*
	 * Test if the box is updated by the BoxField.
	 */
	describe('Box update', function() {
		var box;

		beforeEach(function() {
			boxStore.add(new recordType({ 'display_name' : 'nonsense', 'type' : 1 }));
			box = field.items.first();
		});

		it('updates the box when the record is changed', function(){
			spyOn(box, 'update');
			box.record.set('display_name', 'MORE nonsense');
			expect(box.update).toHaveBeenCalled();
		});

		it('notifies the field when the box is focussed', function(){
			spyOn(field, 'doBoxFocus');
			box.focus();
			expect(field.doBoxFocus).toHaveBeenCalled();
		});

		it('notifies the field when the box is blurred', function(){
			spyOn(field, 'doBoxBlur');
			box.blur();
			expect(field.doBoxBlur).toHaveBeenCalled();
		});

		it('notifies the field when the box is removed', function(){
			spyOn(field, 'doBoxRemove');
			box.onClickRemove(Ext.EventObject);
			expect(field.doBoxRemove).toHaveBeenCalled();
		});

		it('notifies the field when the box is clicked', function(){
			spyOn(field, 'doBoxClick');
			box.onClick(Ext.EventObject);
			expect(field.doBoxClick).toHaveBeenCalled();
		});

		it('notifies the field when a contextmenu event is triggered on the box', function(){
			spyOn(field, 'doBoxContextMenu');
			box.onContextMenu(Ext.EventObject);
			expect(field.doBoxContextMenu).toHaveBeenCalled();
		});

		it('notifies the field when the box is double clicked', function(){
			spyOn(field, 'doBoxDblClick');
			box.onDblClick(Ext.EventObject);
			expect(field.doBoxDblClick).toHaveBeenCalled();
		});

	});

	/*
	 * Test if the function that are called to add boxes or refresh the boxField
	 * are using the filter function to filter out records that should not be 
	 * displayed by this BoxField.
	 */
	describe('Record filter', function() {

		beforeEach(function() {
			spyOn(field, 'filterRecord').and.callFake(function(record) {
				return record.get('type') === 1;
			});
			boxStore.add([
				new recordType({ 'display_name' : '1', 'type' : 1 }),
				new recordType({ 'display_name' : '2', 'type' : 2 }),
				new recordType({ 'display_name' : '3', 'type' : 2 })
			]);
		});

		it('will add a box when the added record passes the filter', function() {
			var record = new recordType({ 'display_name' : '1', 'type' : 1 });
			boxStore.add(record);

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(2);
		});

		it('will not add a box when the added record doesn\'t pass the filter', function() {
			var record = new recordType({ 'display_name' : '1', 'type' : 2 });
			boxStore.add(record);

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(1);
		});

		it('will update a box when the store is refreshed and the record passes the filter', function() {
			// Don't use set(), we don't want any events yet
			boxStore.getAt(1).data.type = 1;
			boxStore.fireEvent('datachanged', boxStore);

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(2);
		});

		it('will remove a box when the store is refreshed and the records doesn\'t pass the filter', function() {
			// Don't use set(), we don't want any events yet
			boxStore.getAt(0).data.type = 2;
			boxStore.fireEvent('datachanged', boxStore);

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(0);
		});

		it('will update a box when the record is updated and it passed the filter', function() {
			var box = field.items.items[0];
			spyOn(box, 'update');

			boxStore.getAt(0).set('display_name', 'Update');

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(1);
			expect(box.update).toHaveBeenCalled();
		});

		it('will add a box when the record is updated and it passes the filter', function() {
			boxStore.getAt(1).set('type', 1);

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(2);
		});

		it('will remove a box when the record is updated and it doesn\'t pass the filter', function() {
			boxStore.getAt(0).set('type', 2);

			expect(field.filterRecord).toHaveBeenCalled();
			expect(field.items.getCount()).toEqual(0);
		});
	});

	/*
	 * Test if the keys work correctly inside the BoxField
	 */
	describe('Key handlers', function() {

		beforeEach(function() {
			boxStore.add([
				new recordType({ 'display_name' : '1', 'type' : 1 }),
				new recordType({ 'display_name' : '2', 'type' : 2 }),
				new recordType({ 'display_name' : '3', 'type' : 2 })
			]);
		});

		/*
		 * Test if the key handlers on the Input field are correctly working
		 */
		describe('Input keys', function() {

			it('will convert the typed input to a new Box when the user presses the ; key', function() {
				spyOn(field, 'handleInput').and.callThrough();

				field.setValue('input');
				field.inputKeyMap.handleKeyDown(getKeyEvent(';'.charCodeAt(0)));

				expect(field.handleInput).toHaveBeenCalledWith('input');
			});

			it('will convert the typed input to a new Box when the user presses the ENTER key', function() {
				spyOn(field, 'handleInput').and.callThrough();

				field.setValue('input');
				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));

				expect(field.handleInput).toHaveBeenCalledWith('input');
			});

			it('will convert the typed input to a new Box when the user presses the TAB key', function() {
				spyOn(field, 'handleInput').and.callThrough();

				field.setValue('input');
				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.TAB));

				expect(field.handleInput).toHaveBeenCalledWith('input');
			});

			it('will move the focus to the next focusable element when the user presses the TAB key with empty field', function(){
				spyOn(field, 'triggerBlur').and.callThrough();
				
				field.setValue('');
				field.onFocus();
				expect(field.hasFocus).toBeTruthy();

				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.TAB));

				expect(field.hasFocus).toBeFalsy();
				expect(field.triggerBlur).toHaveBeenCalled();
			});

			it('will select the last box when the user presses the UP key from the input field', function() {
				var box = field.items.items[field.items.items.length - 1];
				spyOn(box, 'focus');

				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.UP));

				expect(box.focus).toHaveBeenCalled();
			});

			it('will select the last box when the user presses the PAGE_UP key from the input field', function() {
				var box = field.items.items[field.items.items.length - 1];
				spyOn(box, 'focus');

				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.UP));

				expect(box.focus).toHaveBeenCalled();
			});

			it('will select the last box when the user presses the LEFT key from the input field', function() {
				var box = field.items.items[field.items.items.length - 1];
				spyOn(box, 'focus');

				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.LEFT));

				expect(box.focus).toHaveBeenCalled();
			});

			it('will select the first box when the user presses the HOME key from the input field', function() {
				var box = field.items.items[0];
				spyOn(box, 'focus');

				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.HOME));

				expect(box.focus).toHaveBeenCalled();
			});

			it('will select the last box when the user presses the BACKSPACE key from the input field', function() {
				var box = field.items.items[field.items.items.length - 1];
				spyOn(box, 'focus');

				field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.BACKSPACE));

				expect(box.focus).toHaveBeenCalled();
			});
		});

		/*
		 * Test if the key handlers on the boxes are correctly working
		 */
		describe('Box keys', function() {

			it('will fire the \'boxdblclick\' event when the user presses the ENTER key when a box was selected', function() {
				var box = field.items.items[0];

				spyOn(field, 'fireEvent').and.callThrough();

				box.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));

				expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('boxdblclick');
			});

			it('will select the previous box when the user presses the UP key when a box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];
				var targetBox = field.items.items[field.items.items.length - 2];

				spyOn(targetBox, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.UP));

				expect(targetBox.focus).toHaveBeenCalled();
			});

			it('will select the previous box when the user presses the PAGE_UP key when a box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];
				var targetBox = field.items.items[field.items.items.length - 2];

				spyOn(targetBox, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.PAGE_UP));

				expect(targetBox.focus).toHaveBeenCalled();
			});

			it('will select the next box when the user presses the DOWN key when a box was selected', function() {
				var firstBox = field.items.items[0];
				var targetBox = field.items.items[1];

				spyOn(targetBox, 'focus');

				firstBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.DOWN));

				expect(targetBox.focus).toHaveBeenCalled();
			});

			it('will select the next box when the user presses the PAGE_DOWN key when a box was selected', function() {
				var firstBox = field.items.items[0];
				var targetBox = field.items.items[1];

				spyOn(targetBox, 'focus');

				firstBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.PAGE_DOWN));

				expect(targetBox.focus).toHaveBeenCalled();
			});

			it('will select the input field when the user presses the PAGE_DOWN key when the last box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];

				spyOn(field.el, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.PAGE_DOWN));

				expect(field.el.focus).toHaveBeenCalled();
			});

			it('will select the previous box when the user presses the LEFT key when a box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];
				var targetBox = field.items.items[field.items.items.length - 2];

				spyOn(targetBox, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.LEFT));

				expect(targetBox.focus).toHaveBeenCalled();
			});

			it('will select the next box when the user presses the RIGHT key when a box was selected', function() {
				var firstBox = field.items.items[0];
				var targetBox = field.items.items[1];

				spyOn(targetBox, 'focus');

				firstBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.RIGHT));

				expect(targetBox.focus).toHaveBeenCalled();
			});

			it('will select the input field when the user presses the RIGHT key when the last box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];

				spyOn(field.el, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.RIGHT));

				expect(field.el.focus).toHaveBeenCalled();
			});

			it('will select the first box when the user presses the HOME key when a box was selected', function() {
				var firstBox = field.items.items[0];
				var lastBox = field.items.items[field.items.items.length - 1];

				spyOn(firstBox, 'focus');
	
				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.HOME));

				expect(firstBox.focus).toHaveBeenCalled();
			});

			it('will select the last box when the user presses the END key when a box was selected', function() {
				var firstBox = field.items.items[0];
				var lastBox = field.items.items[field.items.items.length - 1];

				spyOn(lastBox, 'focus');
	
				firstBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.END));

				expect(lastBox.focus).toHaveBeenCalled();
			});

			it('will select the input field when the user presses the END key when the last box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];

				spyOn(field.el, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.END));

				expect(field.el.focus).toHaveBeenCalled();
			});

			it('will delete the selected box, and select the previous box when the user presses the BACkSPACE key when a box was selected', function() {
				var lastBox = field.items.items[field.items.items.length - 1];
				var targetBox = field.items.items[field.items.items.length - 2];

				spyOn(field, 'fireEvent').and.callThrough();
				spyOn(targetBox, 'focus');

				lastBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.BACKSPACE));

				expect(field.fireEvent.calls.argsFor(3)[0]).toEqual('boxremove');
				expect(field.boxStore.getCount()).toEqual(2);
			});

			it('will delete the selected box, and select the next box when the user presses the BACkSPACE key when the first box was selected', function() {
				var firstBox = field.items.items[0];
				var targetBox = field.items.items[1];

				spyOn(field, 'fireEvent').and.callThrough();
				spyOn(targetBox, 'focus');

				firstBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.BACKSPACE));

				expect(field.fireEvent.calls.argsFor(3)[0]).toEqual('boxremove');
				expect(targetBox.focus).toHaveBeenCalled();
				expect(field.boxStore.getCount()).toEqual(2);
			});

			it('will delete the selected box, and select the input field when the user presses the BACkSPACE key when the last box was selected', function() {
				field.boxStore.removeAt(0);
				field.boxStore.removeAt(1);

				var box = field.items.items[0];

				spyOn(field, 'fireEvent').and.callThrough();
				spyOn(field.el, 'focus');

				box.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.BACKSPACE));

				expect(field.fireEvent.calls.argsFor(3)[0]).toEqual('boxremove');
				expect(field.el.focus).toHaveBeenCalled();
				expect(field.boxStore.getCount()).toEqual(0);
			});

			it('will delete the selected box, and select the next box when the user presses the DELETE key when a box was selected', function() {
				var firstBox = field.items.items[0];
				var targetBox = field.items.items[1];

				spyOn(field, 'fireEvent').and.callThrough();
				spyOn(targetBox, 'focus');

				firstBox.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.DELETE));

				expect(field.fireEvent.calls.argsFor(3)[0]).toEqual('boxremove');
				expect(targetBox.focus).toHaveBeenCalled();
				expect(field.boxStore.getCount()).toEqual(2);
			});

			it('will delete the selected box, and select the input field when the user presses the DELETE key when the last box was selected', function() {
				var box = field.items.items[field.items.items.length - 1];

				spyOn(field, 'fireEvent').and.callThrough();
				spyOn(field.el, 'focus');

				box.getEl().dom.click();

				field.boxKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.DELETE));

				expect(field.fireEvent.calls.argsFor(3)[0]).toEqual('boxremove');
				expect(field.el.focus).toHaveBeenCalled();
			});
		});
	});

	/**
	 * Test all cases of restricting the amount of boxes in the field
	 */
	describe('Box Limit', function() {

		beforeEach(function() {
			field.boxLimit = 2;
			spyOn(field, 'handleInput').and.callFake(function(str) {
				var record = new recordType({ 'display_name' : str, 'type' : 1 });
				this.boxStore.add(record);
			});
		});

		it('will not make the field readOnly if the number of boxes is lower then the limit while typing new items', function() {
			field.setValue('Test User');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));

			expect(field.items.getCount()).toEqual(1);
			expect(field.readOnly).toBeFalsy();
		});

		it('will not make the field readOnly if the number of boxes is lower then the limit when adding records to the store', function() {
			boxStore.add(new recordType({ 'display_name' : 'Test User', 'type' : 1 }));

			expect(field.items.getCount()).toEqual(1);
			expect(field.readOnly).toBeFalsy();
		});

		it('will make the field readOnly if the number of boxes matches the limit while typing new items', function() {
			field.setValue('Test User');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));
			field.setValue('Test User 2');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));

			expect(field.items.getCount()).toEqual(2);
			expect(field.readOnly).toBeTruthy();
		});

		it('will make the field readOnly if the number of boxes matches the limit while adding records to the store', function() {
			boxStore.add(new recordType({ 'display_name' : 'Test User', 'type' : 1 }));
			boxStore.add(new recordType({ 'display_name' : 'Test User 2', 'type' : 1 }));

			expect(field.items.getCount()).toEqual(2);
			expect(field.readOnly).toBeTruthy();
		});

		it('will remove the readOnly flag if the boxes above the limit are being removed while clicking the remove button', function() {
			field.setValue('Test User');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));
			field.setValue('Test User 2');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));

			field.items.items[0].delBtnEl.dom.click();

			expect(field.items.getCount()).toEqual(1);
			expect(field.readOnly).toBeFalsy();
		});

		it('will preserve the readOnly flag if the field was configured as readOnly and the boxes above the limit are being removed while clicking the remove button', function() {
			field.initialConfig.readOnly = true;

			field.setValue('Test User');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));
			field.setValue('Test User 2');
			field.specialInputKeyMap.handleKeyDown(getKeyEvent(Ext.EventObject.ENTER));

			field.items.items[0].delBtnEl.dom.click();

			expect(field.items.getCount()).toEqual(1);
			expect(field.readOnly).toBeTruthy();
		});

		it('will remove the readOnly flag if the boxes above the limit are being removed while removing records from the store', function() {
			boxStore.add(new recordType({ 'display_name' : 'Test User', 'type' : 1 }));
			boxStore.add(new recordType({ 'display_name' : 'Test User 2', 'type' : 1 }));

			boxStore.removeAt(0);

			expect(field.items.getCount()).toEqual(1);
			expect(field.readOnly).toBeFalsy();
		});

		it('will preserve the readOnly flag if the field was configured as readOnly and the boxes above the limit are being removed while removing records from the store', function() {
			field.initialConfig.readOnly = true;

			boxStore.add(new recordType({ 'display_name' : 'Test User', 'type' : 1 }));
			boxStore.add(new recordType({ 'display_name' : 'Test User 2', 'type' : 1 }));

			boxStore.removeAt(0);

			expect(field.items.getCount()).toEqual(1);
			expect(field.readOnly).toBeTruthy();
		});
	});
});
