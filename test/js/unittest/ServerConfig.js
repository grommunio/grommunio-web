describe('ServerConfig', function() {
  var serverConfig;
  const data = {
    base_url: 'foo',
    webapp_title: 'Kopano WebApp',
    disable_full_gab: true,
    enable_shared_rules: true,
    using_sso: true,
    always_enabled_plugins: true,
    enable_advanced_settings: true,
    max_attachments: 1,
    max_file_uploads: 1,
    max_attachment_size: 1,
    max_attachment_total_size: 1,
    freebusy_load_start_offset: 1,
    freebusy_load_end_offset: 1,
    maximum_eml_files_in_zip: 1,
    client_time: 1,
    active_theme: 'mexico',
    version_info: {'mexico': 1},
    is_vcfimport_supported: true,
    color_schemes: {'blue': '#FFFFF'},
    additional_color_schemes: [],
    default_categories: [],
    additional_default_categories: [],
    contact_prefix: [],
    contact_suffix: [],
    powerpaste: []
  };

	beforeAll(function() {
		serverConfig = new Zarafa.core.data.ServerConfig(data);
	});

  it('getPowerpasteConfig', function() {
    expect(serverConfig.getPowerpasteConfig()).toEqual(data['powerpaste']);
  });

  it('getContactSuffix', function() {
    expect(serverConfig.getContactSuffix()).toEqual(data['contact_suffix']);
  });

  it('getContactPrefix', function() {
    expect(serverConfig.getContactPrefix()).toEqual(data['contact_prefix']);
  });

  it('getAdditionalDefaultCategories', function() {
    expect(serverConfig.getAdditionalDefaultCategories()).toEqual(data['additional_default_categories']);
  });

  it('getDefaultCategories', function() {
    expect(serverConfig.getDefaultCategories()).toEqual(data['default_categories']);
  });

  it('getAdditionalColorSchemes', function() {
    expect(serverConfig.getAdditionalColorSchemes()).toEqual(data['additional_color_schemes']);
  });

  it('getColorSchemes', function() {
    expect(serverConfig.getColorSchemes()).toEqual(data['color_schemes']);
  });

  it('getPluginsVersion', function() {
    expect(serverConfig.getPluginsVersion()).toEqual(data['version_info']);
  });

  it('isImportSupported', function() {
    expect(serverConfig.isImportSupported()).toEqual(data['is_vcfimport_supported']);
  });

  it('getActiveTheme', function() {
    expect(serverConfig.getActiveTheme()).toEqual(data['active_theme']);
  });

  it('getClientTimeout', function() {
    expect(serverConfig.getClientTimeout()).toEqual(data['client_timeout']);
  });

  it('getMaxEmlFilesInZIP', function() {
    expect(serverConfig.getMaxEmlFilesInZIP()).toEqual(data['maximum_eml_files_in_zip']);
  });

  it('getFreebusyLoadEndOffset', function() {
    expect(serverConfig.getFreebusyLoadEndOffset()).toEqual(data['freebusy_load_end_offset']);
  });

  it('getFreebusyLoadStartOffset', function() {
    expect(serverConfig.getFreebusyLoadStartOffset()).toEqual(data['freebusy_load_start_offset']);
  });

  it('getMaxAttachmentTotalSize', function() {
    expect(serverConfig.getMaxAttachmentTotalSize()).toEqual(data['max_attachment_total_size']);
  });

  it('getMaxAttachmentSize', function() {
    expect(serverConfig.getMaxAttachmentSize()).toEqual(data['max_attachment_size']);
  });

  it('getMaxFileUploads', function() {
    expect(serverConfig.getMaxFileUploads()).toEqual(data['max_file_uploads']);
  });

  it('getMaxAttachments', function() {
    expect(serverConfig.getMaxAttachments()).toEqual(data['max_attachments']);
  });

  it('getMaxPostRequestSize', function() {
    expect(serverConfig.getMaxPostRequestSize()).toEqual(data['post_max_size']);
  });

  it('isAdvancedSettingsEnabled', function() {
    expect(serverConfig.isAdvancedSettingsEnabled()).toEqual(data['enable_advanced_settings']);
  });

  it('getAlwaysEnabledPluginsList', function() {
    expect(serverConfig.isAdvancedSettingsEnabled()).toEqual(data['always_enabled_plugins']);
  });

  it('isPluginsEnabled', function() {
    expect(serverConfig.isPluginsEnabled()).toEqual(data['enable_plugins']);
  });

  it('usingSSO', function() {
    expect(serverConfig.usingSSO()).toEqual(data['using_sso']);
  });

  it('isSharedRulesEnabled', function() {
    expect(serverConfig.isSharedRulesEnabled()).toEqual(data['enable_shared_rules']);
  });

  it('isFullGabDisabled', function() {
    expect(serverConfig.isFullGabDisabled()).toEqual(data['disable_full_gab']);
  });

  it('getWebappTitle', function() {
    expect(serverConfig.getWebappTitle()).toEqual(data['webapp_title']);
  });

  it('getBaseUrl', function() {
    expect(serverConfig.getBaseUrl()).toEqual(data['base_url']);
  });
});
