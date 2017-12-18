module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      '../../deploy/client/extjs/ext-base-debug.js',
      '../../deploy/client/extjs/ext-all-debug.js',
      '../../deploy/client/extjs/ux/ux-all-debug.js',
      /* Translations polyfill */
      'polyfill/translations.js',
      '../../deploy/client/extjs-mod/extjs-mod-debug.js',
      '../../deploy/client/third-party/ux-thirdparty-debug.js',
      '../../deploy/client/kopano-debug.js',
      /* Custom ExtJS matchers */
      'util/matchers.js',
      'unittest/*.js',
    ],

    preprocessors: {
      '../../deploy/client/kopano-debug.js': ['coverage']
    },

    reporters: ['progress'],

    reportSlowerThan: 50,

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    browsers: ['ChromeHeadless'],

    singleRun: true,

    browserNoActivityTimeout: 8500,

    coverageReporter: {
      dir: "coverage",
      reporters: [
	{ type: 'html', subdir: 'report-html' },
	{ type: 'cobertura', subdir: '.', file: 'cobertura.xml' },
      ]
    },

    junitReporter: {
      outputFile: 'unit.xml',
      outputDir: 'result',
      suite: 'unit',
    },
  });
};
