#!/usr/bin/env bash

set -e

docker run --init --rm -p 4010:4010 -v "$PWD:/current" stoplight/prism:3 mock -h 0.0.0.0 "/current/api-swagger.yaml"
