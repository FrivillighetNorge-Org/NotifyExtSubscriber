#! /usr/bin/env bash
set -e

docker-compose up -d

echo "### Starting tests ###"

docker-compose run server npm test
docker-compose run server npm run integration

echo "### Tearing down test env ###"
docker-compose down
