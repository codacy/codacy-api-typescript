#!/bin/bash

set -e

# TODO - Get the Swagger definition from Bintray automatically; so far that definition is wrong
# curl https://dl.bintray.com/codacy/Binaries/$API_VERSION/swagger.yaml -o api-swagger.yaml

autorest --typescript \
         --model-date-time-as-string=false \
         --input-file=./api-swagger.yaml \
         --output-folder=./

npm run prepack