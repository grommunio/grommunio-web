Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.TreeFilter
 * @extends Ext.tree.TreeFilter
 *
 * Filter class for the Tree, this enables filtering of the tree nodes,
 * in which tree nodes are filtered according to the filter query.
 */
Zarafa.common.ui.TreeFilter = Ext.extend(Ext.tree.TreeFilter, {
    /**
	 * @constructor
	 * @param {Ext.tree.Tree} tree The tree which this filter is being applied on
	 * @param {Object} config Configuration object
	 */
	constructor: function(tree, config)
	{
		Zarafa.common.ui.TreeFilter.superclass.constructor.apply(this, arguments);

		this.filterBy = this.filterByText.createDelegate(this);
    },
	
	/**
	 * Filter by a function. The passed function will be called with each node in the tree (or from the startNode). 
	 * If the function returns true, the node is kept otherwise it is filtered.
	 * If a node is filtered, its children are also filtered.
	 * @param {Function} fn The filter function
	 * @param {Object} scope scope of the function
	 * @param {Ext.tree.TreeNode} startNode root node of the tree
	 */
    filterByText: function (fn, scope, startNode)
    {
        startNode = startNode || this.tree.root;
        if (this.autoClear) {
            this.clear();
        }
        var found = {};
        var af = this.filtered, rv = this.reverse;
        var f = function (n) {
            if (n == startNode) {
                return true;
            }
            if (af[n.id]) {
                return false;
            }

            var m = fn.call(scope || n, n);

            if (!m || rv) {
                af[n.id] = n;
                return true;
            }

            found[n.id] = n;
            return true;
        };

        startNode.cascade(f, this);

        for (var idf in found) {
            if (typeof idf !== "function") {
                var curFoundItem = found[idf];
                var p = curFoundItem.parentNode;
                while (p) {
                    delete af[p.id];
                    p = p.parentNode;
                }
            }
        }

        for (var id in af) {
            if (typeof id !== "function") {
                var n = af[id];
                n.ui.hide();
            }
        }

        if (this.remove) {
            for (var id in af) {
                if (typeof id !== "function") {
                    var n = af[id];
                    if (n && n.parentNode) {
                        n.parentNode.removeChild(n);
                    }
                }
            }
        }
    },
    
    /**
     * Clears the current filter. Note: with the "remove" option
     * set a filter cannot be cleared.
     */
    clear : function()
    {
        var af = this.filtered;
        for (var id in af) {
            if (typeof id != "function") {
                var n = af[id];
                if (n && !Ext.isEmpty(n.ui)) {
                    n.ui.show();
                }
            }
        }
        this.filtered = {};
    }
});