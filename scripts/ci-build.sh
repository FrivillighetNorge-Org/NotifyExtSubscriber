#!/usr/bin/env bash

set -e
# Move over deploy folder
cp -R deploy server/
# Compress into an archive, which we can upload to Google Cloud Storage
# tar zcf app.tar.gz server --exclude=server/*.spec.js --exclude=server/*.integration.js
