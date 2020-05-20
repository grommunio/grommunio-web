describe('SettingsConversationWidget', function() {
	var settingsModel;
	var widget;

	beforeEach(function() {
        container.setServerConfig({'enable_conversation_view': true});
		widget = new Zarafa.mail.settings.SettingsConversationWidget();
        settingsModel = container.getSettingsModel();
        settingsModel.initialize(settingsModel.defaults);
        widget.update(settingsModel);
	});

	afterEach(function() {
		widget.destroy();
    });

    /**
     * Unit Test for the render setting conversation widget.
     */
    describe('Render', function(){

        it('Should have proper title', function(){
            expect(widget.title).toEqual("Conversation view settings");
        });

        it('Should default \'Unchecked\' and \'Enabled\' Enable conversation view checkbox', function() {
            var enableConversationsCheckBox = widget.enableConversations;
            var enableConversations = settingsModel.get(enableConversationsCheckBox.name);

            expect(enableConversationsCheckBox.disabled).toBeFalsy();
            expect(enableConversationsCheckBox.checked).toBeFalsy();
            expect(enableConversations).toBeFalsy();
        });

        it('Should default \'checked\' and \'Disable\' Collapse conversation when selecting a different email checkbox', function() {
            var singleExpand = settingsModel.get(widget.singleExpand.name);

            expect(widget.singleExpand.disabled).toBeTruthy();
            expect(widget.singleExpand.checked).toBeTruthy();
            expect(singleExpand).toBeTruthy();
        });
    });

    /**
     * Unit test cases for 'Enabled conversation checkbox'.
     */
    describe('Enabled conversation checkbox', function(){
        var checkbox;

        beforeEach(function(){
            checkbox = widget.enableConversations;
        });

        it('Should update the setting while check \'Enabled conversation view\' checkbox', function() {
            checkbox.setValue(true);

            expect(settingsModel.get(checkbox.name)).toBeTruthy();
        });


        it('Should enable the \'Collapse conversation when selecting a different email\'', function() {
            checkbox.setValue(true);

            expect(settingsModel.get(checkbox.name)).toBeTruthy();
            expect(widget.singleExpand.disabled).toBeFalsy();
            expect(widget.singleExpand.checked).toBeTruthy();
        });

        it('Should disable the \'Collapse conversation when selecting a different email\' checkbox if \'Enabled conversation view\' checkbox unchecked.', function(){
            checkbox.setValue(true);

            expect(settingsModel.get(checkbox.name)).toBeTruthy();
            expect(widget.singleExpand.disabled).toBeFalsy();
            expect(widget.singleExpand.checked).toBeTruthy();

            checkbox.setValue(false);
            
            expect(settingsModel.get(checkbox.name)).toBeFalsy();
            expect(widget.singleExpand.disabled).toBeTruthy();
            expect(widget.singleExpand.checked).toBeTruthy();
        });
    });

    /**
     * Unit test cases for 'Expand single conversation'.
     */
    describe('Expand single conversation', function(){
        var checkbox;

        beforeEach(function(){
            checkbox = widget.singleExpand;
            widget.enableConversations.setValue(true);
        });

        it('Should update the setting while uncheck \'Collapse conversation when selecting a different email\' checkbox', function() {
            checkbox.setValue(false);

            expect(settingsModel.get(checkbox.name)).toBeFalsy();
        });
    });
});