# grammm web FileViewer Plugin

This plugin will provide a preview panel for PDF and ODF files based on [ViewerJS].
ViewerJS has been updated to support image, music and video files. Those files can only be previewed in the
Kopano Files plugin for the moment.

### Installation

To install the fileviewer plugin, download the package to your WebApp system and install it using the package manager.

Optionally you can restart your webserver and continue to configure the fileviewer plugin.

### Configuration
The plugin configuration can be found in the **'config.php'** file.
> define('PLUGIN_FILEVIEWER_USER_DEFAULT_ENABLE', true);

This configuration flag will enable the plugin by default for all users. If this is set to false, each user has to enable 
the plugin by itself in the Webapp settings. (Settings -> Plugins -> Check the fileviewer plugin)

### License

AGPL


[ViewerJS]:http://viewerjs.org/
