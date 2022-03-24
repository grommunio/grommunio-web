Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.FolderNodeUI
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
Zarafa.plugins.files.ui.FolderNodeUI  = Ext.extend(Ext.tree.TreeNodeUI, {

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
		var cb = Ext.isBoolean(a.checked);
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
						icon +
						// node element (this.elNode)
						'<a hidefocus="on" class="x-tree-node-anchor zarafa-hierarchy-node-anchor" ' +
						'href="' + href + '" tabIndex="1" ' +
						(a.hrefTarget ? ' target="' + a.hrefTarget + '"' : "") + ">" +
							// hierarchy node text (this.textNode)
							'<span unselectable="on">' + (n.tpl ? n.tpl.apply(a) : n.text) + '</span>' +
							'<span class="zarafa-hierarchy-node-backend" unselectable="on"></span>'+
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
			index++;
		}
		this.anchor = cs[index];
		this.textNode = cs[index].firstChild;

		this.folderBackendNode = cs[index].firstChild.nextSibling;
		// Apply some optional CSS classes
		var elNode = Ext.get(this.elNode);
		var iconNode = Ext.get(this.iconNode);
		var containerNode = Ext.get(this.wrap);

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
		this.showFolderBackend(n);
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
	 * Function is used to show backend name along with {@link Zarafa.plugins.files.data.FilesFolderRecord folder} folder name.
	 * @param {Zarafa.plugins.files.ui.FilesFolderNode} node which has to show backend name.
	 */
	showFolderBackend : function (node)
	{
		var folder = node.getFolder();

		if (!Ext.isDefined(folder) || !folder.isSubTreeFolder()) {
			return;
		}

		var ownerNode = Ext.get(this.folderBackendNode);
		var store = folder.getFilesStore();
		var ownerName = ' - ' + store.getBackend();

		ownerNode.update(ownerName);
		ownerNode.repaint();
	}
});
