Rounds = null
WorkerRounds = null
var needle = require('needle');
var fs = require('fs');

module.exports = class Fetcher {
  constructor(args){
    this.address = args.address;
    this.name = args.name;
    this.latest_round_time = 0;
    this.running = false;
    Rounds = args.models.Rounds;
    WorkerRounds = args.models.WorkerRounds;
  }
  find_latest() {
    // console.log("Finding the latest record on our Mongo database");
    return Rounds.findOne({ 'address': this.address }, {}, { sort: { time: -1 } }).exec()
    .then((result) => {
      if (typeof result === 'object' && result !== null) {
        if (typeof result.time != "undefined"){
          this.latest_round_time = result.time;
        }
      }
      return this.latest_round_time;
    })
    .catch((err, result) => {
      console.log(err);
    })
  }
  write_jsons(timespans) {
    var parray = timespans.map(timespan => {
      var thresdate = new Date();
      thresdate.setDate(thresdate.getDate() - timespan.days);
      var threshold = Math.floor(thresdate.getTime()/1000);
      return Rounds.find({ 'time': { $gt: threshold }, 'address': this.address })
      .then(results => {
        fs.writeFile('stats_' + this.name + timespan.days + '.json', JSON.stringify(results, null, 2), (err) => {
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
  fetch_miner_history(threshold) {
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
  fetch_worker_list() {
    var fetch_url = 'https://api.ethermine.org/miner/' + this.address + '/workers';
    return needle('get', fetch_url)
    .then(resp => {
      var current_workers = [];
      current_workers = resp.body.data;
      console.log("Workers fetched: " + resp.body.data.length);
      console.log("Workers to be saved: " + current_workers.length);
      return current_workers;
    })
    .catch(err => {
      console.error("Error fetching ethermine's current workers JSON:");
      console.error(err);
    });
  }
}
