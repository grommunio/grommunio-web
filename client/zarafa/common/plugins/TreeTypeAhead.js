Ext.namespace('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.TreeTypeAhead
 * @extends Object
 * @ptype zarafa.treetypeahead
 *
 * Selects a node of a {@link Ext.tree.TreePanel tree} while its name is typed, the
 * way a file manager does. Typing the same letter again steps through the folders
 * starting with it, the arrow keys keep working as before.
 */
Zarafa.common.plugins.TreeTypeAhead = Ext.extend(Object, {
	/**
	 * @cfg {Number} timeout Milliseconds of silence after which the typed text is forgotten
	 */
	timeout: 1000,

	/**
	 * The text typed so far.
	 * @property
	 * @type String
	 */
	buffer: '',

	/**
	 * The time the last character was typed.
	 * @property
	 * @type Number
	 */
	lastKeyTime: 0,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config || {});
	},

	/**
	 * Initialize the plugin for the given tree.
	 * @param {Ext.tree.TreePanel} tree The tree on which the plugin is installed
	 */
	init: function(tree)
	{
		this.tree = tree;
		tree.on('afterrender', this.onAfterRender, this);
	},

	/**
	 * Listen for typing on the rendered tree.
	 * @private
	 */
	onAfterRender: function()
	{
		this.tree.mon(this.tree.getTreeEl(), 'keypress', this.onKeyPress, this);
	},

	/**
	 * Collect the typed characters and select the folder they name.
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onKeyPress: function(event)
	{
		if (event.ctrlKey || event.altKey || event.metaKey) {
			return;
		}

		var character = String.fromCharCode(event.getCharCode());
		if (character.length !== 1 || character < ' ') {
			return;
		}

		var now = new Date().getTime();
		if (now - this.lastKeyTime > this.timeout) {
			this.buffer = '';
		}
		this.lastKeyTime = now;

		// The same letter over and over steps through the folders starting with it
		var repeat = this.buffer === character;
		if (!repeat) {
			this.buffer += character;
		}

		var node = this.findNode(this.buffer, repeat);
		if (!node && this.buffer.length > 1) {
			// What was typed matches nothing, take the last character as a fresh start
			this.buffer = character;
			node = this.findNode(this.buffer, true);
		}

		if (node) {
			event.stopEvent();
			this.tree.getSelectionModel().select(node);
			node.ensureVisible();
		}
	},

	/**
	 * Find the node whose name starts with the given text.
	 * @param {String} prefix The text typed so far
	 * @param {Boolean} next True to start looking below the selected node, so that
	 * repeating a letter walks through the folders starting with it
	 * @return {Ext.tree.TreeNode} the node, or null when nothing matches
	 * @private
	 */
	findNode: function(prefix, next)
	{
		var nodes = this.getVisibleNodes();
		var selected = this.tree.getSelectionModel().getSelectedNode();
		var offset = next && selected ? nodes.indexOf(selected) + 1 : 0;

		prefix = prefix.toLowerCase();

		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[(offset + i) % nodes.length];
			if (String(node.text || '').toLowerCase().indexOf(prefix) === 0) {
				return node;
			}
		}

		return null;
	},

	/**
	 * The nodes the user can see, in the order the tree shows them.
	 * @return {Ext.tree.TreeNode[]} the nodes
	 * @private
	 */
	getVisibleNodes: function()
	{
		var nodes = [];
		var root = this.tree.getRootNode();

		var collect = function(node) {
			Ext.each(node.childNodes, function(child) {
				if (!child.ui || !child.ui.rendered || child.ui.hidden) {
					return;
				}
				nodes.push(child);
				if (child.isExpanded()) {
					collect(child);
				}
			});
		};

		if (root) {
			collect(root);
		}

		return nodes;
	}
});

Ext.preg('zarafa.treetypeahead', Zarafa.common.plugins.TreeTypeAhead);
