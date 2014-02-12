(function(window, document){
  var dID = document.getElementsByName('dribbble'),
    socket = window.socket,
    uID = document.getElementsByName('uid'),
    userId = uID.length > 0 ? uID[0].content : null,
    dribbbleId = dID.length > 0 ? dID[0].content : null,
    addendum = '?per_page=30',
    playerTemplate = _.template([].join(''));
  if (dribbbleId && userId && location.pathName == '/') {
    _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum, dribbbleId, handlePlayerFollowing);
    socket.on('foundPlayerBenches', handlePlayerBenches);
  }
  function handlePlayerInfo(id, data){
    console.log('playerInfo', data);
  }
  function handlePlayerFollowing(id, data){
    if(data.page != data.pages){
      setTimeout(function(){
        _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum + '&page=' + (data.page + 1).toString(), 'following', handlePlayerFollowing);
      }, 1000);
    }
    for (var i = data.players.length - 1; i >= 0; i--) {
      data.players[i]
    }
    for (i = data.players.length - 1; i >= 0; i--) {
      socket.emit('findPlayerBenches', {dribbbleName: data.players[i].username, requestor: userId});
    }
  }
  function handlePlayerBenches (data) {
    console.log('foundBenches', data);
  }
  function playerInfoUrl(id){
    return 'http://api.dribbble.com/players/' + id;
  }
  function playerFollowingUrl(id){
    return playerInfoUrl(id) + '/following';
  }
  function playerFollowersUrl(id){
    return playerInfoUrl(id) + '/followers';
  }
  function playerFollowingShotsUrl(id){
    return playerInfoUrl(id) + '/shots/following';
  }
  function playerShotsUrl(id){
    return playerInfoUrl(id) + '/shots';
  }
})(this, this.document);