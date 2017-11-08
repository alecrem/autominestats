module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var Round = new Schema({
    time: Number,
    date: Date,
    address: String,
    validShares: Number,
    invalidShares: Number,
    staleShares: Number,
    activeWorkers: Number,
    currentHashrate: Number,
    averageHashrate: Number,
    created: Date,
    updated: Date
  });
  return mongoose.model('Rounds', Round);;
}
