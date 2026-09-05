Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.FolderType
 * @singleton
 *
 * Mirrors the type of the selected folder as a class on the body, so the
 * stylesheet can pick matching artwork for empty lists and previews.
 */
Zarafa.core.FolderType = {
	/**
	 * @property {String} current The class currently set on the body.
	 */
	current: undefined,

	/**
	 * Follows the folder selection of the main view.
	 */
	init: function()
	{
		container.on('folderselect', this.onFolderSelect, this);
	},

	/**
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord/Array} folders The selected folder(s)
	 * @private
	 */
	onFolderSelect: function(folders)
	{
		var folder = Array.isArray(folders) ? folders[0] : folders;
		if (!folder) {
			// a context switch without a folder shows the default folder of the context
			var context = container.getCurrentContext();
			var model = context && Ext.isFunction(context.getModel) ? context.getModel() : undefined;
			folder = model && Ext.isFunction(model.getDefaultFolder) ? model.getDefaultFolder() : undefined;
		}
		this.apply(folder ? this.getKey(folder) : '');
	},

	/**
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder
	 * @return {String} The default folder key, or a key derived from the container class
	 */
	getKey: function(folder)
	{
		var key = Ext.isFunction(folder.getDefaultFolderKey) ? folder.getDefaultFolderKey() : undefined;
		if (!Ext.isEmpty(key)) {
			return key.toLowerCase();
		}
		if (!Ext.isFunction(folder.isContainerClass)) {
			return '';
		}
		var classes = { 'IPF.Note': 'mail', 'IPF.Appointment': 'calendar', 'IPF.Contact': 'contact', 'IPF.Task': 'task', 'IPF.StickyNote': 'note', 'IPF.Journal': 'journal' };
		for (var containerClass in classes) {
			if (folder.isContainerClass(containerClass, true)) {
				return classes[containerClass];
			}
		}
		return '';
	},

	/**
	 * @param {String} key The folder type key, empty for none
	 */
	apply: function(key)
	{
		var cls = key ? 'k-folder-' + key.replace(/[^a-z0-9]/g, '') : undefined;
		if (cls === this.current) {
			return;
		}
		if (this.current) {
			document.body.classList.remove(this.current);
		}
		if (cls) {
			document.body.classList.add(cls);
		}
		this.current = cls;
	}
};
