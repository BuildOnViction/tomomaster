#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
docker tag tomochain/tomomaster tomochain/tomomaster:$1
docker push tomochain/tomomaster:$1
