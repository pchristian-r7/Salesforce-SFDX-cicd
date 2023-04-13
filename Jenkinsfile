pipeline {
    agent {
        kubernetes {
      yaml """
kind: Pod
spec:
  containers:
  - name: salesforce
    image: salesforce/salesforcedx:7.195.1-full    
    command:
    - cat
    tty: true
    resources:
      limits:
        cpu: "400m"
        memory: "1Gi"
      requests:
        cpu: "200m"
        memory: "512Mi"
"""
        }
    }
    options {
        ansiColor('xterm')
        parallelsAlwaysFailFast()
    }

    stages {
        stage('Placeholder setup') {
            steps {
                container('salesforce') {
                    sh "echo HELLO"
                }
            }
        }
        stage('Salesforce deployment') {
            steps {
                container('salesforce') {
                  
                    script{

                    checkout scm
                    def scmVars = checkout scm
                    def branchName = scmVars.GIT_BRANCH                        
                        
                        if (branchName == 'development' ){

                            // @TODO : put key file into Jenkins store
                            // @TODO : put deploy user key into key store as well
                            // @TODO : put deploy user email into key store as well
                            sh "sfdx auth:jwt:grant -i 3MVG9ooRt4uZ_3Tn3iAKeW0LysJ1LyjqEVV1LrJ6AdBke12m8uc_ax_rVvjJhZUa0uhLirXKyHS3pA.Shfw_m -f tmpKeyDEV/server.key --username paul_christian+devd1@rapid7.com "

                            sh "sfdx force:source:deploy -w 600 -p force-app -u paul_christian+devd1@rapid7.com"

                        } else if (branchName =~ 'APPS*' ) {

                            // @TODO : put key file into Jenkins store
                            // @TODO : put deploy user key into key store as well
                            // @TODO : put deploy user email into key store as well                            
                            sh "sfdx auth:jwt:grant -i 3MVG93inh8Bkz5nYuIiP_uL_0.nKphhEOzXvsSTx_9AHU65RsYJeijkFwkFHelUA3FUc5TUuFeWb0VOchRBUa -f tmpKeyDEVHUB/server.key --username paul_christian+testdevhub101@rapid7.com --setdefaultdevhubusername "
                            
                            try {
                            
                                // Create a scratch org @TODO@ - Randomize the alias name
                                sh 'sfdx force:org:create -f config/project-scratch-def.json -a MyScratchOrg -d 2'
                                
                                // Pass in the username to the password creation call
                                sh 'sfdx force:user:password:generate -u  MyScratchOrg '

                                // Dump state of the org details
                                sh 'sfdx org display user -o MyScratchOrg'
                                // Deploy contents
                                sh "sfdx force:source:deploy -w 600 -p force-app -u MyScratchOrg "                            

                            } finally {
                            
                                // Temp disable deletion for demo purposes
                                // sfdx force:org:delete -u MyScratchOrg -p
                                
                            }
                                
                                
                        } else if (branchName =~ 'version*') {

                            // @TODO : put key file into Jenkins store
                            // @TODO : put deploy user key into key store as well
                            // @TODO : put deploy user email into key store as well
                            sh "sfdx auth:jwt:grant -i 3MVG9E8TNx7FN9y71uMIC3Zq0NmqOKfBx4oJ9_5_5iqBlD0vR3S0XVl_NPVUBzmzUD9yQeg9TNsNKiJ1caTyJ -f tmpKeyUAT/server.key --username paul_christian+uatD1Test@rapid7.com "
                        
                            sh "sfdx force:source:deploy -w 600 -p force-app -u paul_christian+uatD1Test@rapid7.com "


                        } else {

                            // Nothing to build so comment and exit.
                            sh "echo No matching branches"
                            
                        }

                    }
                        

                  
                }
            }
        }
        stage('Finalize') {
            steps {
                container('salesforce') {
                  sh "echo GOODBYE"

                }
            }
        }

    }
}
