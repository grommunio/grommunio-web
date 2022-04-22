Ext.namespace('Zarafa.plugins.meet');

Zarafa.plugins.meet.Plugin = Ext.extend(Zarafa.core.Plugin, {
  
  plugin: undefined,
  
  initPlugin: function(){
    Zarafa.core.data.SharedComponentType.addProperty('plugins.meet.panel');
    Zarafa.core.data.SharedComponentType.addProperty('plugins.meet.addmeetingdialog');
    this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
    if(!container.getSettingsModel().get('zarafa/v1/plugins/meet/hidetabbarbutton')){
      this.registerInsertionPoint('main.toolbar.actions.last', this.createToolbarButton, this);
    }
    this.registerInsertionPoint('context.calendar.appointmentcontentpanel.toolbar.actions', this.createAddMeetingButton, this);
    this.registerInsertionPoint('context.calendar.appointmentcontentpanel.toolbar.actions', this.createJoinMeetingButton, this);
    this.registerInsertionPoint('context.mail.mailcreatecontentpanel.toolbar.actions', this.createAddMeetingButton, this);
    if(!container.getSettingsModel().get('zarafa/v1/plugins/meet/nolocationfix')){
      var Zarafa_calendar_dialogs_AppointmentTab_doSetLocation_or = Zarafa.calendar.dialogs.AppointmentTab.prototype.doSetLocation;
      Zarafa.calendar.dialogs.AppointmentTab.prototype.doSetLocation = function(){
        if('meetCurrentUrl' in this.record && arguments[0].indexOf(this.record.meetCurrentUrl) < 0){
          if(!container.getSettingsModel().get('zarafa/v1/plugins/meet/locationoverride')){
            arguments[0] += (arguments[0] ? ' / ' : '') + this.record.meetCurrentUrl;
          }else{
            arguments[0] = this.record.meetCurrentUrl;
          }
        }
        Zarafa_calendar_dialogs_AppointmentTab_doSetLocation_or.apply(this, arguments);
      };
      var Zarafa_calendar_dialogs_AppointmentTab_onFieldChange_or = Zarafa.calendar.dialogs.AppointmentTab.prototype.onFieldChange;
      Zarafa.calendar.dialogs.AppointmentTab.prototype.onFieldChange = function(){
        if(arguments[0].getName() == 'location' && 'meetCurrentUrl' in this.record && arguments[1].indexOf(this.record.meetCurrentUrl) < 0){
          //If the user manually removes the url from the location, prevent adding it again if the location gets set
          delete this.record.meetCurrentUrl;
        }
        Zarafa_calendar_dialogs_AppointmentTab_onFieldChange_or.apply(this, arguments);
      };
    }
  }, 
  
  createSettingsCategory: function(){
    return {
      xtype: 'grommunio.meet.settingscategory',
      plugin: this
    };
  },
  
  createToolbarButton: function(){
		return [{
			newMenuIndex: 10,
			xtype: 'button',
			scale: 'large',
			tooltip: 'Meet',
			iconCls: 'icon_meet_32',
			handler: this.onToolbarButtonClick,
			scope: this,
			}];
	},
  
  createAddMeetingButton: function(){
    return {
      xtype: 'button',
      text: _('Add meeting'),
      iconCls: 'icon_meet',
      handler: this.onAddMeetingButtonClick,
      scope: this,
      plugins: ['zarafa.recordcomponentupdaterplugin'],
      tooltip: _('Shift-click for advanced settings'),
      update: function(record, contentReset){
        this.record = record;
        if ((new RegExp(container.getSettingsModel().get('zarafa/v1/plugins/meet/server').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[-a-zA-Z0-9()@:%_\+.~#?&\/=]+')).test(record.get('location'))) {
          this.setDisabled(true);
        } else {
          this.setDisabled(false);
        }
      }
    };
  },
  
  createJoinMeetingButton: function(){
    return {
      xtype: 'button',
      text: _('Join webmeeting'),
      iconCls: 'icon_meet',
      handler: this.onJoinMeetingButtonClick,
      scope: this,
      plugins: ['zarafa.recordcomponentupdaterplugin'],
      update: function(record, contentReset){
        this.record = record;
        if (/https?:\/\/[a-zA-Z0-9-\.]+(?:\/[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?/.test(record.get('location'))) {
          this.setDisabled(false);
        } else {
          this.setDisabled(true);
        }
      }
    };
  },
  
  onAddMeetingButtonClick: function(button,  evt){
    if(evt.shiftKey){
      Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['plugins.meet.addmeetingdialog'], null, {modal : true, source: button});
      return
    }
    var hash = 0, i, chr;
    var agent = container.getUser().getUserName() + navigator.userAgent + (new Date()).valueOf();
    for (i = 0; i < agent.length; i++) {
      chr = agent.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    if(hash < 0) hash += 2147483647;
    var mname = '';
    if(!container.getSettingsModel().get('zarafa/v1/plugins/meet/mname_nosubject')){
      mname += (button.record.get('subject') || 'meet').replace(/[^a-zA-Z0-9\-]/g, '_').replace(/_{2,}/g,  '_').replace(/^_+|_+$/g, '') + '-';
    }
    if(!container.getSettingsModel().get('zarafa/v1/plugins/meet/mname_noorganizer')){
      mname += container.getUser().getUserName().replace(".", "") + '-';
    }
    button.record.meetCurrentUrl = container.getSettingsModel().get('zarafa/v1/plugins/meet/server') + mname + hash.toString(16);
    var edf = null;
    switch(button.record.get('message_class')){
      case 'IPM.Note':
        edf = button.ownerCt.ownerCt.editorField;
        break;
      case 'IPM.Appointment':
        var oloc = button.record.get('location');
        if(oloc && !container.getSettingsModel().get('zarafa/v1/plugins/meet/locationoverride')){
          button.record.set('location', oloc + ' / ' + button.record.meetCurrentUrl);
        }else{
          button.record.set('location', button.record.meetCurrentUrl);
        }
        if(container.getSettingsModel().get('zarafa/v1/plugins/meet/noinvitation')){
          return;
        }
        edf = button.ownerCt.ownerCt.appointmentTab.editorField;
        break
    }
    if(edf){
      var iurl = button.record.meetCurrentUrl;
      var itpl = container.getSettingsModel().get('zarafa/v1/plugins/meet/invitationmessage') || '\n%url%\n';
      if(edf.isHtmlEditor()){
        iurl = '<a href=' + iurl + '>' + iurl + '</a>';
        itpl = itpl.replace(/(\r\n|\n|\r)/gm, '<br/>');
      }
      edf.insertAtCursor(itpl.replace(/%url%/g, iurl));
    }
  },
  
  onJoinMeetingButtonClick: function(button){
    var murl = /https?:\/\/[a-zA-Z0-9-\.]+(?:\/[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?/.exec(button.record.get('location'))
    if(murl){
      this.openMeeting(murl[0], button.record.get('subject'));
    }
  },
  
  onToolbarButtonClick: function(){
    this.openMeeting(container.getSettingsModel().get('zarafa/v1/plugins/meet/server'), 'Meet');
  }, 
  
  openMeeting: function(meetingurl, meetingname){
    switch(container.getSettingsModel().get('zarafa/v1/plugins/meet/openin')){
      case 'browser':
        window.open(meetingurl);
        break;
      case 'popup':
          window.open(meetingurl, '_blank', 'location=no,height=768,width=1024,scrollbars=yes,status=yes');
        break;
      default:
        Zarafa.core.data.UIFactory.openLayerComponent(
          Zarafa.core.data.SharedComponentType['plugins.meet.panel'],
          null,
          {
            url: meetingurl,
            title: 'Meet',
            iconCls : 'icon_meet',
            tabOrder: (new Date()).valueOf()
          }
        );
        break;
    }
  }, 
  
  bidSharedComponent: function(type, record){
      var bid = -1;
      switch(type){
        case Zarafa.core.data.SharedComponentType['plugins.meet.panel']:
          bid = 1;
          break;
        case Zarafa.core.data.SharedComponentType['plugins.meet.addmeetingdialog']:
          bid = 1;
          break;
      }
      return bid;
  },
  
  getSharedComponent: function(type, record){
    var component;
    switch(type){
      case Zarafa.core.data.SharedComponentType['plugins.meet.panel']:
        return Zarafa.plugins.meet.ui.ContentPanel;
      case Zarafa.core.data.SharedComponentType['plugins.meet.addmeetingdialog']:
        return Zarafa.plugins.meet.ui.AddMeetingDialog;
    }
  },
  
});

Zarafa.onReady(function(){
  container.registerPlugin(new Zarafa.core.PluginMetaData({
    name: 'meet',
    displayName: 'Meet',
    //about: Zarafa.plugins.meet.ABOUT,
    pluginConstructor: Zarafa.plugins.meet.Plugin
  }));
});
