/**
  * Bench: A collection of players
  *
  */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    troop = require('mongoose-troop'),
    fs = require('fs'),
    config = JSON.parse(fs.readFileSync('./config.json'));

var Bench = new Schema({
  title: {type: String, default: 'New Bench', required: true},
  description: {type: String, default: ''},
  players: [{
    dribbbleName: String,
    image: String, 
    location: String,
    url: String,
    twitterName: String,
    benchCount: Number,
    shotsCount: Number,
    drafteesCount: Number,
    followersCount: Number,
    followingCount: Number,
    commentsCount: Number,
    commentsReceivedCount: Number,
    likesCount: Number,
    likesReceivedCount: Number,
    reboundsCount: Number,
    reboundsReceviedCount: Number,
    name: String,
    captain: Boolean,
    dribbbleUid: String}],
  image: {type: String, default: ''},
  openPublic: {type: Boolean, default: true},
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

Bench.plugin(troop.timestamp);

Bench.statics.newBench = function(data, io, cb){
  var newBench = new this;
  newBench.title = data.title;
  newBench.description = data.description;
  newBench.image = data.image;
  newBench.openPublic = data.openPublic;
  newBench.userId = data.uid;
  newBench.save(function(err,result){
    if(err){
      console.log(err);
      io.sockets.emit('error', {details: err});
    }
    if(result){
      io.sockets.emit('newBench', { title: result.title, 
                                    description: result.description,  
                                    _id: result._id, 
                                    userId: result.userId });
    }
    if(cb){
      cb(err, result);
    }
  });
};

Bench.statics.updateBench = function(id, data, uid, io, cb){
  this.findById(id, function(err, bench){
    if (bench.userId == uid) {
      bench.title = data.title || bench.title;
      bench.description = data.description || bench.description;
      bench.image = data.image || bench.image;
      bench.openPublic = data.openPublic || bench.openPublic;
      bench.save(function(err,result){
        if(err){
          console.log(err);
          io.sockets.emit('error', {details: err});
        }
        if(result){
          io.sockets.emit('updatedBench', { title: result.title, 
                                        description: result.description, 
                                        image: result.image,
                                        _id: result._id, 
                                        userId: result.userId });
        }
        if(cb){
          cb(err, result);
        }
      });
    } else {
      var err = 403;
      cb(err, null);
    }
  });
};

Bench.statics.addPlayers = function(data, io, cb) {
  this.findById(data.bench, function(err, bench) {
    for (var i = data.players.length - 1; i >= 0; i--) {
      bench.players.push(data.players[i]);
    }
    bench.save(function(err,result){
      if(err){
        console.log(err);
        io.sockets.emit('error', {details: err});
      }
      if(result){
        io.sockets.emit('addedPlayersToBench', { requestor: data.requestor, bench: result });
        if(cb){
          cb(err, result);
        }
      }
    });
  });
};

Bench.statics.findPlayerBenches = function(data, io, cb) {
  this.find({'players.dribbbleName': data.dribbbleName}, function (err, benches) {
    var benchData = {
      name: data.dribbbleName,
      count: benches.length,
      titles: [],
      requestor: data.requestor
    };
    for (var i = benches.length - 1; i >= 0; i--) {
      benchData.titles.push(benches[i].title);
    };
    io.sockets.emit('foundPlayerBenches', benchData);
  });
};

module.exports = mongoose.model('Bench', Bench);