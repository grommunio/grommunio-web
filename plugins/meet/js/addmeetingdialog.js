Ext.namespace('Zarafa.plugins.meet.ui');
Zarafa.plugins.meet.ui.AddMeetingDialog = Ext.extend(Zarafa.core.ui.ContentPanel, {

  constructor: function(config){
    config = config || {};
    var subj = 'xsedf';
    if(config.source && config.source.record){
      subj = config.source.record.get('subject')
    }
    config = Ext.applyIf(config, {
      xtype: 'meet_addmeetingdialog',
      layout: 'form',
      title: _('Add meeting'),
      width: 320,
      height: 135,
      style: {
        maxHeight: '135px'
      }, 
      items: [
        {
          xtype: 'displayfield',
          hideLabel: true,
          value: _('Room name:'),
          style: {
            marginTop: '5px',
            marginLeft: '5px'
          },
        },{
          xtype: 'textfield',
          hideLabel: true,
          value: subj,
          ref: 'roomNameBox',
          style: {
            marginTop: '0px',
            marginLeft: '5px',
            paddingRight: '0px',
            width: '95%'
          },
          listeners: {
            blur: this.onRoomNameBlur.bind(this)
          }
        },{
          xtype: 'displayfield',
          hideLabel: true,
          value: _('Room URL:'),
          style: {
            marginTop: '5px',
            marginLeft: '5px'
          },
        },{
          xtype: 'textfield',
          hideLabel: true,
          ref: 'roomUrlBox',
          style: {
            marginTop: '0px',
            marginLeft: '5px',
            paddingRight: '0px',
            width: '95%'
          }
        },{
          xtype: 'button',
          text: _('Add meeting'),
          scope: this,
          handler: this.addMeeting,
          style: {
            marginTop: '0px',
            marginLeft: '5px',
            paddingRight: '0px',
            width: '95%'
          }
        }
      ]
    });

    Zarafa.plugins.meet.ui.AddMeetingDialog.superclass.constructor.call(this, config);
  },

  onRoomNameBlur: function(){
    this.roomUrlBox.setValue(container.getSettingsModel().get('zarafa/v1/plugins/meet/server') + this.roomNameBox.getValue().replace(/[^a-zA-Z0-9\-]/g, '_').replace(/_{2,}/g,  '_').replace(/^_+|_+$/g, ''))
  },
  
  addMeeting: function(){
    if(this.source && this.source.record){
      this.source.record.jitsiCurrentUrl = this.roomUrlBox.getValue();
      var edf = null;
      switch(this.source.record.get('message_class')){
        case 'IPM.Note': //Mail
          edf = this.source.ownerCt.ownerCt.editorField;
          break;
        case 'IPM.Appointment':
          var oloc = this.source.record.get('location');
          if(oloc && !container.getSettingsModel().get('zarafa/v1/plugins/meet/locationoverride')){
            this.source.record.set('location', oloc + ' / ' + this.source.record.jitsiCurrentUrl);
          }else{
            this.source.record.set('location', this.source.record.jitsiCurrentUrl);
          }
          if(!container.getSettingsModel().get('zarafa/v1/plugins/meet/noinvitation')){
            edf = this.source.ownerCt.ownerCt.appointmentTab.editorField;
          }
      }
      if(edf){
        var iurl = this.source.record.jitsiCurrentUrl;
        var itpl = container.getSettingsModel().get('zarafa/v1/plugins/meet/invitationmessage') || '\n%url%\n';
        if(edf.isHtmlEditor()){
          iurl = '<a href=' + iurl + '>' + iurl + '</a>';
          itpl = itpl.replace(/(\r\n|\n|\r)/gm, '<br/>');
        }
        edf.insertAtCursor(itpl.replace(/%url%/g, iurl));
      }
    }
    this.doClose()
  }

});
Ext.reg('meet_addmeetingdialog', Zarafa.plugins.meet.ui.AddMeetingDialog);
