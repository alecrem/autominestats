module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var WorkerRound = new Schema({
    time: Number,
    date: Date,
    address: String,
    worker: String,
    lastSeen: Number,
    validShares: Number,
    invalidShares: Number,
    staleShares: Number,
    currentHashrate: Number,
    averageHashrate: Number,
    created: Date,
    updated: Date
  });
  return mongoose.model('WorkerRounds', WorkerRound);;
}
