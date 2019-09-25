zarafa-webapp-passwd
====================

The Passwd plugin allows the user to change his password inside of WebApp.

This plugin is largely based on the Passwd plugin by Andreas Brodowski.
For his original work check this [link](https://community.zarafa.com/pg/plugins/project/157/developer/dw2412/passwd-plugin)

## How to install
1. If you want to use this plugin with production / debug version of webapp then please download package from [release page](https://github.com/silentsakky/zarafa-webapp-passwd/releases)
2. If you want to use this plugin with source copy of webapp then you can just download this whole project
3. Extract contents of this plugin to <webapp_path>/plugins directory, in Ubuntu 16 <webapp_path> refers to /usr/share/kopano-webapp
4. Give read permissions to apache for <webapp_path>/plugins/passwd directory
5. If you are using LDAP plugin then change PLUGIN_PASSWD_LDAP to true and also set proper values for PLUGIN_PASSWD_LDAP_BASEDN and PLUGIN_PASSWD_LDAP_URI configurations
6. If you are using DB plugin then no need to change anything, default configurations should be fine
5. Restart apache, reload webapp after clearing cache
6. If you want to enable this plugin by default for all users then edit config.php file and change PLUGIN_PASSWD_USER_DEFAULT_ENABLE setting to true


## How to enable
1. Go to settings section
2. Go to Plugins tab
3. Enable password change plugin and reload webapp


## How to disable
1. Go to settings section
2. Go to Plugins tab
3. Disable password change plugin and reload webapp


## How to use
1. Go to Change Password tab of settings section
2. Provide current password and new password
3. Click on apply


## Notes
- Feedback/Bug Reports are welcome
- thanks to h44z for adding password meter and icon for the plugin


## Dependencies:
- php ldap extension is required if you are using LDAP plugin
- if you have ubuntu 16 then follow below steps (this should ideally work with all distros)
     1) sudo apt-get install php-ldap
     2) sudo phpenmod ldap
     3) check if ldap extension is enabled using below command
        php -i "(command-line 'phpinfo()')" | grep ldap


Initially releases of this plugin were maintained in [community](https://community.zarafa.com/pg/plugins/project/23147/developer/silentsakky/webapp-password-change), but now users can download latest builds from [github release page](https://github.com/silentsakky/zarafa-webapp-passwd/releases)