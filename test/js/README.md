# Kopano WebApp JavaScript tests

This document describes how to setup the JavaScript test system, run tests and
writing new tests. The tests use Jasmine as testframework and Karma as test
runner, for CI chromium headless is used to run the tests.

## File structure

* unittests/ - contains the unittests
* util/ - ExtJS specific Jasmine matchers
* polyfill/ - translations polyfill

## Running tests

Running the tests is described in the README.md in the root folder of the
repository. From the current working directory (test/js) it's possible to run
the tests as following:

```
karma start unittest.conf.js
```

It's not possible to override the files to test, if you want to test a specific
file, the files section in unittest.conf.js has to be overridden. Replace
'unittest/*.js' with for example 'unittest/Array.js'

Another option is using the following method to only run tests matching a
keyword in describe() or it().

First start a karma test server using the spec reporter, which shows the executed tests.
```
npm run jsunit -- --no-single-run --reporters spec
```

Then tell karma which tests to run:

```
karma run -- --grep='Custom Message Box'
```

## Writing tests

Unit tests for WebApp should be standalone and have should not depend on
globals. They should be able to run independent. The benefit is that the tests
are easy to reason with and read. A test file should only test one component,
class or record.

Creating a new test:

1. Create a new file in the unittest directory named "Array.js"
2. Create a describe() function with the same new as the thing to test "Array"
3. Create an it() function per separate test case. For example 'Array.find'

## Coverage

Coverage can be viewed by running the following command:

```
npm run jsunit -- --reporters coverage
${BROWSER} test/js/coverage/report-html/index.html
```
