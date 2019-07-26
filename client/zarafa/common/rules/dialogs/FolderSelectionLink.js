Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.FolderSelectionLink
 * @extends Ext.BoxComponent
 * @xtype zarafa.folderselectionlink
 *
 * Action component for the {@link Zarafa.common.rules.data.ActionFlags#MOVE MOVE}
 * and {@link Zarafa.common.rules.data.ActionFlags#COPY COPY} Action Flags. This
 * will show the currently selected {@link #folder} to the user, and allows
 * the user to select the desired destination folder.
 */
Zarafa.common.rules.dialogs.FolderSelectionLink = Ext.extend(Ext.BoxComponent, {
	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	emptyText :_('Select one...'),

	/**
	 * The folder which was selected by the user
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 */
	folder : undefined,

	/**
	 * The Action type which is handled by this view
	 * This is set during {@link #setAction}.
	 * @property
	 * @type Zarafa.common.rules.data.ActionFlags
	 */
	actionFlag : undefined,

	/**
	 * The action property which was configured during
	 * {@link #setAction}.
	 * @property
	 * @type Object
	 */
	action : undefined,

	/**
	 * True if the action was modified by the user, if this is false,
	 * then {@link #getAction} will return {@link #action} instead
	 * of returning a new object.
	 * @property
	 * @type Boolean
	 */
	isModified : false,

	/**
	 * True if the action/condition is complete and valid,
	 * False will denote that action/condition is invalid or incomplete
	 * if this is true, then {@link #getCondition} will return {@link #condition} instead
	 * of returning a new object and {@link #getAction} will return {@link #action}
	 * instead of returning a new Object.
	 * @property
	 * @type Boolean
	 */
	isValid : true,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config,{
			xtype: 'zarafa.folderselectionlink',
			border : false,
			autoScroll :true,
			anchor : '100%',
			tpl : new Ext.XTemplate(
				'<div class="zarafa-folder-link">' +
					'<tpl if="!Ext.isEmpty(values.display_name)">' +
						'&quot;{display_name:htmlEncode}&quot;' +
					'</tpl>' +
					'<tpl if="Ext.isEmpty(values.display_name)">' +
						'&quot;' + _('Unnamed folder') + '&quot;' +
					'</tpl>' +
				'</div>',
				{
					compiled : true
				}
			)
		});

		Zarafa.common.rules.dialogs.FolderSelectionLink.superclass.constructor.call(this, config);
	},

	/**
	 * This function is called after the component has been rendered.
	 * This will register the {@link #onActivate} and {@link #onClick} event handlers.
	 * @private
	 */
	afterRender : function()
	{
		Zarafa.common.rules.dialogs.FolderSelectionLink.superclass.afterRender.apply(this, arguments);

		this.mon(this.getActionEl(), 'click', this.onClick, this);
	},

	/**
	 * Called when user clicks on a {@link Zarafa.common.rules.dialogs.FolderSelectionLink}
	 * It opens hierarchy folder selection dialog
	 * @param {Ext.DataView} dataView Reference to this object
	 * @param {Number} index The index of the target node
	 * @param {HTMLElement} node The target node
	 * @param {Ext.EventObject} evt The mouse event
 	 * @protected
	 */
	onClick : function(dataView, index, node, evt)
	{
		Zarafa.hierarchy.Actions.openFolderSelectionContent({
			folder : this.folder,
			hideTodoList: true,
			callback : function(folder) {
				this.folder = folder;
				this.isModified = true;
				this.update(folder);
			},
			scope : this,
			modal : true
		});
	},

	/**
	 * Apply an action onto the DataView, this will parse the action and show
	 * the contents in a user-friendly way to the user.
	 * @param {Zarafa.common.rules.data.ActionFlags} actionFlag The action type
	 * which identifies the exact type of the action.
	 * @param {Object} action The action to apply
	 */
	setAction : function(actionFlag, action)
	{
		this.folder = undefined;
		this.isValid = false;

		if (action) {
			var store = container.getHierarchyStore().getById(action.storeentryid);
			if (store) {
				this.folder = store.getSubStore('folders').getById(action.folderentryid);
				if(Ext.isDefined(this.folder)) {
					this.isValid = true;
				}
			}
		}

		this.actionFlag = actionFlag;
		this.action = action;
		this.isModified = !Ext.isDefined(action);
		this.update(this.folder);
	},

	/**
	 * Obtain the action as configured by the user
	 * @return {Object} The action
	 */
	getAction : function()
	{
		if (this.isModified !== true && this.isValid === true) {
			return this.action;
		}

		var actionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.ACTION);
		var actionDefinition = actionFactory.getActionById(this.actionFlag);
		return actionDefinition({folder : this.folder});
	},

	/**
	 * Update the contents of this dataview, this will apply the {@link #tpl} for
	 * the {@link #folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to show
	 */
	update : function(folder)
	{
 		var data = folder ? folder.data : { display_name : this.emptyText };
		Zarafa.common.rules.dialogs.FolderSelectionLink.superclass.update.call(this, this.tpl.apply(data));
	}
});

Ext.reg('zarafa.folderselectionlink', Zarafa.common.rules.dialogs.FolderSelectionLink);
