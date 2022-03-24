Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.MultipleFileUploadField
 * @extends Ext.ux.form.FileUploadField
 * @xtype filesplugin.multiplefileuploadfield
 *
 * Creates a file upload field.
 */
Zarafa.plugins.files.ui.MultipleFileUploadField = Ext.extend(Ext.ux.form.FileUploadField, {
	// override
	createFileInput: function () {
		var opt = {
			id  : this.getFileInputId(),
			name: this.name || this.getId(),
			cls : 'x-form-file',
			tag : 'input',
			type: 'file',
			size: 1
		};

		opt.multiple = 'multiple';
		this.fileInput = this.wrap.createChild(opt);
	},

	// override
	bindListeners  : function () {
		this.fileInput.on({
			scope     : this,
			mouseenter: function () {
				this.button.addClass(['x-btn-over', 'x-btn-focus'])
			},
			mouseleave: function () {
				this.button.removeClass(['x-btn-over', 'x-btn-focus', 'x-btn-click'])
			},
			mousedown : function () {
				this.button.addClass('x-btn-click')
			},
			mouseup   : function () {
				this.button.removeClass(['x-btn-over', 'x-btn-focus', 'x-btn-click'])
			},
			change    : function () {
				var v = this.fileInput.dom.value;
				if (this.fileInput.dom.files.length > 1) {
					v = this.fileInput.dom.files.length + ' ' + dgettext('plugin_files', 'files selected');
				}
				this.setValue(v);
				this.fireEvent('fileselected', this, v);
			}
		});
	}
});

Ext.reg('filesplugin.multiplefileuploadfield', Zarafa.plugins.files.ui.MultipleFileUploadField);
