!#/bin/bash

for f in *.js; do echo "Running $f"; k6 run "$f"; done