Ext.namespace('Zarafa.plugins.meet');
Zarafa.plugins.meet.SettingsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

  constructor: function(config){
    config = config || {};
    Ext.applyIf(config, {
      title: 'Meet',
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
      title: 'Meet',
      layout: 'form',
      items: [
        {
          xtype: 'displayfield',
          hideLabel: true,
          value: _('Open meeting in:', 'plugin_meet')
        },{
          xtype: 'radiogroup',
          ref: 'openInRadio',
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
              boxLabel: 'Popup'
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
          boxLabel: _('Hide the button in the main toolbar', 'plugin_meet'),
          checked: false,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'mnameAddSubject',
          boxLabel: _('Add the subject to the room name', 'plugin_meet'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'mnameAddOrganizer',
          boxLabel: _('Add the organizer name to the room name', 'plugin_meet'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'locationAddCheckbox',
          boxLabel: _('Add the URL to the meeting location rather than overwriting it', 'plugin_meet'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'locationFixCheckbox',
          boxLabel: _('Prevent the URL in the meeting location from being ﻿overridden automatically (ex: when adding a meetingroom)', 'plugin_meet') + '<span class="k-settings-label-minor">(' + _('If you have problems when creating meetings, try disabling this setting', 'plugin_meet') + ')</span>',
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'checkbox',
          ref: 'addInvitationCheckbox',
          boxLabel: _('Add an invitation to the appointment description', 'plugin_meet'),
          checked: true,
          hideLabel : true,
          style: 'margin-top: 5px',
        },{
          xtype: 'displayfield',
          hideLabel: true,
          style: 'margin-top: 5px',
          value: _('Invitation text', 'plugin_meet') + ': <span class="k-settings-label-minor">(' + _('must contain %url% as a placeholder for the meeting link, empty the textbox to reset to default', 'plugin_meet') + ')</span>',
        },{
          xtype: 'textarea',
          ref: 'invitationEditor',
          hideLabel: true,
          grow: true,
          anchor: '100%',
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
    settingsModel.endEdit();
  },

});
Ext.reg('grommunio.meet.settingswidget', Zarafa.plugins.meet.SettingsWidget);
