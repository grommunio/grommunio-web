#!/usr/bin/python

import fileinput
import xml.etree.ElementTree as ET

def main(data):
    root = ET.fromstring(data)
    junit = ET.Element('testsuites')

    for entry in root.findall('file'):
        testcases = []
        for violation in entry.findall('violation'):
            testcase = ET.Element('testcase', {'time': '0', 'name': violation.attrib['rule']})
            failure = ET.Element('failure', {'message': violation.attrib['rule']})
            failure.text = '{} in {} on line {}'.format(violation.text, entry.attrib['name'],
                                                        violation.attrib['beginline'])
            testcase.append(failure)
            testcases.append(testcase)
        tests = str(len(testcases))
        testsuite = ET.Element('testsuite', {'package': 'org.phpmd', 'time':
                                             '0', 'tests': tests, 'errors': tests, 'name':
                                             entry.attrib['name']})
        for testcase in testcases:
            testsuite.append(testcase)
        junit.append(testsuite)
    tree = ET.ElementTree(junit)
    ET.dump(tree)

if __name__ == "__main__":
    data = ''.join(fileinput.input())
    main(data)
