describe('VersionWidget', function() {
	const version = {
		'zcp': '8.0',
		'webapp': '3.0.0'
	};
	var versionWidget;

	beforeAll(function() {
		container = new Zarafa.core.Container();
		container.setVersion(version);
		versionWidget = new Zarafa.settings.ui.SettingsVersionWidget({renderTo: Ext.getBody()});
	});

	afterAll(function() {
		versionWidget.destroy();
	});

	it('verify Kopano Groupware Core / WebApp is displayed', function() {
		const webappVersion = versionWidget.items.itemAt(0);
		expect(webappVersion.getValue()).toEqual(version['webapp']);
		const zcpVersion = versionWidget.items.itemAt(1);
		expect(zcpVersion.getValue()).toEqual(version['zcp']);
	});
});
