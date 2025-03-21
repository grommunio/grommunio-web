Ext.namespace('Zarafa.plugins.mdm.ui');


/**
 * @class Zarafa.plugins.mdm.ui.MDMFolderNodeUI
 * @extends Zarafa.hierarchy.ui.FolderNodeUI
 *
 * {@link Zarafa.hierarchy.ui.FolderNodeUI} has limitation that it can add
 * (@link Ext.form.Checkbox check box} preceded to calendar item only.
 * So, It will add (@link Ext.form.Checkbox check box} preceded to all context items.
 */
Zarafa.plugins.mdm.ui.MDMFolderNodeUI = Ext.extend(Zarafa.hierarchy.ui.FolderNodeUI, {

	/**
	 * Function will render {@link Zarafa.hierarchy.ui.FolderNode FolderNode} based on modified template for
	 * our custom needs.
	 * @param {Zarafa.hierarchy.ui.FolderNode} node tree node.
	 * @param {Object} config config object of {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * @param {Ext.Element} targetNode element in which {@link Zarafa.hierarchy.ui.FolderNode FolderNode} will be rendered.
	 * @param {Boolean} bulkRender
	 */
	renderElements : function(node, config, targetNode, bulkRender)
	{
		// add some indent caching, this helps performance when rendering a large tree
		this.indentMarkup = node.parentNode ? node.parentNode.ui.getChildIndent() : '';

		var scheme;
		var cb = Ext.isBoolean(config.checked) && !(node instanceof Zarafa.hierarchy.ui.RootFolderNode);
		var isCalenderNode = config.folder.isCalendarFolder();
		var calendarSVGIcon = '';

		if (isCalenderNode) {
			var calendarContextModel = node.getOwnerTree().model;

			// We started providing color choosing facility to all the calendar tree-nodes.
			// CalendarContextModel is responsible for this facility.
			// There is no CalendarContextModel available in the case where that particular
			// calendar-tree-node doesn't belongs to MultiSelectHierarchyTree.
			// So, simply made that ContextModel available to current HierarchyTree.
			if (!calendarContextModel) {
				var calendarContext = container.getContextByName('calendar');
				calendarContextModel = calendarContext.getModel();
				node.getOwnerTree().model = calendarContextModel;
			}

			scheme = calendarContextModel.getColorScheme(config.folder.get('entryid'));

			// Get the scheme base only if we are able to get scheme successfully,
			// otherwise let it be undefined instead of a JS fatal error.
			if(scheme && scheme.base) {
				calendarSVGIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="color:'+scheme.base+';position:relative;top:5px;left:-1px;"><path style="fill:currentColor" d="M17.75 3A3.25 3.25 0 0 1 21 6.25v11.5A3.25 3.25 0 0 1 17.75 21H6.25A3.25 3.25 0 0 1 3 17.75V6.25A3.25 3.25 0 0 1 6.25 3h11.5Zm1.75 5.5h-15v9.25c0 .966.784 1.75 1.75 1.75h11.5a1.75 1.75 0 0 0 1.75-1.75V8.5Zm-11.75 6a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm4.25 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm-4.25-4a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm4.25 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm4.25 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm1.5-6H6.25A1.75 1.75 0 0 0 4.5 6.25V7h15v-.75a1.75 1.75 0 0 0-1.75-1.75Z"/></svg>';
			}
		}

		var icon = '<img src="' + (config.icon || this.emptyIcon) + '" class="x-tree-node-icon" unselectable="on" />',
		nel,
		href = config.href ? config.href : Ext.isGecko ? "" : "#",
		buf = '<li class="x-tree-node">' +
				'<div ext:tree-node-id="' + node.id + '" class="x-tree-node-el x-tree-node-leaf x-unselectable zarafa-hierarchy-node" unselectable="on">' +
					// indent space
					'<span class="x-tree-node-indent">' + this.indentMarkup + "</span>" +
					// expand icon
					'<img src="' + this.emptyIcon + '" class="x-tree-ec-icon x-tree-elbow" />' +
					// checkbox
					(cb ? '<input class="x-tree-node-cb zarafa-hierarchy-node-cb" type="checkbox" ' + (config.checked ? 'checked="checked" />' : '/>') : '') +
					// node icon
					(isCalenderNode ? calendarSVGIcon : icon) +
					// node element (this.elNode)
					'<a hidefocus="on" class="x-tree-node-anchor zarafa-hierarchy-node-anchor" ' +
						'href="' + href + '" tabIndex="1" ' +
						(config.hrefTarget ? ' target="' + config.hrefTarget + '"' : "") + ">" +
							// hierarchy node text (this.textNode)
							'<span unselectable="on">' + (node.tpl ? node.tpl.apply(config) : node.text) + '</span>' +
							// counter node (this.counterNode)
							'<span class="zarafa-hierarchy-node-counter" unselectable="on"></span>' +
							'<span class="zarafa-hierarchy-node-owner" unselectable="on"></span>'+
					"</a>" +
				"</div>" +
				'<ul class="x-tree-node-ct" style="display:none;"></ul>' +
			"</li>";

		if (bulkRender !== true && node.nextSibling && (nel = node.nextSibling.ui.getEl())) {
			this.wrap = Ext.DomHelper.insertHtml("beforeBegin", nel, buf);
		}else{
			this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf);
		}

		this.elNode = this.wrap.childNodes[0];
		this.ctNode = this.wrap.childNodes[1];
		var cs = this.elNode.childNodes;
		this.indentNode = cs[0];
		this.ecNode = cs[1];
		this.iconNode = cs[2];
		var index = 3;
		if (cb) {
			this.checkbox = cs[2];
			this.iconNode = cs[3];

			// Get child elements of calendar icon which is used to register in drag and drop manager.
			var groupContainerNode = this.iconNode.childNodes[0];
			if (Ext.isDefined(groupContainerNode)) {
				var groupNode = groupContainerNode.childNodes[0];
				var rectNode = groupNode.childNodes[0];
				var pathNode = groupContainerNode.childNodes[1];
				this.calendarSVGIconChilds = [rectNode, pathNode];
			}
			index++;
		}
		this.anchor = cs[index];
		this.textNode = cs[index].firstChild;

		this.counterNode = cs[index].firstChild.nextSibling;
		this.folderOwnerNode = this.counterNode.nextSibling;
		// Apply some optional CSS classes
		var elNode = Ext.get(this.elNode);
		var iconNode = Ext.get(this.iconNode);
		var containerNode = Ext.get(this.wrap);
		var textNode = Ext.get(this.textNode);
		if (isCalenderNode) {
			textNode.addClass('zarafa-hierarchy-node-color');
		}
		if (!Ext.isEmpty(config.cls)) {
			elNode.addClass(config.cls);
		}

		if (config.icon) {
			iconNode.addClass('x-tree-node-inline-icon');
		}

		if (config.iconCls) {
			iconNode.addClass(config.iconCls);
		}

		if (!Ext.isEmpty(config.containerCls)) {
			containerNode.addClass(config.containerCls);
		}

		this.updateCounter(node);
		this.showFolderOwner(node);
	}
});
