#!/bin/sh

cd /etc/hosc
export PATH=$PATH:/etc/hosc/runtime/bin
node service.js
