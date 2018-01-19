#!/usr/bin/env groovy

pipeline {
	agent {
		dockerfile {
			label 'docker'
		}
	}
    	environment {
        	CHROME_BIN = 'chromium-browser'
    	}
	stages {
		stage('Install') {
			steps {
				sh 'npm install'
			}
		}
		stage('Deploy') {
			steps {
				sh 'ant deploy deploy-plugins'
			}
		}

		stage('Test') {
			parallel {
				stage('JS Lint') {
					steps {
						sh 'npm run jlint'
					}
				}
				stage('Unittest') {
					steps {
						sh 'npm run jsunit -- --reporters junit'
					}
				}
			}
		}	
		stage('JS Coverage') {
			when {
				branch 'master'
			}
			steps {
				sh 'npm run jsunit -- --reporters coverage'
				cobertura coberturaReportFile: 'test/js/coverage/cobertura.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 10, methodCoverageTargets: '80, 0, 0'
				publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'test/js/coverage/report-html', reportFiles: 'index.html', reportName: 'HTML Report', reportTitles: ''])
			}
		}

	}
	post {
		always {
			checkstyle canRunOnFailed: true, canComputeNew: false, pattern: 'jshint.xml'
			junit 'test/js/result/**/unit.xml'
		}
	}
}
