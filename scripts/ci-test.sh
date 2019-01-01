#!/usr/bin/env bash

set -e

# Test the server
cd server
npm install > /dev/null
mongo friport --eval "db.dropDatabase();"

# npm test
# npm run integration
