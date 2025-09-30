(function() {
	// Ext 3 augments Array.prototype with remove/indexOf helpers. In some cases
	// third-party code may clobber the `indexOf` reference on the array instance,
	// which causes Ext.remove() to throw "this.indexOf is not a function".
	// Guard against that situation by falling back to the prototype implementation.
	var arrayProto = Array.prototype;
	var originalRemove = arrayProto.remove;
	var protoIndexOf = arrayProto.indexOf;

	if (typeof originalRemove === 'function') {
		arrayProto.remove = function(item) {
			var indexFn = this && typeof this.indexOf === 'function' ? this.indexOf : protoIndexOf;
			var index = -1;

			if (typeof indexFn === 'function') {
				index = indexFn.call(this, item);
			}

			if (index !== -1) {
				this.splice(index, 1);
			}

			return this;
		};
	}
})();
