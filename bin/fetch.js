var mongoose = require('mongoose');
var fs = require('fs');
var script_directory = process.argv[1].substring(0, process.argv[1].lastIndexOf("/"));
script_directory = script_directory.substring(0, script_directory.lastIndexOf("/") + 1);
var config = JSON.parse(fs.readFileSync(script_directory + 'config/config.json', 'utf8'));

mongoose.Promise = global.Promise;
mongoose.connect(config.database_url, { useMongoClient: true });
var Rounds = require('../lib/model_miner_history')(mongoose);
var WorkerRounds = require('../lib/model_worker_history')(mongoose);
var Fetcher = require('../lib/fetcher');

var db = mongoose.connection;

var fetchers = []

config.accounts.forEach(account => {
  // console.log("New fetcher for " + JSON.stringify(account));
  account.models = {
    "Rounds": Rounds,
    "WorkerRounds": WorkerRounds
  };
  fetchers.push(new Fetcher(account));
  // console.log("Fetcher for " + account.name + " created");
});

fetchers.forEach(fetcher => {
  fetcher.running = true;
  fetcher.find_latest(Rounds)
  .then(threshold => {
    fetcher.fetch_miner_history(threshold)
    .then(saved_rounds => {
      console.log("🚛  " + fetcher.name + ": " + saved_rounds + " rounds newer than " + fetcher.latest_round_time);
      fetcher.write_jsons(config.timespans)
      .then(ret => {
        fetcher.find_latest(WorkerRounds)
        .then(threshold => {
          fetcher.fetch_worker_history(threshold)
          .then(ret => {
            fetcher.running = false;
            var are_we_done = true;
            fetchers.forEach(f => {
              if(f.running) are_we_done = false;
            });
            if (are_we_done) db.close();
          });
        });
      });
    });
  });
});

