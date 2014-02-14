(function(window, document){
// declarations
  var i, dID = document.getElementsByName('dribbble'),
    socket = window.socket,
    uID = document.getElementsByName('uid'),
    homeMeta = document.getElementsByName('isHome'),
    playerLists = document.getElementsByClassName('player-list'),
    workBenches = document.getElementsByClassName('workbench'),
    userId = uID.length > 0 ? uID[0].content : null,
    dribbbleId = dID.length > 0 ? dID[0].content : null,
    isHome = homeMeta.length > 0 ? true : false,
    addendum = '?per_page=30',
    playerTemplate = _.template([
      '<div class="player" draggable="true" data-dribbble-id="<%= dribbbleId %>" data-dribbble-="<%= dribbbleId %>">',
        '<span class="likes" style="display:none;"><%= likesReceived %></span>',
        '<div class="player-pic">',
          '<img class="player-img" src="<%= image %>" title="<%= name %>" alt="<%= name %>" />',
        '</div>',
        '<div class="player-basics">',
          '<div class="lead name"><%= name %></div>',
          '<div class="detail"><span class="icon-location"></span> <%= location %></div>',
          '<div class="buttons">',
            '<a class="dribbble-link" href="<%= dribbbleUrl %>">Dribbble</a>',
            '<a class="twitter-link" href="http://twitter.com/<%= twitter %>"><span class="icon-twitter"></span></a>',
            '<a class="mail-link" href="mailto: ?subject=<%= name %>&body=<%= dribbbleUrl %>"><span class="icon-mail"></span></a>',
          '</div>',
        '</div>',
        '<div class="player-followers-count">',
          '<div class="lead followers"><%= followersCount %></div>',
          '<div class="detail">Followers</div>',
          '<div class="buttons"><a class="more-info-button"><span class="icon-arrow-right5"></span></div>',
        '</div>',
      '</div>'
      ].join(''));
  bbbench.uid = userId;
  bbbench.dribbbleId = dribbbleId;
  bbbench.following = [];

// logic
  if (dribbbleId && userId && isHome) {
    _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum, dribbbleId, handlePlayerFollowing);
    socket.on('foundPlayerBenches', handlePlayerBenches);
    socket.on('addedPlayersToBench', handlePlayerAdded);
    workBenches[0].addEventListener('dragover', workListDrag, false);
    workBenches[0].addEventListener('drop', workListDrop, false);
  }

// functions
  function workListDrag (evt) {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }
  function workListDrop (evt) {
    evt.preventDefault();
    var dribbbleId = parseInt(evt.dataTransfer.getData("dribbbleId"), 10),
      notYet = true,
      workerPlayers = [],
      player;
    for (var i = 0; i < bbbench.benches.length; i++) {
      if(bbbench.benches[i]['_id'] == evt.target.dataset.id){
        workerPlayers = bbbench.benches[i].players;
      }
    }
    for (i = workerPlayers.length - 1; i >= 0; i--) {
      if(parseInt(workerPlayers[i].dribbbleId, 10) == dribbbleId){
        notYet = false;
      }
    }
    for (i = bbbench.following.length - 1; i >= 0; i--) {
      if(bbbench.following[i].id == dribbbleId) {
        player = bbbench.following[i];
      }
    }
    if(notYet){
      socket.emit('addPlayersToBench', {players: [player], bench: evt.target.dataset.id})
    }else{
      alert('Already present!');
    }
  }
  function playerDrag (evt) {
    evt.dataTransfer.setData("dribbbleId", parseInt(evt.target.dataset.dribbbleId, 10));
  }
  function handlePlayerInfo(id, data){
    console.log('playerInfo', data);
  }
  function handlePlayerAdded(data) {
    for (var i = bbbench.benches.length - 1; i >= 0; i--) {
      if(bbbench.benches[i]['_id'] == data['_id']) {
        bbbench.benches[i] = data;
        console.log('updated');
      }
    }
  }
  function handlePlayerFollowing(id, data){
    if(data.page != data.pages){
      setTimeout(function(){
        _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum + '&page=' + (data.page + 1).toString(), 'following', handlePlayerFollowing);
      }, 1000);
    }
    for (i = data.players.length - 1; i >= 0; i--) {
      playerLists[0].innerHTML += playerTemplate({
        name: data.players[i].name,
        dribbbleId: data.players[i].id,
        draftedBy: data.players[i].drafted_by_player_id,
        image: data.players[i].avatar_url,
        location: data.players[i].location,
        username: data.players[i].username,
        twitter: data.players[i].twitter_screen_name,
        dribbbleUrl: data.players[i].url,
        shotsCount: data.players[i].shots_count,
        followersCount: data.players[i].followers_count,
        followingCount: data.players[i].following_count,
        commentsCount: data.players[i].comments_count,
        commentsReceived: data.players[i].comments_received_count,
        likesCount: data.players[i].likes_count,
        likesReceived: data.players[i].likes_received_count,
        reboundsCount: data.players[i].rebounds_count,
        reboundsReceived: data.players[i].rebounds_received_count
      });
      socket.emit('findPlayerBenches', {dribbbleName: data.players[i].username, requestor: userId});
      bbbench.following.push(data.players[i]);
    }
    for (i = playerLists[0].children.length - 1; i >= 0; i--) {
      playerLists[0].children[i].addEventListener('drag', playerDrag, false);
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