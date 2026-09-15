Ext.namespace('Grommunio.task.ui');

/**
 * @class Grommunio.task.ui.TaskInfo
 * @extends Ext.Container
 * @xtype grommunio.taskinfo
 *
 * If the {@link Grommunio.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Grommunio.core.data.MAPIRecord record} into the component.
 * Otherwise the user of this component needs to call {@link #setRecord}.
 */
Grommunio.task.ui.TaskInfo = Ext.extend(Ext.DataView, {

	/**
	 * @cfg {String} taskInfoCls is the CSS class which should be applied to {@link #taskInfoTpl task info} Template
	 */
	taskInfoCls: 'preview-header-task',

	/**
	 * @cfg {HTMLElement/Ext.Element} HTML structure for the whole task information
	 * and get references to the different elements in it.
	 * @property
	 */
	taskInfoElem: undefined,

	/**
	 * @cfg {Ext.Template/String} taskGeneralTabTpl The template which must be applied
	 * on {@link Grommunio.task.dialogs.TaskGeneralTab TaskGeneralTab} when task is assigned task.
	 * The arguments of this template will be the {@link Grommunio.core.data.IPMRecord#data record.data} field.
	 */
	taskGeneralTabTpl:
		'<div class="preview-from">' +
			'<div class="task-info-container">' +
				'<span class="label">'+_('Subject')+': </span>' +
				'<span>' +
					'<tpl if="!Ext.isEmpty(values.conversation_topic)">' +
						'{conversation_topic:htmlEncode}' +
					'</tpl>' +
					'<tpl if="Ext.isEmpty(values.conversation_topic)">' +
						'{subject:htmlEncode}' +
					'</tpl>' +
				'</span>'+
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label">'+ _('Start date') +': </span>' +
				'<tpl if="Ext.isDate(values.startdate)">' +
					'<span class="minwidth120">' +
						'{startdate:date(_("d-m-Y"))}' +
					'</span>'+
				'</tpl>' +
				'<tpl if=" !Ext.isDate(values.startdate)">' +
					'<span class="minwidth120">' +
						_('None') +
					'</span>'+
				'</tpl>' +
				'<span class="label">'+ _('Due date') +': </span>' +
				'<tpl if="Ext.isDate(values.duedate)">' +
					'<span class="minwidth120">' +
					'{duedate:date(_("d-m-Y"))}' +
					'</span>'+
				'</tpl>' +
				'<tpl if="!Ext.isDate(values.duedate)">' +
					'<span>' +
						_('None') +
					'</span>'+
				'</tpl>' +
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label">'+ _('Status') +': </span>' +
				'<span class="minwidth120">' +
					'{status:this.getStatus}' +
				'</span>'+
				'<span class="label">'+ _('Priority') +': </span>' +
				'<span class="minwidth120">' +
					'{importance:this.getPriority}' +
				'</span>'+
				'<span class="label">'+ _('% Complete') +': </span>' +
				'<span>' +
					'{percent_complete:this.getPercentComplete}' +
				'</span>'+
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label">'+ _('Owner') +': </span>' +
				'<span>' +
					'{owner:htmlEncode}' +
				'</span>'+
			'</div>'+
		'</div>',

	/**
	 * @cfg {Ext.Template/String} taskDetailsTabTpl The template which must be applied
	 * on {@link Grommunio.task.dialogs.TaskDetailTab TaskDetailTab} when task is assigned task.
	 * The arguments of this template will be the {@link Grommunio.core.data.IPMRecord#data record.data} field.
	 */
	taskDetailsTabTpl:
		'<div class="preview-from">' +
			'<div class="task-info-container">' +
				'<span class="label minwidth120">'+ _('Date completed') +': </span>' +
				'<span>' + '{date_completed:this.getFormattedDate}' + '</span>'+
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label minwidth120">'+ _('Total work') +': </span>' +
				'<span>' + '{totalwork:htmlEncode} '+_('hours')+ '</span>'+
				'<span class="label">'+ _('Mileage') +': </span>' +
				'<span>' + '{mileage:htmlEncode}' + '</span>'+
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label minwidth120">'+ _('Actual work') +': </span>' +
				'<span>' + '{actualwork:htmlEncode} '+_('hours') + '</span>'+
				'<span class="label">'+ _('Billing information') +': </span>' +
				'<span>' + '{billing_information:htmlEncode}' + '</span>'+
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label minwidth120">'+ _('Company') +': </span>' +
				'<span>' + '{companies:htmlEncode}' + '</span>'+
			'</div>'+
			'<div class="task-info-container">' +
				'<span class="label minwidth120">'+ _('Update list') +': </span>' +
				'<span>' + '{tasklastuser:htmlEncode}' + '</span>'+
			'</div>'+
		'</div>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config) {
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config,{
			xtype: 'grommunio.taskinfo',
			border: false,
			autoScroll:true,
			anchor: '100%'
		});

		Grommunio.task.ui.TaskInfo.superclass.constructor.call(this, config);

		if (Ext.isString(this.taskGeneralTabTpl) && Ext.isString(this.taskDetailsTabTpl)) {
			this.taskGeneralTabTpl = new Ext.XTemplate(this.taskGeneralTabTpl, {
				compiled: true,
				getStatus: function (value)
				{
					return Grommunio.core.mapi.TaskStatus.getDisplayName(value);
				},
				getPriority: function (value)
				{
					return Grommunio.core.mapi.Importance.getDisplayName(value);
				},
				getPercentComplete: function (value)
				{
					return value * 100 + '%';
				}
			});
			this.taskDetailsTabTpl = new Ext.XTemplate(this.taskDetailsTabTpl, {
				compiled: true,
				getFormattedDate: function (value) {
					if (Ext.isDate(value)) {
						return value.format(_("D d-m-Y"));
					} else {
						return _('None');
					}
				}
			});
		}
	},

	/**
	 * Render the template and set the references to HTML Elements.
	 * @protected
	 */
	onRender: function()
	{
		Grommunio.task.ui.TaskInfo.superclass.onRender.apply(this, arguments);
		this.taskInfoElem = Ext.DomHelper.append(this.el.dom,{tag:'div', cls:this.taskInfoCls});
	},

	/**
	 * Update the {@link Grommunio.common.ui.messagepanel.SentInfo header} with the data
	 * from the {@link Grommunio.core.data.IPMRecord record}. Updates the panel
	 * by loading data from the record data into the template.
	 * Attach mouse handlers on the anchors
	 * @param {Grommunio.core.data.IPMRecord} record to update the header panel with
	 */
	update: function(record)
	{
		if (this.taskInfoElem){
			var taskInfoElem = Ext.get(this.taskInfoElem);

			if (!Ext.isDefined(record)) {
				this.taskInfoElem.innerHTML = '';
			} else {
				var ownerComponent = this.ownerCt;
				if (ownerComponent.isXType("grommunio.taskgeneraltab") || ownerComponent.isXType("grommunio.messageheader")) {
					this.taskGeneralTabTpl.overwrite(taskInfoElem, record.data);
				} else if(ownerComponent.isXType("grommunio.taskdetailtab")) {
					this.taskDetailsTabTpl.overwrite(taskInfoElem, record.data);
				}
			}
		}
		this.record = record;
	}
});
Ext.reg('grommunio.taskinfo', Grommunio.task.ui.TaskInfo);
