#!/usr/bin/env groovy

pipeline {
	agent none
    	environment {
        	CHROME_BIN = 'chromium-browser'
    	}
	options { buildDiscarder(logRotator(numToKeepStr: '50')) }

	stages {
		stage('Check which files changed') {
			agent {
				label "master"
			}
			steps {
				script {
					gitChanges = sh(returnStdout: true, script: 'git diff origin/master --name-only')
				}
			}

		}
		stage('Test') {
			parallel {
				stage('JS Lint') {
					when {
					   expression {
						   return env.BRANCH_NAME == 'master' || gitChanges.contains('.js')
					   }
					}
					agent {
						dockerfile {
							label 'docker'
						}
					}
					steps {
						sh 'make lintci'
						junit allowEmptyResults: true, testResults: 'eslint.xml'
					}
					post {
						always {
							cleanWs()
						}
					}
				}
				stage('Unittest') {
					when {
					   expression {
						   return env.BRANCH_NAME == 'master' || gitChanges.contains('.js')
					   }
					}
					agent {
						dockerfile {
							label 'docker'
						}
					}
					steps {
						sh 'make jstestci'
						junit 'test/js/result/**/unit.xml'
					}
					post {
						always {
							cleanWs()
						}
					}
				}
				stage('PHP Lint') {
					when {
					   expression {
						   return env.BRANCH_NAME == 'master' || gitChanges.contains('.php')
					   }
					}
					agent {
						dockerfile {
							label 'docker'
						}
					}
					steps {
						sh 'make phplintci'
						junit allowEmptyResults: true, testResults: 'phpmd.xml'
					}
					post {
						always {
							cleanWs()
						}
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
				cobertura coberturaReportFile: 'test/js/coverage/cobertura.xml', conditionalCoverageTargets: '80, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '90, 0, 0', maxNumberOfBuilds: 10, methodCoverageTargets: '90, 0, 0'
				publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'test/js/coverage/report-html', reportFiles: 'index.html', reportName: 'HTML Report', reportTitles: ''])
			}
			post {
				always {
					cleanWs()
				}
			}
		}

	}
}
