#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
docker tag tomochain/tomomaster tomochain/tomomaster:latest
docker tag tomochain/tomomaster tomochain/tomomaster:$TRAVIS_BUILD_ID
docker push tomochain/tomomaster:latest
docker push tomochain/tomomaster:$TRAVIS_BUILD_ID
