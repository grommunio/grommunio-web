Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.RecurrenceSubPanel
 * @extends Ext.Panel
 * @xtype zarafa.recurrencesubpanel
 *
 * The Panel used for configuring the {@link Zarafa.common.recurrence.data.RecurrenceSubtype subtypes}.
 * This class should be inherited by the different {@link Zarafa.common.recurrence.data.RecurrenceType types}.
 */
Zarafa.common.recurrence.dialogs.RecurrenceSubPanel = Ext.extend(Ext.Panel, {
	/**
	 * The record on which this panel is operating. This s provided in {@link #update} by
	 * the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin Record ComponentUpdater plugin}.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	record : undefined,

	/**
	 * @cfg {Zarafa.common.recurrence.data.RecurrenceType} recurrenceType The recurrence type on
	 * which is panel is operating.
	 */
	recurrenceType : undefined,

	/**
	 * @cfg {Zarafa.common.recurrence.data.RecurrenceSubtype|Array} recurrenceSubtypes The possible
	 * subtypes which are available for the configured {@link #recurrenceType}.
	 */
	recurrenceSubtypes : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Zarafa.common.recurrence.dialogs.RecurrenceSubPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Compare 2 {@link Zarafa.common.recurrence.data.RecurrenceSubtype} instances to see if they are equal
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} left The first object to compare to
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} right The second object to compare to
	 * @return {Boolean} True when the two {@link Zarafa.common.recurrence.data.RecurrenceSubtype subtype}
	 * objects are equal
	 * @protected
	 */
	isSubtype : function(left, right)
	{
		return (left.type === right.type && left.regen === right.regen);
	},

	/**
	 * Compare if the given {@link Zarafa.core.data.MAPIRecord} has a subtype configured which matches the given
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype subtype}.
	 * @param {Zarafa.core.data.MAPIRecord} record The record to compare to
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} pattern the Subtype pattern to compare with
	 * @return {Boolean} True when the given record has the same subtype configured as the given pattern
	 * @protected
	 */
	isRecordSubtype : function(record, pattern)
	{   
		return (record.get('recurrence_subtype') === pattern.type && record.get('recurrence_regen') === pattern.regen);
	},

	/**
	 * Event handler which is called when the Subtype has been changed. This must be configured by the
	 * subclass as event handler on the {@link Ext.form.Radio#change change} event. This will {@link #updateRecord update}
	 * the {@link #record}.
	 * @param {Ext.form.Radio} field The radio which was changed
	 * @param {Boolean} value True when the radio was enabled
	 * @protected
	 */
	onSubtypeChange : function(field, value)
	{
		if (value) {
			var pattern = field.patternValue;

			// The recurrence properties use 'forceProtocol' on the field definition, this means
			// that they will always be markked as changed when we set them. So to be safe,
			// we manually check if we are about to set a different value or not.
			//
			// We also apply a full update of all properties, because when the subtype changes,
			// the meaning of the recurrence properties like 'everyn', 'nday', 'weekdays', etc. also changes.
			if (!this.isRecordSubtype(this.record, pattern)) {
				this.updateRecord(this.record);
			}
		}
	},

	/**
	 * Event handler which is called when a property for a specific subtype has been changed.
	 * This must be called by the subclass with the subtype object to indicate for which subtype
	 * the given field must be changed.
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} pattern The subtype pattern to which
	 * the given field belongs. The property will only be updated when this subtype is currently enabled.
	 * @param {Ext.form.Field} field The field which was changed by the user
	 * @param {Mixed} value The value which was entered into the field
	 * @protected
	 */
	onSubtypePropertyChange : function(pattern, field, value)
	{
		if (this.isRecordSubtype(this.record, pattern)) {
			this.record.set(field.name, value);
		}
	},

	/**
	 * Enable/disable/hide/unhide all {@link Ext.Component Components} within the {@link Ext.Panel Panel}
	 * using the given {@link Zarafa.core.data.MAPIRecord record}.
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	updateUI : Ext.emptyFn,

	/**
	 * Update the {@link Ext.Component components} which belong to the given
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype subtype}.
	 * @param {Zarafa.core.data.MAPIRecord} record The record from where the values must be read
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} subtype The subtype for which the UI
	 * components must be updated
	 * @param {Boolean} useDefault True if default values should be used rather then the data from
	 * the given record.
	 * @protected
	 */
	updateSubtype : Ext.emptyFn,

	/**
	 * Panel updater. This will initialize all UI components inside the panel with
	 * the data from the {@link Zarafa.core.data.MAPIRecord record}.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record used to update the panel
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		this.updateUI(record, contentReset);

		// The complexity of this panel lies in the fact that we have a recurrence type,
		// and subtype. The properties inside the record have different meanings based on
		// the selected subtype. So when the recurrence type doesn't match this panel's type,
		// we must load default values for everything.
		//
		// However when this panel's type does match the recurrence type, then we must load
		// the correct values for the UI components belonging to the subtype, and default
		// values for all other components.
		//
		// Only do this during intializing as the user will probably be switching around
		// types and subtypes a couple of times.
		if (contentReset) {
			var subTypeRadios = this.findByType('radio');

			if (record.get('recurrence_type') !== this.recurrenceType) {

				// Mark the first radio as the default subtype.
				subTypeRadios[0].setValue(true);

				// Load the default information for all subtypes
				for (var key in this.recurrenceSubtypes) {
					var pattern = this.recurrenceSubtypes[key];

					this.updateSubtype(record, pattern, true);
				}
			} else {
				// Search which radio represents the desired subtype
				Ext.each(subTypeRadios, function(radio) {
					radio.setValue(this.isRecordSubtype(record, radio.patternValue));
				}, this);

				// Load the correct settings for the enabled subtype, and the
				// default values for all others.
				for (var key in this.recurrenceSubtypes) {
					var pattern = this.recurrenceSubtypes[key];

					this.updateSubtype(record, pattern, !this.isRecordSubtype(record, pattern));
				}
			}
		}
	},

	/**
	 * Called by {@link #updateRecordSubType} to indicate that the record must be updated for the
	 * given {@link Zarafa.common.recurrence.data.RecurrenceSubtype recurrence subtype}. The record
	 * itself is already in {@link Zarafa.core.data.MAPIRecord#editing editing} mode.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which must be updated from the UI
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} pattern The Subtype which is
	 * currently enabled. Only the components for this subtype must be used to update the record.
	 * @protected
	 */
	updateRecordSubType : Ext.emptyFn,

	/**
	 * Record updater. This will update the record with all data from the UI components
	 * inside the Panel.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		// We are not the active Panel, we have nothing to configure on the record.
		if (record.get('recurrence_type') !== this.recurrenceType) {
			return;
		}

		// Search which subtype has been enabled, we didn't use
		// a RadioGroup, which would remove the requirements for
		// findByType and the looping.
		Ext.each(this.findByType('radio'), function(radio) {
			if (radio.getValue()) {
				var pattern = radio.patternValue;
				
				record.beginEdit();

				// Update the subtype which was selected
				record.set('recurrence_subtype', pattern.type);
				record.set('recurrence_regen', pattern.regen);

				// Load the corresponding properties
				this.updateRecordSubType(record, pattern);

				record.endEdit();

				return false;
			}
		}, this);

	}
});

Ext.reg('zarafa.recurrencesubpanel', Zarafa.common.recurrence.dialogs.RecurrenceSubPanel);
