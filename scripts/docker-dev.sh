!/usr/bin/env bash
docker-compose up -d
docker-compose exec database mongorestore /tmp/friport/ --db friport
