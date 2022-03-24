/**
 * @class Ext.tree.AsyncTreeNode
 * @overrrides Ext.tree.AsyncTreeNode
 *
 * This class overrides Ext.tree.AsyncTreeNode. It adds the functionality to silently load a node without expanding it.
 */
Ext.override(Ext.tree.AsyncTreeNode, {

	/**
	 * This functions loads a node without expanding it.
	 *
	 * @param deep
	 * @param anim
	 * @param callback
	 */
	quietLoad: function(deep, anim, callback) {
		deep = 0;
		if(this.loading){ // if an async load is already running, waiting til it's done
			var timer;
			var f = function(){
				if(!this.loading){ // done loading
					clearInterval(timer);
					//this.expand(deep, anim, callback);
				}
			}.createDelegate(this);
			timer = setInterval(f, 200);
			return;
		}

		if(!this.loaded){
			if(this.fireEvent("beforeload", this) === false){
				return;
			}
			this.loading = true;
			this.ui.beforeLoad(this);
			var loader = this.loader || this.attributes.loader || this.getOwnerTree().getLoader();
			if(loader){
				// add a class to hide the loading icon
				this.setCls("x-treenode-load-silent");
				loader.load(this, this.quietLoadComplete.createDelegate(this, [deep, anim, callback]));
				return;
			}
		}
	},

	/**
	 * Callback for the tree loader. It is called on the "load" event.
	 * @param deep
	 * @param anim
	 * @param callback
	 */
	quietLoadComplete : function(deep, anim, callback){
		// remove the silent class again
		this.setCls("");

		if (this.childNodes.length === 0) {
			this.leaf = true;
		}
		this.loading = false;
		this.loaded = true;
		this.ui.afterLoad(this);
		this.fireEvent("load", this);
		this.ui.expand();
	},

	/**
	 * Set the leaf flag for the node
	 * @param {Boolean} value
	 */
	setLeaf: function(value){
		this.leaf = value;
	}
});