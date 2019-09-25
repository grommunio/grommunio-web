describe('Version', function() {
	const data = {
		'webapp': '3.1.0-23',
		'zcp': '8.0.0-3',
		'git': 'master'
	};
	var Version;
	
	beforeAll(function() {
		Version = new Zarafa.core.data.Version(data);
	});

	it('can getWebApp', function() {
		expect(Version.getWebApp()).toEqual(data['webapp']);
	});

	it('can getZCP', function() {
		expect(Version.getZCP()).toEqual(data['zcp']);
	});

	it('can getGit', function() {
		expect(Version.getGit()).toEqual(data['git']);
	});

	it('can versionCompare', function() {
		expect(Version.versionCompare('3.0.0', '3.1.0')).toEqual(-1);
		expect(Version.versionCompare('3.1.0', '3.0.0')).toEqual(1);
		expect(Version.versionCompare('3.0.0', '3.0.0')).toEqual(0);

		expect(Version.versionCompare('3.0.0-3243', '3.1.0-3243')).toEqual(-1);
		expect(Version.versionCompare('3.1.0-3243', '3.0.0-3243')).toEqual(1);
		expect(Version.versionCompare('3.0.0-3243', '3.0.0-3243')).toEqual(0);
	});
});
