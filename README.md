# autominestats
Stats and monitoring for mining rigs using [automine](https://github.com/adetokunbo/automine)

## Setup
1. ```npm install```
1. ```cp settings.sample.json settings.json```
1. Choose a name and paste the Ethereum address you are mining into
1. Remove the second account entry if none
1. ```node setup.js```
1. Set a cron job like: ```*/10 * * * * /usr/bin/node ~/autominestats/fetch.js >/dev/null 2>&1```
1. Check your stats at the generated HTML pages, with the periodically updated JSON files.
