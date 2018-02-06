#!/usr/bin/env groovy

pipeline {
	agent none
    	environment {
        	CHROME_BIN = 'chromium-browser'
    	}
	stages {
		stage('Test') {
			parallel {
				stage('JS Lint') {
					agent {
						dockerfile {
							label 'docker'
						}
					}
					steps {
						sh 'make lintci'
						checkstyle canRunOnFailed: true, canComputeNew: false, pattern: 'jshint.xml'
					}
				}
				stage('Unittest') {
					agent {
						dockerfile {
							label 'docker'
						}
					}
					steps {
						sh 'make jstestci'
						junit 'test/js/result/**/unit.xml'
					}
				}
			}
		}	
		stage('JS Coverage') {
			agent {
				dockerfile {
					label 'docker'
				}
			}
			when {
				branch 'master'
			}
			steps {
				sh 'make jstestcov'
				cobertura coberturaReportFile: 'test/js/coverage/cobertura.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 10, methodCoverageTargets: '80, 0, 0'
				publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'test/js/coverage/report-html', reportFiles: 'index.html', reportName: 'HTML Report', reportTitles: ''])
			}
		}

	}
}
