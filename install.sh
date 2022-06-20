#!/bin/sh

# This script needs root access
[ "$(whoami)" != "root" ] && echo "This script needs to be run as root" && exec sudo -- "$0" "$@"

# Pre-setup
apt-get update
apt-get -y install curl ssh git
cd /etc
git clone https://github.com/ngxson/hosc.git
cd /etc/hosc

# Install node
curl https://nodejs.org/dist/v16.15.1/node-v16.15.1-linux-x64.tar.xz --output node.tar.xz
tar -xf node.tar.xz
rm node.tar.xz
mv node-v* runtime
export PATH=$PATH:/etc/hosc/runtime/bin

# disable PasswordAuthentication
sed -i "/^[^#]*PasswordAuthentication[[:space:]]no/c\PasswordAuthentication no" /etc/ssh/sshd_config
systemctl restart ssh

# Setup hosc user
usermod -m hosc
usermod -aG sudo hosc
mkdir              /home/hosc/.ssh
chmod -R 700       /home/hosc/.ssh
touch              /home/hosc/.ssh/authorized_keys
chmod 600          /home/hosc/.ssh/authorized_keys
chown -R hosc:hosc /home/hosc/.ssh
# TODO: remove current user from sudoers

# Run HOSC installer
npm ci
node install.js

# Install service
cp /etc/hosc/service/hosc.service /etc/systemd/system/hosc.service
chmod a+x /etc/systemd/system/hosc.service
chown root:root /etc/systemd/system/hosc.service
systemctl daemon-reload
systemctl enable hosc.service
systemctl start hosc.service

# OK
reboot
