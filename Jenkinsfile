#!/usr/bin/env groovy

pipeline {
	agent none
    	environment {
        	CHROME_BIN = 'chromium-browser'
        	NPM_CONFIG_CACHE = '/tmp/npm-cache'
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
		stage('PHP Unit tests') {
			when {
			   expression {
				   return env.BRANCH_NAME == 'master' || gitChanges.contains('.php')
			   }
			}
			agent {
				label "master"
			}
			steps {
				sh 'make -C test/php test EXTRA_LOCAL_ADMIN_USER=$(id -u) DOCKERCOMPOSE_UP_ARGS=--build DOCKERCOMPOSE_EXEC_ARGS="-T -u $(id -u) -e HOME=/workspace" || true'
				sh 'chown -R $(id -u) test/php || true'
				junit testResults: 'test/php/webapp-phptests.xml'
				publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'test/php/htmlcov', reportFiles: 'index.html', reportName: 'PHP HTML Report', reportTitles: ''])
			}
			post {
				always {
					 sh 'make -C test/php test-kopano-ci-clean'
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
				cobertura coberturaReportFile: 'test/js/coverage/cobertura.xml', failUnhealthy: false, failUnstable: false, maxNumberOfBuilds: 10
				publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'test/js/coverage/report-html', reportFiles: 'index.html', reportName: 'JS HTML Report', reportTitles: ''])
			}
			post {
				always {
					cleanWs()
				}
			}
		}
	}
}
