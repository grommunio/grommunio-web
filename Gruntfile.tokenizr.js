/*
 * This Gruntfile serves to build the tokenizr library from source.
*/

/* global module: true */
module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-browserify");

    grunt.initConfig({
        browserify: {
            "tokenizr": {
                files: {
                    "client/third-party/tokenizr/tokenizr.js": [ "node_modules/tokenizr/src/tokenizr.js" ]
                },
                options: {
                    transform: [
                        [ "babelify", {
                            presets: [
                                [ "@babel/preset-env", {
                                    "targets": {
                                        "browsers": "last 2 versions, > 1%, ie 11"
                                    }
                                } ]
                            ]
                        } ]
                    ],
                    plugin: [
                        [ "browserify-derequire" ]
                    ],
                    browserifyOptions: {
                        standalone: "Tokenizr",
                        debug: false
                    }
                }
            }
        }
    });

    grunt.registerTask("default", [ "browserify" ]);
};
