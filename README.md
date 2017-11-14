# autominestats
Stats and monitoring for mining rigs using [automine](https://github.com/adetokunbo/automine)

## Setup
1. `npm install`
1. `cp config/config.sample.json config/config.json`
1. Edit your config file:
    1. Choose an arbitrary name for your miner and paste the Ethereum address it is mining into
    1. Remove the second account entry if none
    1. Put your workers' names on the list, the same names you have in the `"worker"` field on [this automine config file](https://github.com/adetokunbo/automine/blob/master/cfg/127.0.0.1.automine_config.sample.json)
1. `npm run generate_html`
1. Set a cron job like: `*/10 * * * * /usr/bin/node ~/autominestats/bin/fetch.js >/dev/null 2>&1`
1. Check your stats at the generated HTML pages, with the periodically updated JSON files.
