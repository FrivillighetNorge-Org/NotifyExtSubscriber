#!/usr/bin/env bash
export DEBIAN_FRONTEND=noninteractive

BINARY_DIR="/tmp/bin"
APP_DIR="/opt/notifythirdparty"
APP_USER="notifythirdparty"
LOG_FILE="notifythirdparty.log"

#COPY FILES FROM CLOUD STORAGE TO OUR VM
mkdir -p ${BINARY_DIR}
gsutil -m cp -R gs://notifythirdparty-service/* ${BINARY_DIR}

#GCLOUD
export CLOUD_SDK_REPO=cloud-sdk-`lsb_release -c -s`
echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
apt-get update
apt-get upgrade -y
apt-get -y install google-cloud-sdk

#GCLOUD AUTH
gcloud auth activate-service-account --key-file ${BINARY_DIR}/service-account.json

#SETUP GOOGLE FLUENTD FOR STACKDRIVER INTEGRATION
curl https://dl.google.com/cloudagents/install-logging-agent.sh | bash
service google-fluentd reload

# ADD APP USER WITHOUT $HOME OR $SHELL
echo "Adding user (${APP_USER})"
u¨¨¨¨¨¨seradd -s /usr/sbin/nologin -M ${APP_USER}

#NODE INSTALLATION
echo "Installing NodeJS into /usr/local/"
tar xzf ${BINARY_DIR}/nodejs.tar.gz -C /usr/local --strip-components=1

#UNPACK JS
echo "Unpacking application JS"
if [ -d "${APP_DIR}" ]; then
  echo "Deleting old notify third party service directory (${APP_DIR})"
  rm -rf ${APP_DIR}
fi
echo "Creating new notify third party directory (${APP_DIR})"
mkdir -p ${APP_DIR}
echo "Unpacking application archive into ${APP_DIR}"
tar zxf ${BINARY_DIR}/app.tar.gz -C ${APP_DIR} --strip-components=1
chown -R ${APP_USER} ${APP_DIR}
chmod -R 750 ${APP_DIR}

# INSTALL NPM MODULES
# cd ${APP_DIR}
# echo "Installing NPM modules"
# npm install > /dev/null

#CRONTAB BACKUP LOGS
echo "Setting up Crontab for backup of logs"
cp ${APP_DIR}/deploy/crontab /etc/cron.daily/frivillig-logrotation

# MAKE LOG DIR WRITABLE FOR APP
echo "Setting correct permissions for application logs (/var/log/notifythirdparty/${LOG_FILE})"
mkdir /var/log/notifythirdparty/
:> /var/log/notifythirdparty/${LOG_FILE}
chown ${APP_USER} /var/log/notifythirdparty/${LOG_FILE}

# MOVE OVER PRODUCTION CONFIGURATION FILE
echo "Copy production configuration files (${APP_DIR}/config/index.js)"
cp ${BINARY_DIR}/config.js ${APP_DIR}/config/index.js

# ADD SERVICE FILE FOR STATS
echo "Setting up systemd service file"
cp ${APP_DIR}/deploy/notifythirdparty.service /etc/systemd/system/

# ADD SERVICE ACCOUNT FILE FOR GOOGLE ANALYTICS INTEGRATION
echo "Copying over service-account.json for Google Analytics integration"
cp ${BINARY_DIR}/service-account.json ${APP_DIR}
chown ${APP_USER} ${APP_DIR}/service-account.json

# REMOVE BINARY_DIR
echo "Removing temp binary folder (${BINARY_DIR})"
rm -rf ${BINARY_DIR}

# This script can be run on a machine that already has our service enabled and running, so we must take that into consideration.
# is-enabled returns 0 if the service is enabled and 1 if it is not enabled.
systemctl is-enabled notifythirdparty.service
if [ $? -ne 0 ]; then
    systemctl restart notifythirdparty
else
    systemctl enable notifythirdparty
    systemctl start notifythirdparty
fi
