Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.FolderNodeUI
 * @extends Ext.tree.TreeNodeUI
 *
 * {@link Ext.tree.TreeNodeUI TreeNodeUI} has limitation that you can't add html tags to textNode as it should only
 * contain text, not anything else. but we need to add counter of folders to textnode and also make some changes according to
 * counters shown or not. So this class changes the template that is used to create {@link Zarafa.hierarchy.ui.FolderNode FolderNode}
 * so we can create a new element for showing counters so it will not interfere with default functionality of text nodes.
 *
 * The default layout of extjs for treenodes is something like this
  <pre><code>
 	 <div unselectable="on" class="x-tree-node-el x-tree-node-leaf x-unselectable" >	// element node
 		<span class="x-tree-node-indent">		// for indentation
 			<img class="x-tree-elbow-line">
 			<img class="x-tree-elbow-line">
 		</span>
 		<img class="x-tree-ec-icon x-tree-elbow">	// expand icon
 		<img unselectable="on" class="x-tree-node-icon icon_folder_note">	// folder icon
 		<a tabindex="1" href="" class="x-tree-node-anchor" hidefocus="on">
 			<span unselectable="on"> node text </span>						// text node
 		</a>
 	 </div>
  </code></pre>
 *  but for our custom needs we need to chagne that layout to accomodate counters also
  <pre><code>
 	<div unselectable="on" class="x-tree-node-el x-tree-node-leaf x-unselectable" >	// element node
 		<span class="x-tree-node-indent">		// for indentation
 			<img class="x-tree-elbow-line">
 			<img class="x-tree-elbow-line">
 		</span>
 		<img class="x-tree-ec-icon x-tree-elbow">	// expand icon
 		<img unselectable="on" class="x-tree-node-icon icon_folder_note">	// folder icon
 		<a tabindex="1" href="" class="x-tree-node-anchor" hidefocus="on">
 			<span unselectable="on" class="zarafa-hierarchy-node-text"> node text </span>	// text node
 			<span unselectable="on" class="zarafa-hierarchy-node-unread-count">(2)</span>	// counter node
 		</a>
 	</div>
  </code></pre>
 */
Zarafa.hierarchy.ui.FolderNodeUI = Ext.extend(Ext.tree.TreeNodeUI, {

	/**
	 * The currently active countertype for this folder node
	 * @property
	 * @type Zarafa.hierarchy.data.CounterTypes
	 */
	currentCounterType : undefined,

	/**
	 * Function will render {@link Zarafa.hierachy.ui.FolderNode FolderNode} based on modified template for
	 * our custom needs.
	 * @param {Zarafa.hierarchy.ui.FolderNode} n tree node.
	 * @param {Object} a config object of {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * @param {Ext.Element} targetNode element in which {@link Zarafa.hierarchy.ui.FolderNode FolderNode} will be rendered.
	 * @param {Boolean} bulkRender
	 */
	renderElements : function(n, a, targetNode, bulkRender)
	{
		// add some indent caching, this helps performance when rendering a large tree
		this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

		var scheme;
		var cb = Ext.isBoolean(a.checked);
		var isCalenderNode = a.folder.isCalendarFolder();
		var calendarSVGIcon = '';

		if (isCalenderNode) {
			var calendarContextModel = n.getOwnerTree().model;

			// We started providing color choosing facility to all the calendar tree-nodes.
			// CalendarContextModel is responsible for this facility.
			// There is no CalendarContextModel available in the case where that particular
			// calendar-tree-node doesn't belongs to MultiSelectHierarchyTree.
			// So, simply made that ContextModel available to current HierarchyTree.
			if (!calendarContextModel) {
				var calendarContext = container.getContextByName('calendar');
				calendarContextModel = calendarContext.getModel();
				n.getOwnerTree().model = calendarContextModel;
			}

			scheme = calendarContextModel.getColorScheme(a.folder.get('entryid'));

			// Get the scheme base only if we are able to get scheme successfully,
			// otherwise let it be undefined instead of a JS fatal error.
			if(scheme && scheme.base) {
				calendarSVGIcon = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="15" height="13" viewBox="0 0 15 13" style="color:'+scheme.base+'; position:relative; top:2px;">' + 
									'<g>' + 
										'<g class="icbg" style="fill:currentColor;stroke:none">' + 
											'<rect width="15" height="12" x="0" y="1" />' + 
											'<rect width="1" height="1" x="2" y="0" />' + 
											'<rect width="1" height="1" x="7" y="0" />' + 
											'<rect width="1" height="1" x="12" y="0" />' +
										'</g>' + 
										'<path class="icgr" d="M 2.5,6.5 h 10 v 4 h -10 v -4.5 M 4.5,6.5 v 4 M 6.5,6.5 v 4 M 8.5,6.5 v 4 M 10.5,6.5 v 4 M 2.5,8.5 h 9.5" style="fill:currentColor;stroke:#ffffff;stroke-width:1;stroke-linejoin=miter" />' + 
									'</g>' + 
								'</svg>' ;
			}
		}

		var icon = '<img src="' + (a.icon || this.emptyIcon) + '" class="x-tree-node-icon" unselectable="on" />',
		nel,
		href = a.href ? a.href : Ext.isGecko ? "" : "#",
		buf = '<li class="x-tree-node">' +
				'<div ext:tree-node-id="' + n.id + '" class="x-tree-node-el x-tree-node-leaf x-unselectable zarafa-hierarchy-node" unselectable="on">' +
					// indent space
					'<span class="x-tree-node-indent">' + this.indentMarkup + "</span>" +
					// expand icon
					'<img src="' + this.emptyIcon + '" class="x-tree-ec-icon x-tree-elbow" />' +
					// checkbox
					(cb ? '<input class="x-tree-node-cb zarafa-hierarchy-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>') : '') +
					// node icon
					(isCalenderNode ? calendarSVGIcon : icon) +
					// node element (this.elNode)
					'<a hidefocus="on" class="x-tree-node-anchor zarafa-hierarchy-node-anchor" ' +
						'href="' + href + '" tabIndex="1" ' +
						(a.hrefTarget ? ' target="' + a.hrefTarget + '"' : "") + ">" +
							// hierarchy node text (this.textNode)
							'<span unselectable="on">' + (n.tpl ? n.tpl.apply(a) : n.text) + '</span>' +
							// counter node (this.counterNode)
							'<span class="zarafa-hierarchy-node-counter" unselectable="on"></span>' +
							'<span class="zarafa-hierarchy-node-owner" unselectable="on"></span>'+
					"</a>" +
				"</div>" +
				'<ul class="x-tree-node-ct" style="display:none;"></ul>' +
			"</li>";

		if (bulkRender !== true && n.nextSibling && (nel = n.nextSibling.ui.getEl())) {
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

			// Get child elements of caledar icon which is used to register in drag and drop manager.
			var groupContainerNode = this.iconNode.childNodes[0];
			var groupNode = groupContainerNode.childNodes[0];
			var rectNode = groupNode.childNodes[0];
			var pathNode = groupContainerNode.childNodes[1];
			this.calendarSVGIconChilds = [rectNode, pathNode];
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
		if (!Ext.isEmpty(a.cls)) {
			elNode.addClass(a.cls);
		}

		if (a.icon) {
			iconNode.addClass('x-tree-node-inline-icon');
		}

		if (a.iconCls) {
			iconNode.addClass(a.iconCls);
		}

		if (!Ext.isEmpty(a.containerCls)) {
			containerNode.addClass(a.containerCls);
		}

		this.updateCounter(n);
		this.showFolderOwner(n);
	},

	/**
	 * Function is used to show folder owner name along with {@link Zarafa.hierarchy.data.FavoritesFolderRecord favorites} folder name.
	 * @param {Zarafa.hierarchy.ui.FolderNode} node which has to show folder owner name.
	 */
	showFolderOwner : function (node)
	{
		var folder = node.getFolder();

		if (!Ext.isDefined(folder) || !folder.isFavoritesFolder() || folder.isIPMSubTree() || folder.isFavoritesRootFolder()) {
			return;
		}

		var ownerNode = Ext.get(this.folderOwnerNode);
		var store = container.getHierarchyStore().getById(folder.get('store_entryid'));
		var ownerName = '';
		if(store.isPublicStore()) {
			ownerName = ' - ' + store.get('display_name');
		} else if(store.get('mailbox_owner_name') !== container.getUser().getDisplayName()) {
			ownerName = ' - ' + store.get('mailbox_owner_name');
		}
		ownerNode.update(ownerName);
		ownerNode.repaint();
	},
	
	/**
	 * Update the {@link #counterNode counter} with the correct value.
	 * @param {Zarafa.hierarchy.ui.FolderNode} node The node which is being updated
	 */
	updateCounter : function(node)
	{
		var folder = node.getFolder();
		var elNode = Ext.get(this.elNode);
		var counterNode = Ext.get(this.counterNode);

		if (!Ext.isDefined(folder)) {
			return;
		}

		var currentCounterType = this.currentCounterType;
		var newCounterType = folder.getCounterType();

		switch (newCounterType) {
			case Zarafa.hierarchy.data.CounterTypes.TOTAL:
				// update total count, only update the CSS classes when something has changed.
				if (!Ext.isDefined(currentCounterType)) {
					elNode.addClass(['zarafa-hierarchy-node-total-count', 'zarafa-hierarchy-node-withcounter']);
				} else if (currentCounterType !== newCounterType) {
					elNode.replaceClass('zarafa-hierarchy-node-unread-count', 'zarafa-hierarchy-node-total-count');
					elNode.addClass('zarafa-hierarchy-node-withcounter');
				}
				counterNode.update('(' + folder.getCounterValue() + ')');
				counterNode.repaint();
				break;
			case Zarafa.hierarchy.data.CounterTypes.UNREAD:
				// update unread count, only update the CSS classes when something has changed.
				if (!Ext.isDefined(currentCounterType)) {
					elNode.addClass(['zarafa-hierarchy-node-unread-count', 'zarafa-hierarchy-node-withcounter']);
				} else if (currentCounterType !== newCounterType) {
					elNode.replaceClass('zarafa-hierarchy-node-total-count', 'zarafa-hierarchy-node-unread-count');
					elNode.addClass('zarafa-hierarchy-node-withcounter');
				}
				counterNode.update('(' + folder.getCounterValue() + ')');
				counterNode.repaint();
				break;
			case Zarafa.hierarchy.data.CounterTypes.NONE:
			/* falls through */
			default:
				// remove values from counter node, only update the CSS classes when something has changed.
				if (Ext.isDefined(currentCounterType) && currentCounterType !== newCounterType) {
					elNode.removeClass(['zarafa-hierarchy-node-total-count', 'zarafa-hierarchy-node-unread-count']);
					elNode.removeClass('zarafa-hierarchy-node-withcounter');
				}
				counterNode.update('');
				counterNode.repaint();
				break;
		}
		this.currentCounterType = newCounterType;
	},

	/**
	 * Called when the node has changed the text, this will re-apply the text to the node
	 * @param {Ext.tree.Node} node The node which must be updated
	 * @param {String} text The text which must be applied to the node
	 * @param {String} oldText The previous text which was set on the node
	 * @private
	 */
	onTextChange : function(node, text, oldText)
	{
		if (this.rendered) {
			this.textNode.innerHTML = node.tpl ? node.tpl.apply(node.attributes) : text;
		}
	},

	/**
	 * Called when the node is going to change the icon.
	 * @param {Ext.tree.Node} node The node which must be updated
	 * @param {String} iconCls The iconCls which must be applied to the {@link #iconNode}
	 * @param {String} oldIconCls The old iconCls which must be removed from the {@link #iconNode}.
	 * @private
	 */
	onIconChange : function(node, iconCls, oldIconCls)
	{
		if (this.rendered) {
			var iconNode = Ext.get(this.iconNode);
			if (!Ext.isEmpty(oldIconCls)) {
				iconNode.replaceClass(oldIconCls, iconCls);
			} else {
				iconNode.addClass(iconCls);
			}
		}
	},

	/**
	 * Called when the node is going to change the class.
	 * @param {Ext.tree.Node} node The node which must be updated
	 * @param {String} cls The class which must be applied to the {@link #iconNode}
	 * @private
	 */
	onContainerClsChange : function(node, cls, oldCls)
	{
		if(this.rendered) {
			var containerNode = Ext.get(this.wrap);
			if (!Ext.isEmpty(oldCls)) {
				containerNode.replaceClass(oldCls, cls);
			} else {
				containerNode.addClass(cls);
			}
		}
	},

	/**
	 * Function returns array of {@link Ext.Element nodes} which should be registered with
	 * drag and drop manager for {@link Zarafa.hierarchy.ui.Tree Tree}.
	 * @return {Ext.Element[]} nodes which should be registered with dnd manager.
	 */
	getDDHandles : function()
	{
		// register counter node, icon node, text node to dnd manager
		var nodes = [this.iconNode, this.textNode, this.counterNode, this.elNode];

		// If we have calendar context then register SVG icon child's components to dnd manager
		if (Ext.isDefined(this.calendarSVGIconChilds)) {
			nodes = nodes.concat(this.calendarSVGIconChilds);
		}
		return nodes;
	}
});
