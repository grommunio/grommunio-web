(function() {
	/*
	 * Override Ext.form.BasicForm, there is a unwanted behavior in there
	 * which annoys users. For example the user is typing in field A, but
	 * loadRecord() is called on the form. This will remove the changes
	 * in field A and load them with the new contents.
	 *
	 * So to fix this, we prevent that when a field has the focus, and
	 * contains modifications, we ignore that given field.
	 */
	Ext.override(Ext.form.BasicForm, {

		// updateRecord overridden to check for the 'isSingleValued' property.
		updateRecord : function(record)
		{
			record.beginEdit();
			var fs = record.fields,
				 field,
				 value;
			fs.each(function(f){
				field = this.findField(f.name);
				if (field) {
					value = field.getValue();
					if (Ext.type(value) !== false && value.getGroupValue) {
						value = value.getGroupValue();
						// This else statement has been changed, originally it was if (field.eachItem).
						// From ExtJs code this could only be true for CompositeFields, however in WebApp
						// we use Composite fields for returning a single values based on combining the
						// values from the individual components. To keep supporting this feature without
						// requiring a completely new component support for the config option 'isSingleValued'
						// has been added (defined in Zarafa.common.ui.CompositeField).
					} else if (field.isSingleValued !== true && field.eachItem) {
						value = [];
						field.eachItem(function(item){
							value.push(item.getValue());
						});
					}
					record.set(f.name, value);
				}
			}, this);
			record.endEdit();
			return this;
		},

		// setValues overridden to add the checks:
		//   if (!field.hasFocus || (field.originalValue == field.el.dom.value)) {
		//   }
		setValues : function(values)
		{
			if(Ext.isArray(values)){ // array of objects
				for(var i = 0, len = values.length; i < len; i++){
					var v = values[i];
					var f = this.findField(v.id);
					if(f){
						// Don't update an input field which the user is working in
						if (!f.hasFocus || (f.originalValue == f.el.dom.value)) {
							f.setValue(v.value);
							if(this.trackResetOnLoad){
								f.originalValue = f.getValue();
							}
						}
					}
				}
			}else{ // object hash
				var field, id;
				for(id in values){
					if(!Ext.isFunction(values[id]) && (field = this.findField(id))) {
						// Don't update an input field which the user is working in
						if (!field.hasFocus || (field.originalValue == field.el.dom.value)) {
							field.setValue(values[id]);
							if(this.trackResetOnLoad){
								field.originalValue = field.getValue();
							}
						}
					}
				}
			}
			return this;
		}
	});
})();
