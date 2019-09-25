# WebApp PHP Tests

The PHP tests are behaviour written tests, which execute actions usually send by the JavaScript
client. The tests can be found in the tests folder, test classes used as test helpers for testing
are found in classes, as is the default test class.

# Configuration

The following steps are required to run the tests:

1. Copy config.db.php.dist to config.php
2. Configure the DEFAULT_SERVER in config.php
3. Run create_db_user.php, this creates the users. (Note: it does not respect the configured
   DEFAULT_SERVER)

# Issues

* Settings are cleaned on every tests, causing a performance penalty. (TestUser->deleteSetting)
* cleanSearchFolders is called often and causes a lot of mapi_folder_deletefolder, which is slow and
  not needed. This saves 3 seconds for DistlistTest.php for example.
* Search tests fail when kopano-search is running, unknown why.
* Fix commented out tests in tests/restore (search for 'xtest')
* Fix testLoadAppointmentReminders which randomly fails
* Fix PermissionsTest on the store, cleanFolders does not clean up the PR_IPM_SUBTREE_ENTRYID permissions.
