Rounds = null
WorkerRounds = null
var needle = require('needle');
var fs = require('fs');
var script_directory = process.argv[1].substring(0, process.argv[1].lastIndexOf("/"));
script_directory = script_directory.substring(0, script_directory.lastIndexOf("/") + 1);

module.exports = class Fetcher {
  constructor(args){
    this.address = args.address;
    this.name = args.name;
    this.workers = args.workers;
    this.latest_round_time = 0;
    this.latest_worker_round_time = 0;
    this.running = false;
    Rounds = args.models.Rounds;
    WorkerRounds = args.models.WorkerRounds;
  }
  find_latest(model) {
    // console.log("Finding the latest record for the given model");
    return model.findOne({ 'address': this.address }, {}, { sort: { time: -1 } }).exec()
    .then((result) => {
      return result.time;
    })
    .catch((err, result) => {
      console.log(err);
    })
  }
  fetch_miner_history(threshold) {
    this.latest_round_time = threshold;
    var fetch_url = 'https://api.ethermine.org/miner/' + this.address + '/history';
    return needle('get', fetch_url)
    .then(resp => {
      var new_rounds = [];
      if (typeof threshold == "number") {
        // console.log("threshold is a Number");
        resp.body.data.forEach(round => {
          if(round.time > threshold) {
            new_rounds.push(round);
          }
        });
      } else {
        // console.log("threshold is NOT a Number");
        new_rounds = resp.body.data;
      }
      // console.log("Rounds fetched: " + resp.body.data.length);
      // console.log("Rounds to be saved: " + new_rounds.length);
      var parray = [];
      var parray = new_rounds.map(round => {
        var new_round = new Rounds(round);
        new_round.date = new Date(new_round.time * 1000);
        var new_date = new Date();
        new_round.created = new_date;
        new_round.updated = new_date;
        new_round.address = this.address;
        return new_round.save()
        .then((new_round) => {
          // console.log("Saved round " + new_round.time + " / " + new_round.date);
        })
        .catch((err) => {
          console.log("Saving failed for round " + new_round.time + " / " + new_round.date);
          console.error(err);
        });

      });
      return Promise.all(parray)
      .then(() => {
        // console.log("All saving done: " + parray.length);
        return parray.length;
      })
      .catch((err) => console.error(err));
    })
    .catch(err => {
      console.error("Error fetching ethermine's miner history JSON:");
      console.error(err);
    });
  }
  fetch_worker_history(threshold) {
    this.latest_worker_round_time = threshold;
    var parray2 = this.workers.map(worker => {
      var fetch_url = 'https://api.ethermine.org/miner/' + this.address + '/worker/' + worker + '/history';
      return needle('get', fetch_url)
      .then(resp => {
        var new_rounds = [];
        if (typeof threshold == "number") {
          // console.log("threshold is a Number");
          resp.body.data.forEach(round => {
            if(round.time > threshold) {
              new_rounds.push(round);
            }
          });
        } else {
          // console.log("threshold is NOT a Number");
          new_rounds = resp.body.data;
        }
        var parray = [];
        var parray = new_rounds.map(round => {
          var new_round = new WorkerRounds(round);
          new_round.date = new Date(new_round.time * 1000);
          var new_date = new Date();
          new_round.created = new_date;
          new_round.updated = new_date;
          new_round.address = this.address;
          new_round.worker = worker;
          return new_round.save()
          .then((new_round) => {
            // console.log("Saved round " + new_round.time + " / " + new_round.date);
          })
          .catch((err) => {
            console.log("Saving failed for round " + new_round.time + " / " + new_round.date);
            console.error(err);
          });

        });
        return Promise.all(parray)
        .then(() => {
          // console.log("All saving done: " + parray.length);
          console.log("🚚  " + this.name + "/" + worker + ": " + parray.length + " rounds newer than " + this.latest_round_time);
          return parray.length;
        })
        .catch((err) => console.error(err));
      })
      .catch(err => {
        console.error("Error fetching ethermine's worker history JSON:");
        console.error(fetch_url);
        console.error(err);
      });
    });
    return Promise.all(parray2)
    .then(() => {
      // console.log("All saving done: " + parray2.length);
      return parray2.length;
    })
  }
  write_stats_jsons(timespans) {
    var parray = timespans.map(timespan => {
      var thresdate = new Date();
      thresdate.setDate(thresdate.getDate() - timespan.days);
      var threshold = Math.floor(thresdate.getTime()/1000);
      return Rounds.find({ 'time': { $gt: threshold }, 'address': this.address })
      .then(results => {
        fs.writeFile(script_directory + 'data/stats_' + this.name + timespan.days + '.json', JSON.stringify(results, null, 2), (err) => {
          if (err) throw err;
          else console.log('✍️  stats_' + this.name + timespan.days + '.json is saved! ' + results.length + ' results newer than ' + threshold);
        });
      })
    });
    return Promise.all(parray)
    .then(() => {
      // console.log("All JSON saving done: " + parray.length);
      return parray.length;
    })
    .catch((err) => console.error(err));
  }
  write_workers_jsons(timespans) {
    var parray = timespans.map(timespan => {
      var thresdate = new Date();
      thresdate.setDate(thresdate.getDate() - timespan.days);
      var threshold = Math.floor(thresdate.getTime()/1000);
      return WorkerRounds.find({ 'time': { $gt: threshold }, 'address': this.address })
      .then(results => {
        fs.writeFile(script_directory + 'data/workers_' + this.name + timespan.days + '.json', JSON.stringify(results, null, 2), (err) => {
          if (err) throw err;
          else console.log('✍️  workers_' + this.name + timespan.days + '.json is saved! ' + results.length + ' results newer than ' + threshold);
        });
      })
    });
    return Promise.all(parray)
    .then(() => {
      // console.log("All JSON saving done: " + parray.length);
      return parray.length;
    })
    .catch((err) => console.error(err));
  }
}
