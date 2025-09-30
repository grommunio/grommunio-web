(function() {
	if (!Ext.util || !Ext.util.MixedCollection) {
		return;
	}

	var proto = Ext.util.MixedCollection.prototype;
	var protoIndexOf = proto.indexOf;

	proto.remove = function(item) {
		var index;

		if (typeof this.indexOf === 'function' && this.indexOf !== proto.remove) {
			index = this.indexOf(item);
		} else if (typeof protoIndexOf === 'function') {
			index = protoIndexOf.call(this, item);
		} else if (this.items && typeof this.items.indexOf === 'function') {
			index = this.items.indexOf(item);
		} else {
			index = -1;
		}

		return this.removeAt(index);
	};
})();
