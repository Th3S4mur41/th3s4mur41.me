#!/bin/bash -i

# install and use the configured node version
nvm install
nvm use

# set token to download npm packages from GitHub registry
npm config set //npm.pkg.github.com/:_authToken '${NPM_TOKEN}'

# install playwright browsers
npm i -g playwright
npx playwright install --with-deps

# install node dependencies
npm i
