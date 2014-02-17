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
    shotsCount: Number,
    draftedBy: String,
    drafteesCount: Number,
    followersCount: Number,
    followingCount: Number,
    commentsCount: Number,
    commentsReceivedCount: Number,
    likesCount: Number,
    likesReceivedCount: Number,
    reboundsCount: Number,
    reboundsReceivedCount: Number,
    name: String,
    websiteUrl: String,
    benchCount: Number,
    captain: Boolean,
    dribbbleId: String}],
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
    var madePlayer = {};
    for (var i = data.players.length - 1; i >= 0; i--) {
      madePlayer.name = data.players[i].name;
      madePlayer.location = data.players[i].location;
      madePlayer.url = data.players[i].url;
      madePlayer.dribbbleId = data.players[i].id;
      madePlayer.followersCount = data.players[i].followers_count;
      madePlayer.drafteesCount = data.players[i].draftees_count;
      madePlayer.likesCount = data.players[i].likes_count;
      madePlayer.likesReceivedCount = data.players[i].likes_received_count;
      madePlayer.commentsCount = data.players[i].comments_count;
      madePlayer.commentsReceivedCount = data.players[i].comments_received_count;
      madePlayer.reboundsCount = data.players[i].rebounds_count;
      madePlayer.reboundsReceivedCount = data.players[i].rebounds_received_count;
      madePlayer.image = data.players[i].avatar_url;
      madePlayer.dribbbleName = data.players[i].username;
      madePlayer.twitterName = data.players[i].twitter_screen_name;
      madePlayer.websiteUrl = data.players[i].website_url;
      madePlayer.draftedBy = data.players[i].drafted_by_player_id;
      madePlayer.shotsCount = data.players[i].shots_count;
      madePlayer.followingCount = data.players[i].following_count;

      bench.players.push(madePlayer);
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

Bench.statics.removePlayer = function(data, io, cb) {
  this.findOneAndUpdate({_id: data.bench},{$pull: {players: {dribbbleId: data.player.dribbbleId}}}, function(err, result) {
    if(err){
      console.log(err);
      io.sockets.emit('error', {details: err});
    }
    if(result){
      io.sockets.emit('removedPlayersToBench', { requestor: data.requestor, bench: result });
      if(cb){
        cb(err, result);
      }
    }
  });
};

Bench.statics.findPlayerBenches = function(data, io, cb) {
  this.find({'players.dribbbleName': data.dribbbleName}, function (err, benches) {
    var benchData = {
      name: data.dribbbleName,
      count: benches.length,
      titles: [],
      elem: data.elemId,
      requestor: data.requestor
    };
    for (var i = benches.length - 1; i >= 0; i--) {
      benchData.titles.push(benches[i].title);
    }
    io.sockets.emit('foundPlayerBenches', benchData);
  });
};

module.exports = mongoose.model('Bench', Bench);