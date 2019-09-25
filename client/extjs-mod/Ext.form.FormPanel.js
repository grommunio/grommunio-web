(function() {
	/**
	 * @class Ext.form.FormPanel
	 * @extends Ext.Panel
	 * <p>Standard form container.</p>
	 *
	 * <p><b><u>Layout</u></b></p>
	 * <p>By default, FormPanel is configured with <tt>layout:'form'</tt> to use an {@link Ext.layout.FormLayout}
	 * layout manager, which styles and renders fields and labels correctly. When nesting additional Containers
	 * within a FormPanel, you should ensure that any descendant Containers which host input Fields use the
	 * {@link Ext.layout.FormLayout} layout manager.</p>
	 *
	 * <p><b><u>BasicForm</u></b></p>
	 * <p>Although <b>not listed</b> as configuration options of FormPanel, the FormPanel class accepts all
	 * of the config options required to configure its internal {@link Ext.form.BasicForm} for:
	 * <div class="mdetail-params"><ul>
	 * <li>{@link Ext.form.BasicForm#fileUpload file uploads}</li>
	 * <li>functionality for {@link Ext.form.BasicForm#doAction loading, validating and submitting} the form</li>
	 * </ul></div>
	 *
	 * <p><b>Note</b>: If subclassing FormPanel, any configuration options for the BasicForm must be applied to
	 * the <tt><b>initialConfig</b></tt> property of the FormPanel. Applying {@link Ext.form.BasicForm BasicForm}
	 * configuration settings to <b><tt>this</tt></b> will <b>not</b> affect the BasicForm's configuration.</p>
	 *
	 * <p><b><u>Form Validation</u></b></p>
	 * <p>For information on form validation see the following:</p>
	 * <div class="mdetail-params"><ul>
	 * <li>{@link Ext.form.TextField}</li>
	 * <li>{@link Ext.form.VTypes}</li>
	 * <li>{@link Ext.form.BasicForm#doAction BasicForm.doAction <b>clientValidation</b> notes}</li>
	 * <li><tt>{@link Ext.form.FormPanel#monitorValid monitorValid}</tt></li>
	 * </ul></div>
	 *
	 * <p><b><u>Form Submission</u></b></p>
	 * <p>By default, Ext Forms are submitted through Ajax, using {@link Ext.form.Action}. To enable normal browser
	 * submission of the {@link Ext.form.BasicForm BasicForm} contained in this FormPanel, see the
	 * <tt><b>{@link Ext.form.BasicForm#standardSubmit standardSubmit}</b></tt> option.</p>
	 *
	 * @constructor
	 * @param {Object} config Configuration options
	 * @xtype form
	 */
	Ext.override(Ext.form.FormPanel, {
		/**
		 * @cfg {String} labelAlign The label alignment value used for the <tt>text-align</tt> specification
		 * for the <b>container</b>. Valid values are <tt>"left</tt>", <tt>"top"</tt> or <tt>"right"</tt>
		 * (defaults to <tt>"right"</tt>). This property cascades to child <b>containers</b> and can be
		 * overridden on any child <b>container</b> (e.g., a fieldset can specify a different <tt>labelAlign</tt>
		 * for its fields).
		 */
		labelAlign: 'right'
	});
})();
