var mongoose = require('mongoose');
var fs = require('fs');
var script_directory = process.argv[1].substring(0, process.argv[1].lastIndexOf("/") + 1);
var settings = JSON.parse(fs.readFileSync(script_directory + '/settings.json', 'utf8'));

mongoose.Promise = global.Promise;
mongoose.connect(settings.database_url, { useMongoClient: true });
var Rounds = require('./model_miner_history')(mongoose);
var WorkerRounds = require('./model_worker_history')(mongoose);
var Fetcher = require('./fetcher');

var db = mongoose.connection;

var fetchers = []

settings.accounts.forEach(account => {
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
  fetcher.find_latest()
  .then(threshold => {
    fetcher.fetch_miner_history(threshold)
    .then(saved_rounds => {
      console.log("🚛  " + fetcher.name + ": " + saved_rounds + " rounds newer than " + fetcher.latest_round_time);
      fetcher.write_jsons(settings.timespans)
      .then(ret => {
        fetcher.fetch_worker_list()
        .then(current_workers => {
          console.log(current_workers);
          fetcher.fetch_worker_history()
          .then(ret => {
            fetcher.running = false;
            var are_we_done = true;
            fetchers.forEach(f => {
              if(f.running) are_we_done = false;
            });
            if (are_we_done) db.close();
          });
        })
      })
    });
  })
});

