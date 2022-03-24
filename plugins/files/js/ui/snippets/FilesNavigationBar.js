Ext.namespace('Zarafa.plugins.files.ui.snippets');

/**
 * @class Zarafa.plugins.files.ui.snippets.FilesNavigationBar
 * @extends Ext.Panel
 * @xtype filesplugin.navigationbar
 *
 * This panel will display a windows explorer like navigation bar.
 */
Zarafa.plugins.files.ui.snippets.FilesNavigationBar = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Zarafa.core.Context} context The context to which this toolbar belongs
	 */
	context: undefined,

	/**
	 * The {@link Zarafa.core.ContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model: undefined,

	/**
	 * Maximum path parts to show. If the folder path is deeper,
	 * a back arrow will be shown.
	 * @property
	 * @type {Number}
	 */
	maxPathBeforeTruncate: 5,

	/**
	 * @cfg {Number} maxStringBeforeTruncate Maximum stringlength of a folder before it will get truncated.
	 */
	maxStringBeforeTruncate: 20,

	/**
	 * @cfg {String} pathTruncateText String that will be displayed in the back button.
	 */
	pathTruncateText: "&hellip;",

	/**
	 * Overflow flag. If this flag is true, the overflow button will be shown.
	 * @property
	 * @type boolean
	 */
	hasOverflow: false,

	/**
	 * The current path.
	 *
	 * @property
	 * @type {String}
	 */
	currentPath: '#R#',

	/**
	 * filesStore which contains the {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}.
	 *
	 * @property
	 * @type {Zarafa.plugins.files.data.FilesRecordStore}
	 */
	filesStore : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		if (Ext.isDefined(config.model) && !Ext.isDefined(config.filesStore)) {
			config.filesStore = config.model.getStore();
			this.currentPath = config.filesStore.folderId;
		}

		Ext.applyIf(config, {
			xtype : 'filesplugin.navigationbar',
			maskDisabled: false,
			hideBorders : true,
			border : false,
			cls: 'navbar_container',
			height: 25,
			defaults: {
				height: 25
			},
			layout : 'column',
		});

		Zarafa.plugins.files.ui.snippets.FilesNavigationBar.superclass.constructor.call(this, config);
	},

	/**
	 * initializes the events.
	 * @private
	 */
	initEvents: function () {
		this.on('afterrender', this.onAfterRender, this);
		this.mon(this.model, 'folderchange', this.onFolderChange, this);
		this.mon(this.model.getHierarchyStore(), 'updateFolder', this.onUpdateFolder, this);
		this.mon(this.model.getHierarchyStore(), 'load', this.onHierarchyStoreLoad, this);
	},

	/**
	 * Event handler triggered when {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore}.
	 * is load. It will update the navigation bar as per the default selected folder.
	 */
	onHierarchyStoreLoad : function()
	{
		var folder = this.model.getDefaultFolder();
		this.updateNavigationBar(folder);
	},

	/**
	 * Event handler triggered when folder was updated in hierarchy.
	 * It will call {@link #updateNavigationBar} function to update the navigation bar
	 * as per the updated folder.
	 *
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store
	 * @param {Zarafa.plugins.files.data.FilesStoreRecord} storeRecord
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder The folder which is updated in the hierarchy store.
	 */
	onUpdateFolder : function(store, parentFolder, folder)
	{
		if (folder.get('entryid') !== this.model.getDefaultFolder().get('entryid')) {
			return;
		}
		this.updateNavigationBar(folder);
	},

	/**
	 * Event handler triggered after the render navigation bar.
	 * update the navigation bar as per the currently selected folder.
	 */
	onAfterRender : function()
	{
		this.generateNavigationButtons(this.model.getDefaultFolder());
	},

	/**
	 * Event handler triggered when 'folderchange'. The function will
	 * update the navigation bar as per the currently selected folder.
	 */
	onFolderChange: function (model)
	{
		var folder = model.getDefaultFolder();
		this.updateNavigationBar(folder);
	},

	/**
	 * Update the navigation bar as per the selected folder if
	 * not selected it earlier.
	 *
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder The folder which is updated in the hierarchy store.
	 */
	updateNavigationBar : function (folder)
	{
		var currentPath = folder.get('folder_id');

		if (this.currentPath !== currentPath) {
			this.currentPath = currentPath;
			this.generateNavigationButtons(folder);
		}
	},

	/**
	 * Calculate the maximum number of folders we can display.
	 * @private
	 */
	recalculateMaxPath: function() {
		var maxItemWidth = this.maxStringBeforeTruncate * 8; // one char is 8 pixels long
		var totalWidth = this.getWidth();
		var children = this.items ? this.items.items : [];
		var removeStatic = this.hasOverflow ? 3 : 2; // -2 because home and account folder does not count

		Ext.each(children, function (child) {
			totalWidth -= child.getWidth();
		});

		if(totalWidth < maxItemWidth) {
			// we need more space - remove first children
			// so we need at least maxItemWidth - totalWidth;

			var spaceNeeded = maxItemWidth - totalWidth;
			var childrenToRemove = 0;

			Ext.each(children, function (child) {
				spaceNeeded -= child.getWidth();
				childrenToRemove++;

				if(spaceNeeded <= 0) {
					return false;
				}
			});

			this.maxPathBeforeTruncate = children.length - childrenToRemove;
		} else {
			this.maxPathBeforeTruncate = Math.floor(children.length + (totalWidth / maxItemWidth));
		}
		this.maxPathBeforeTruncate = this.maxPathBeforeTruncate - removeStatic;
	},

	/**
	 * Create home button in navigation bar.
	 */
	createHomeButton : function()
	{
		// Added Home button in files navigation bar.
		this.add({
			xtype : 'button',
			cls: "files_navbar_button files_navbar_button_first",
			tooltip: dgettext('plugin_files', 'Home'),
			path: "#R#", // root folder
			listeners: {
				click: this.doNavButtonClick,
				scope : this
			},
			iconCls: "files_navbar files_navbar_home"
		});
	},

	/**
	 * Create backend root button in navigation bar.
	 * @param {String} path The path of selected node/button in files navigation bar.
	 * @param {String} accountID The accountID of selected configured account.
	 * @param {Boolean} isLastButton true if selected node/button is last button in
	 * navigation bar
	 */
	createBackEndRootButton : function (path, accountID, isLastButton)
	{
		if (Ext.isEmpty(accountID)) {
			return;
		}

		var account = this.accountsStore.getById(accountID);
		if (Ext.isEmpty(account)) {
			return;
		}

		var lastCls = isLastButton ? " files_navbar_button_last" : "";
		var accountName = Zarafa.plugins.files.data.Utils.Format.truncate(account.get("name"), this.maxStringBeforeTruncate);
		var accButton = {
			xtype : 'button',
			cls : "files_navbar_button" + lastCls,
			path : "#R#" + accountID + "/",
			listeners : {
				click : this.doNavButtonClick,
				scope : this
			},
			text : accountName
		};

		// If account name is not set by user then show account backend icon
		if (Ext.isEmpty(accountName)) {
			accButton.iconCls = "files_navbar icon_16_" + account.get("backend");
		}
		this.add(accButton);
	},

	/**
	 * Create buttons for the given folder path.
	 *
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder The folder which is updated in the hierarchy store.
	 */
	generateNavigationButtons: function (folder) {
		var currentPath = Ext.isDefined(folder) ? folder.get('folder_id') : "#R#";
		var accountID = Zarafa.plugins.files.data.Utils.File.getAccountId(currentPath);
		var path = Zarafa.plugins.files.data.Utils.File.stripAccountId(currentPath);

		// recalculate the width
		this.recalculateMaxPath();

		// first remove old buttons
		this.removeAll(true);

		// Create home button.
		this.createHomeButton();
		var isLastButton = path.indexOf("/") === -1 || path === "/";
		// Create Backend root button.
		this.createBackEndRootButton(path, accountID, isLastButton);

		if (!isLastButton) {
			var currPath = "/";
			var pathParts = path.replace(/^\/|\/$/g, '').split("/"); // trim leading and trailing slash and split afterwards

			if(pathParts.length > this.maxPathBeforeTruncate) {
				this.hasOverflow = true;

				var overflowParts = pathParts.splice(0, (pathParts.length - this.maxPathBeforeTruncate));

				var menu = [];
				Ext.each(overflowParts, function (pathPart) {
					currPath += pathPart + "/";
					menu.push({
						text: Zarafa.plugins.files.data.Utils.Format.truncate(pathPart, this.maxStringBeforeTruncate),
						handler: this.doNavButtonClick,
						iconCls: 'icon_folder_note',
						path: "#R#" + accountID + currPath,
						scope : this
					});
				}, this);

				var overflowButton = new Ext.Button({
					cls: "files_navbar_button",
					menu: menu,
					text : this.pathTruncateText
				});
				this.add(overflowButton);
			} else {
				this.hasOverflow = false;
			}

			Ext.each(pathParts, function (pathPart, index) {
				currPath += pathPart + "/";
				var lastCls = index == (pathParts.length-1) ? " files_navbar_button_last" : "";
				var navBtn = new Ext.Button({
					text: Zarafa.plugins.files.data.Utils.Format.truncate(pathPart, this.maxStringBeforeTruncate),
					cls: "files_navbar_button" + lastCls,
					path: "#R#" + accountID + currPath,
					listeners: {
						click: this.doNavButtonClick,
						scope : this
					}
				});
				this.add(navBtn);
			}, this);
		}

		this.doLayout();
	},

	/**
	 * Event handler that handles a navigation button click.
	 *
	 * @param button
	 */
	doNavButtonClick: function(button)
	{
		var model = this.model;
		var hierarchyStore = model.getHierarchyStore();
		var folder = hierarchyStore.getFolderByFolderId(button.path);

		if (!Ext.isDefined(folder)) {
			return;
		}

		if (folder.isHomeFolder()) {
			model.setPreviewRecord(undefined);
		}

		container.selectFolder(folder);
	}
});

Ext.reg('filesplugin.navigationbar', Zarafa.plugins.files.ui.snippets.FilesNavigationBar);
