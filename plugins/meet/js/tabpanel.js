Ext.namespace('Zarafa.plugins.meet.ui');

/**
 * @class Zarafa.plugins.meet.ui.ContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 */
Zarafa.plugins.meet.ui.ContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
  /**
   * @constructor
   * @param config Configuration structure
   */
  constructor : function(config)
  {
    config = config || {};

    Ext.applyIf(config, {
      xtype: 'meet_contentpanel',
      layout : 'fit',
      iconCls: config.iconCls,
      border: false,
      items : [{
        xtype: 'meet_panel',
        url: config.url,
        tabOrder: config.tabOrder
      }]
    });

    Zarafa.plugins.meet.ui.ContentPanel.superclass.constructor.call(this, config);
  }
});
Ext.reg('meet_contentpanel', Zarafa.plugins.meet.ui.ContentPanel);

/**
 * @class Zarafa.plugins.meet.ui.Panel
 * @extends Ext.Panel
 */
Zarafa.plugins.meet.ui.Panel = Ext.extend(Ext.Panel, {
  iframeId : undefined,
  isLoadMaskShown : false,
  loadMask : undefined,
  constructor : function(config)
  {
    config = config || {};
    this.iframeId = 'meet-iframe-'+config.tabOrder;
    this.tag = 'iframe';

    Ext.applyIf(config, {
      xtype: 'meet_panel',
      layout : 'fit',
      header: false,
      html : {
        tag: this.tag,
        id: this.iframeId,
        cls: 'meet-iframe',
        src: config.url,
        style: 'display:block',
        allow: 'microphone *; camera *; display-capture *;'
      },
      listeners: {
        afterrender: this.onAfterRender,
        scope: this
      }
    });

    Zarafa.plugins.meet.ui.Panel.superclass.constructor.call(this, config);
  },

  onAfterRender: function()
  {
    this.showLoadMask();

    var iframe = document.getElementById(this.iframeId);
    var event = (this.tag === 'webview') ? 'contentload' : 'load';

    iframe.addEventListener(event, function(){
      this.hideLoadMask();
    }.createDelegate(this));

  },

  /**
   * Handler for the dialog event of WEBVIEW elements. Will handle alert, prompt,
   * and confirm dialogs
   * @param  {Event} e The dialog event
   */
  handleDialogRequests : function(e)
  {
    // Handle alerts
    if ( e.messageType === 'alert' ) {
      window.alert(e.messageText);
    }

    // Handle confirm dialogs
    else if ( e.messageType === 'confirm' ) {
      var confirmation =  window.confirm(e.messageText);

      if ( confirmation ) {
        e.dialog.ok();
      } else {
        e.dialog.cancel();
      }
    }

    // Handle prompts
    else if ( e.messageType === 'prompt' ){
      var wprompt = window.prompt( e.messageText);

      if ( wprompt === null ){
        e.dialog.cancel();
      } else {
        e.dialog.ok(wprompt);
      }
    }

  },

  /**
   * Handler for the permissionrequest event of WEBVIEW elements. Will handle the request
   * by its type.
   * Possible types are media, geolocation, pointerLock, download, loadplugin and fullscreen.
   * For now we deny geolocation, fullscreen and pointerLock requests.
   * @param {Event} e The permissionrequest event
   */
  handlePermissionRequests : function(e)
  {
    e.preventDefault();
    switch (e.permission) {
      // Allow
      case 'download':
      case 'media':
      case 'loadplugin':
        e.request.allow();
      break;
      // Deny
      case 'pointerLock':
      case 'fullscreen':
      case 'geolocation':
        e.request.deny();
      break;
      // also deny all other, not yet known, requests
      default:
        e.request.deny();
      break;

    }
  },

  /**
   * Handler for the newwindow event of WEBVIEW elements. Will handle new windows, by
   * opening them externally in the browser.
   * @param  {Event} e The newwindow event
   */
  handleNewWindowRequests : function(e)
  {
    e.window.discard();
    nw.Shell.openExternal(e.targetUrl);
  },

  /**
   * If {@link #showLoadMask} is enabled, this function will display
   * the {@link #loadMask}.
   * @param {Boolean} errorMask True to show an error mask instead of the loading mask.
   * @protected
   */
  showLoadMask : function(errorMask)
  {
    if (this.isLoadMaskShown === true) {
      return;
    }
    if (!this.loadMask) {
      this.loadMask = new Zarafa.common.ui.LoadMask(this.ownerCt.el);
    }

    if (errorMask) {
      this.loadMask.showError();
    } else {
      this.loadMask.show();
      this.isLoadMaskShown = true;
    }
  },

  /**
   * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
   * called to display the {@link #loadMask} this function will disable the
   * loadMask.
   * @protected
   */
  hideLoadMask : function()
  {
    if (this.isLoadMaskShown === false) {
      return;
    }

    if (this.loadMask) {
      this.loadMask.hide();
      this.isLoadMaskShown = false;
    }
  }

});
Ext.reg('meet_panel', Zarafa.plugins.meet.ui.Panel);
