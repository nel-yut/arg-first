#!/bin/bash

git config --global --add safe.directory $1
sudo chown -R vscode:vscode /home/vscode/.cache /home/vscode/.npm $1/frontend-app/node_modules

cd /workspace/frontend-app
npm install