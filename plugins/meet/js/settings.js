Ext.namespace('Zarafa.plugins.meet');
Zarafa.plugins.meet.SettingsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

  constructor: function(config){
    config = config || {};
    Ext.applyIf(config, {
      title: _('Meet'),
      categoryIndex: 9947,
      xtype: 'grommunio.meet.settingscategory',
      iconCls: 'icon_meet',
      items: [{
        xtype: 'grommunio.meet.settingswidget',
        settingsContext: config.settingsContext
      }]
    });
    Zarafa.plugins.meet.SettingsCategory.superclass.constructor.call(this, config);
  }

});
Ext.reg('grommunio.meet.settingscategory', Zarafa.plugins.meet.SettingsCategory);

Zarafa.plugins.meet.SettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

  constructor: function(config){
    config = config || {};
    Ext.applyIf(config, {
      xtype: 'grommunio.meet.settingswidget',
      title: _('Meet'),
      layout: 'form',
      items: [
        {
          xtype: 'displayfield',
          hideLabel: true,
          value: _('Open meeting in:')
        },{
          xtype: 'radiogroup',
          ref: 'openInRadio',
          fieldLabel: _('Open meeting in'),
          hideLabel: true,
          columns: 1,
          items: [
            {
              xtype: 'radio',
              name: 'openin',
              inputValue: 'web',
              boxLabel: _('Web tab')
            },{
              xtype: 'radio',
              name: 'openin',
              inputValue: 'popup',
              boxLabel: _('Popup')
            },{
              xtype: 'radio',
              name: 'openin',
              inputValue: 'browser',
              boxLabel: _('Browser window')
            }
          ]
        },{
          xtype: 'checkbox',
          ref: 'hideTabbarButtonCheckbox',
          boxLabel: _('Hide the button in the main toolbar'),
          checked: false,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'mnameAddSubject',
          boxLabel: _('Add the subject to the room name'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'mnameAddOrganizer',
          boxLabel: _('Add the organizer name to the room name'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'locationAddCheckbox',
          boxLabel: _('Add the URL to the meeting location rather than overwriting it'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'locationFixCheckbox',
          boxLabel: _('Prevent the URL in the meeting location from being overridden automatically (ex: when adding a meetingroom)') + '<span class="k-settings-label-minor">(' + _('If you have problems when creating meetings, try disabling this setting') + ')</span>',
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'addInvitationCheckbox',
          boxLabel: _('Add an invitation to the appointment description'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'displayfield',
          hideLabel: true,
          style: 'margin-top: 10px',
          value: _('Invitation text (plain text)') + ': <span class="k-settings-label-minor">(' + _('used when composing in plain text, must contain %url%, empty to reset to default') + ')</span>',
        },{
          xtype: 'textarea',
          ref: 'invitationEditor',
          fieldLabel: _('Invitation text'),
          hideLabel: true,
          grow: true,
          anchor: '100%',
        },{
          xtype: 'displayfield',
          hideLabel: true,
          style: 'margin-top: 10px',
          value: _('Invitation template (HTML)') + ': <span class="k-settings-label-minor">(' + _('used when composing in HTML, must contain %url%, empty to reset to default') + ')</span>',
        },{
          xtype: 'zarafa.editorfield',
          ref: 'invitationHtmlEditor',
          cls: 'k-meet-html-editor',
          fieldLabel: _('Invitation template'),
          hideLabel: true,
          name: 'invitationhtml',
          htmlName: 'invitationhtml',
          plaintextName: 'invitationhtml',
          anchor: '100%',
          height: 300,
          useHtml: true
        }
      ]
    });
    Zarafa.plugins.meet.SettingsWidget.superclass.constructor.call(this, config);
  },

  update: function(settingsModel){
    this.openInRadio.setValue(settingsModel.get('zarafa/v1/plugins/meet/openin') || 'web');
    this.hideTabbarButtonCheckbox.setValue(settingsModel.get('zarafa/v1/plugins/meet/hidetabbarbutton'));
    this.locationAddCheckbox.setValue(!settingsModel.get('zarafa/v1/plugins/meet/locationoverride'));
    this.locationFixCheckbox.setValue(!settingsModel.get('zarafa/v1/plugins/meet/nolocationfix'));
    this.addInvitationCheckbox.setValue(!settingsModel.get('zarafa/v1/plugins/meet/noinvitation'));
    this.invitationEditor.setValue(settingsModel.get('zarafa/v1/plugins/meet/invitationmessage') || '');
    this.invitationHtmlEditor.setValue(settingsModel.get('zarafa/v1/plugins/meet/invitationhtml') || '');
    this.mnameAddSubject.setValue(!container.getSettingsModel().get('zarafa/v1/plugins/meet/mname_nosubject'));
    this.mnameAddOrganizer.setValue(!container.getSettingsModel().get('zarafa/v1/plugins/meet/mname_noorganizer'));
  },

  updateSettings: function(settingsModel){
    settingsModel.beginEdit();
    if(settingsModel.get('zarafa/v1/plugins/meet/hidetabbarbutton') != this.hideTabbarButtonCheckbox.checked || settingsModel.get('zarafa/v1/plugins/meet/nolocationfix') == this.locationFixCheckbox.checked){
      settingsModel.requiresReload = true;
    }
    settingsModel.set('zarafa/v1/plugins/meet/openin', this.openInRadio.getValue().inputValue);
    settingsModel.set('zarafa/v1/plugins/meet/hidetabbarbutton', this.hideTabbarButtonCheckbox.checked);
    settingsModel.set('zarafa/v1/plugins/meet/locationoverride', !this.locationAddCheckbox.checked);
    settingsModel.set('zarafa/v1/plugins/meet/nolocationfix', !this.locationFixCheckbox.checked);
    settingsModel.set('zarafa/v1/plugins/meet/noinvitation', !this.addInvitationCheckbox.checked);
    settingsModel.set('zarafa/v1/plugins/meet/mname_nosubject', !this.mnameAddSubject.checked);
    settingsModel.set('zarafa/v1/plugins/meet/mname_noorganizer', !this.mnameAddOrganizer.checked);
    if(this.invitationEditor.getValue()){
      if(this.invitationEditor.getValue() != settingsModel.get('zarafa/v1/plugins/meet/invitationmessage')){
        settingsModel.set('zarafa/v1/plugins/meet/invitationmessage', this.invitationEditor.getValue())
      }
    }else{
      settingsModel.remove('zarafa/v1/plugins/meet/invitationmessage');
      settingsModel.requiresReload = true;
    }
    var htmlVal = this.invitationHtmlEditor.getValue();
    if(htmlVal){
      if(htmlVal != settingsModel.get('zarafa/v1/plugins/meet/invitationhtml')){
        settingsModel.set('zarafa/v1/plugins/meet/invitationhtml', htmlVal);
      }
    }else{
      settingsModel.remove('zarafa/v1/plugins/meet/invitationhtml');
      settingsModel.requiresReload = true;
    }
    settingsModel.endEdit();
  },

});
Ext.reg('grommunio.meet.settingswidget', Zarafa.plugins.meet.SettingsWidget);
