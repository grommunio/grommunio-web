Ext.namespace('Grommunio.mail.ui');

/**
 * @class Grommunio.mail.ui.MailGridView
 * @extends Grommunio.common.ui.grid.GridView
 */
Grommunio.mail.ui.MailGridView = Ext.extend(Grommunio.common.ui.grid.GridView, {
	/**
	 * This is called internally, once, by this.render after the HTML elements are added to the grid element.
	 * This is always intended to be called after renderUI. Sets up listeners on the UI elements
	 * and sets up options like column menus, moving and resizing.
	 * This function is overridden to use a {@link Grommunio.common.ui.grid.GridDragZone} for the {@link #dragZone},
	 * rather then the default {@link Ext.grid.GridDragZone}.
	 * This is always intended to be called after renderUI. Sets up listeners on the UI elements
	 * and sets up options like column menus, moving and resizing. It will overwrite to hide the
	 * 'Group By This Field' button from header menu and change css class for the check box.
	 * @private
	 */
	afterRenderUI: function()
	{
		Grommunio.mail.ui.MailGridView.superclass.afterRenderUI.apply(this, arguments);

		// Override the this.columnDrop to avoid switch the icon column in
		// conversation view.
		if (this.grid.enableColumnMove) {
			this.columnDrop = new Grommunio.mail.ui.MailGridHeaderDropZone(this.grid, this.mainHd.dom);
		}
	},

	/**
	 * Function used to set the focus on {@link Grommunio.mail.ui.MailGrid MailGrid}.
	 */
	setFocus : function()
	{
        if (Ext.isGecko) {
            this.focusEl.focus();
        } else {
	this.focusEl.focus.defer(1, this.focusEl);
        }
	}
});

