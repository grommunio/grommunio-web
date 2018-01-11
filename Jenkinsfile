#!/usr/bin/env groovy

pipeline {
	agent {
		dockerfile true
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
						sh 'CHROME_BIN=chromium-browser npm run jsunit -- --reporters junit'
					}
				}
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
