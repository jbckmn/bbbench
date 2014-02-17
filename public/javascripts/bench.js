(function(window, document){
// declarations
  var i, dID = document.getElementsByName('dribbble'),
    socket = window.socket,
    uID = document.getElementsByName('uid'),
    homeMeta = document.getElementsByName('isHome'),
    playerLists = document.getElementsByClassName('player-list'),
    workBenches = document.getElementsByClassName('workbench'),
    benchLinks = document.getElementsByClassName('bench-link'),
    playerSorters = document.getElementsByClassName('player-sorter'),
    workSorters = document.getElementsByClassName('work-sorter'),
    addAnyone = document.getElementsByClassName('add-anyone'),
    whoIFollow = document.getElementsByClassName('who-i-follow'),
    userId = uID.length > 0 ? uID[0].content : null,
    dribbbleId = dID.length > 0 ? dID[0].content : null,
    isHome = homeMeta.length > 0 ? true : false,
    addendum = '?per_page=30',
    playerTemplate = _.template([
      '<div id="<%= elemId %>" class="player<%= draggable ?  \'\' : \' no-drag\'%>" draggable="<%= draggable.toString() %>" data-dribbble-id="<%= dribbbleId %>" data-dribbble-name="<%= username %>">',
        '<span class="likes" style="display:none;"><%= likesReceived %></span>',
        '<div class="player-main">',
          '<div class="player-pic">',
            '<img class="player-img" src="<%= image %>" title="<%= name %>" alt="<%= name %>" />',
          '</div>',
          '<div class="player-basics">',
            '<div class="lead name"><%= name %></div>',
            '<div class="detail"><span class="icon-location"></span> <%= location %></div>',
            '<div class="buttons">',
              '<a class="dribbble-link" href="<%= dribbbleUrl %>" target="_blank">Dribbble</a>',
              '<a class="twitter-link" href="http://twitter.com/<%= twitter %>" target="_blank"><span class="icon-twitter"></span></a>',
              '<a class="web-link" href="<%= websiteUrl || dribbbleUrl %>" target="_blank"><span class="icon-network"></span></a>',
              '<a class="mail-link" href="mailto: ?subject=<%= name %>&body=<%= dribbbleUrl %>"><span class="icon-mail"></span></a>',
            '</div>',
          '</div>',
          '<div class="player-followers-count">',
            '<div class="lead followers"><%= followersCount %></div>',
            '<div class="detail">Followers</div>',
            '<div class="buttons">',
              '<% if (!draggable) { %>',
                '<a class="remove-button" title="remove <%= name %>" data-elem-id="<%= elemId %>"><span class="icon-cross2"></span></a>',
              '<% } %>',
              '<a class="more-info-button" data-elem-id="<%= elemId %>"><span class="icon-arrow-down5"></span></a>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="player-card">',
          '<div class="player-card-bill text-center" style="display:none;">',
            '<h3 class="player-card-name"><%= name %></h3>',
            '<h5 class="player-card-occupation"><span class="icon-location"></span> <%= location %></h5>',
          '</div>',
          '<table class="player-card-table pure-table">',
            '<caption>Major League Record</caption>',
            '<thead>',
              '<tr>',
                '<th>Shots</th>',
                '<th>Followers</th>',
                '<th>Likes rec.</th>',
                '<th>Rebounds rec.</th>',
                '<th>Comments rec.</th>',
              '</tr>',
            '</thead>',
            '<tbody>',
              '<tr>',
                '<td><%= shotsCount %></td>',
                '<td><%= followersCount %></td>',
                '<td><%= likesReceived %></td>',
                '<td><%= reboundsReceived %></td>',
                '<td><%= commentsReceived %></td>',
              '</tr>',
            '</tbody>',
          '</table>',
          '<table class="player-card-table pure-table">',
            '<thead>',
              '<tr>',
                '<th>Draftees</th>',
                '<th>Following</th>',
                '<th>Likes</th>',
                '<th>Rebounds</th>',
                '<th>Comments</th>',
              '</tr>',
            '</thead>',
            '<tbody>',
              '<tr>',
                '<td><%= draftees %></td>',
                '<td><%= followingCount %></td>',
                '<td><%= likesCount %></td>',
                '<td><%= reboundsCount %></td>',
                '<td><%= commentsCount %></td>',
              '</tr>',
            '</tbody>',
          '</table>',
        '</div>',
      '</div>'
      ].join(''));
  bbbench.uid = userId;
  bbbench.dribbbleId = dribbbleId;
  bbbench.following = [];

// logic
  if (dribbbleId && userId && isHome) {
    _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum, dribbbleId, handlePlayerFollowing);
    var followingLoader = setInterval(function(){runFollowingLoader();}, 500);
    socket.on('foundPlayerBenches', handlePlayerBenches);
    socket.on('addedPlayersToBench', handlePlayerAdded);
    readyBenchLinks(benchLinks);
    readySorters(playerSorters, workSorters);
    addAnyone[0].addEventListener('click', handleAnyone, false);
    whoIFollow[0].addEventListener('click', handleWhoIFollow, false);
  }

// functions
  function workListDrag (evt) {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }
  function workListDrop (evt) {
    evt.preventDefault();
    if (bbbench.draggard.length > 0) {
      var dribbbleId = bbbench.draggard[0],
        notYet = true,
        daBench = _.find(bbbench.benches, {'_id': this.dataset.benchId}),
        workerPlayers = daBench.players,
        player = _.find(bbbench.following, {'id': dribbbleId});
      for (i = workerPlayers.length - 1; i >= 0; i--) {
        if(parseInt(workerPlayers[i].dribbbleId, 10) == dribbbleId){
          notYet = false;
        }
      }
      if(notYet){
        socket.emit('addPlayersToBench', {players: [player], bench: daBench._id});
      }else{
        alert('Already present!');
      }
    }
    bbbench.draggard = [];
  }
  function playerDrag (evt) {
    bbbench.draggard = [parseInt(evt.target.dataset.dribbbleId, 10)];
  }
  function readyRemovePlayers () {
    var removePlayers = document.getElementsByClassName('remove-button');
    for (var i = removePlayers.length - 1; i >= 0; i--) {
      removePlayers[i].addEventListener('click', removePlayer, false);
    }
  }
  function removePlayer (evt) {
    var playerElem = this.parentNode.parentNode.parentNode.parentNode,
      dribbbleId = playerElem.dataset.dribbbleId,
      dribbbleName = playerElem.dataset.dribbbleName,
      workList = document.getElementsByClassName('work-list')[0],
      benchId = workList.dataset.benchId,
      daBench = _.find(bbbench.benches, {'_id': benchId}),
      player = _.find(daBench.players, {'dribbbleId': dribbbleId});
    socket.emit('removePlayerFromBench', {bench: benchId, player: player});
    playerElem.parentNode.removeChild(playerElem);
    for (var i = daBench.players.length - 1; i >= 0; i--) {
      if(daBench.players[i].dribbbleId == dribbbleId) {
        daBench.players.splice(i, 1);
      }
    }
  }
  function readyMoreInfos () {
    var moreInfos = document.getElementsByClassName('more-info-button');
    for (var i = moreInfos.length - 1; i >= 0; i--) {
      moreInfos[i].addEventListener('click', showPlayerCard, false);
    }
  }
  function showPlayerCard (evt) {
    var spanClass = this.children[0].className,
      card = this.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('player-card')[0];
    if (spanClass == 'icon-arrow-down5') {
      this.children[0].className = 'icon-arrow-up5';
      card.style.display = 'block';
    } else {
      this.children[0].className = 'icon-arrow-down5';
      card.style.display = 'none';
    }
  }
  function readySorters (playerSorters, workSorters) {
    for (var i = playerSorters.length - 1; i >= 0; i--) {
      playerSorters[i].addEventListener('click', sortPlayers, false);
    }
    for (i = workSorters.length - 1; i >= 0; i--) {
      workSorters[i].addEventListener('click', sortWork, false);
    }
  }
  function compareNames (a, b) {
    return (-1) * a.name.localeCompare(b.name);
  }
  function compareLikes (a, b) {
    return a.likesReceivedCount > b.likesReceivedCount ? 1 : -1;
  }
  function compareFollowers (a, b) {
    return a.followersCount > b.followersCount ? 1 : -1;
  }
  function createFollowingMap () {
    return bbbench.following.map(function(e, i){
      return {
        index: i, 
        name: e.name.toLowerCase(),
        likesReceivedCount: e.likes_received_count,
        followersCount: e.followers_count 
      };
    });
  }
  function createBenchMap (daBench) {
    return daBench.players.map(function(e, i){
      return {
        index: i, 
        name: e.name.toLowerCase(),
        likesReceivedCount: e.likesReceivedCount,
        followersCount: e.followersCount 
      };
    });
  }
  function getSorted (sortBy, playersToSort, map) {
    if (sortBy == 'name') {
      map.sort(compareNames);
    } else if (sortBy == 'likesReceivedCount') {
      map.sort(compareLikes);
    } else if (sortBy == 'followersCount') {
      map.sort(compareFollowers);
    }
    var result = map.map(function(e){
      return playersToSort[e.index];
    });
    return result;
  }
  function sortPlayers (evt) {
    evt.preventDefault();
    bbbench.followingMap = bbbench.followingMap || createFollowingMap();
    var placeGroup = getSorted(this.dataset.sortBy, bbbench.following, bbbench.followingMap),
      elemId, 
      tempHTML = [],
      playerSorters = document.getElementsByClassName('player-sorter');
    for (var i = playerSorters.length - 1; i >= 0; i--) {
      classie.remove(playerSorters[i], 'active');
    }
    classie.remove(document.getElementsByClassName('add-anyone')[0], 'active');
    classie.add(this, 'active');
    playerLists[0].innerHTML = null;
    for (i = placeGroup.length - 1; i >= 0; i--) {
      elemId = 'players-' + i.toString();
      tempHTML.push(playerTemplate({
        name: placeGroup[i].name,
        elemId: elemId,
        draggable: true,
        dribbbleId: placeGroup[i].id,
        draftedBy: placeGroup[i].drafted_by_player_id,
        image: placeGroup[i].avatar_url,
        location: placeGroup[i].location,
        username: placeGroup[i].username,
        twitter: placeGroup[i].twitter_screen_name,
        dribbbleUrl: placeGroup[i].url,
        websiteUrl: placeGroup[i].website_url,
        shotsCount: placeGroup[i].shots_count,
        followersCount: placeGroup[i].followers_count,
        followingCount: placeGroup[i].following_count,
        commentsCount: placeGroup[i].comments_count,
        commentsReceived: placeGroup[i].comments_received_count,
        likesCount: placeGroup[i].likes_count,
        likesReceived: placeGroup[i].likes_received_count,
        reboundsCount: placeGroup[i].rebounds_count,
        reboundsReceived: placeGroup[i].rebounds_received_count,
        draftees: placeGroup[i].draftees_count
      }));
      // socket.emit('findPlayerBenches', {dribbbleName: placeGroup[i].username, requestor: userId, elem: elemId});
    }
    playerLists[0].innerHTML = tempHTML.join('');
    readyMoreInfos();
  }
  function sortWork (evt) {
    evt.preventDefault();
    var workList = document.getElementsByClassName('work-list')[0],
      daBench = _.find(bbbench.benches, {'_id': workList.dataset.benchId}),
      elemId,
      workSorters = document.getElementsByClassName('work-sorter');
    daBench.playerMap = createBenchMap(daBench);
    daBench.players = getSorted(this.dataset.sortBy, daBench.players, daBench.playerMap);
    for (var i = workSorters.length - 1; i >= 0; i--) {
      classie.remove(workSorters[i], 'active');
    }
    if(workList.dataset.benchId){
      classie.add(this, 'active');
      workList.innerHTML = null;
      for (i = daBench.players.length - 1; i >= 0; i--) {
        elemId = 'working-' + i.toString();
        workList.innerHTML += playerTemplate({
          name: daBench.players[i].name,
          elemId: elemId,
          draggable: false,
          captain: daBench.players[i].captain,
          benchCount: daBench.players[i].benchCount,
          dribbbleId: daBench.players[i].dribbbleId,
          draftedBy: daBench.players[i].draftedBy,
          image: daBench.players[i].image,
          location: daBench.players[i].location,
          username: daBench.players[i].dribbbleName,
          twitter: daBench.players[i].twitterName,
          dribbbleUrl: daBench.players[i].url,
          websiteUrl: daBench.players[i].websiteUrl,
          shotsCount: daBench.players[i].shotsCount,
          followersCount: daBench.players[i].followersCount,
          followingCount: daBench.players[i].followingCount,
          commentsCount: daBench.players[i].commentsCount,
          commentsReceived: daBench.players[i].commentsReceivedCount,
          likesCount: daBench.players[i].likesCount,
          likesReceived: daBench.players[i].likesReceivedCount,
          reboundsCount: daBench.players[i].reboundsCount,
          reboundsReceived: daBench.players[i].reboundsReceivedCount,
          draftees: daBench.players[i].drafteesCount
        });
        // socket.emit('findPlayerBenches', {dribbbleName: daBench.players[i].username, requestor: userId, elem: elemId});
      }
      readyMoreInfos();
      readyRemovePlayers();
    }
  }
  function handleAnyone (evt) {
    evt.preventDefault();
    var person = prompt("Please enter a Dribbble player's username:","Harry Potter"),
      playerList = document.getElementsByClassName('player-list')[0];
    if (person!==null) {
      playerList.innerHTML = null;
      classie.add(this, 'active');
      classie.remove(document.getElementsByClassName('who-i-follow')[0], 'active');
      _.asyncRequest(playerInfoUrl(person) + addendum, 'info', handlePlayerInfo);
    }
  }
  function handleWhoIFollow (evt) {
    evt.preventDefault();
    classie.add(this, 'active');
    classie.remove(document.getElementsByClassName('add-anyone')[0], 'active');
    var placeGroup = bbbench.following,
      elemId, 
      tempHTML = [],
      playerSorters = document.getElementsByClassName('player-sorter');
    for (var i = playerSorters.length - 1; i >= 0; i--) {
      classie.remove(playerSorters[i], 'active');
    }
    playerLists[0].innerHTML = null;
    for (i = placeGroup.length - 1; i >= 0; i--) {
      elemId = 'players-' + i.toString();
      tempHTML.push(playerTemplate({
        name: placeGroup[i].name,
        elemId: elemId,
        draggable: true,
        dribbbleId: placeGroup[i].id,
        draftedBy: placeGroup[i].drafted_by_player_id,
        image: placeGroup[i].avatar_url,
        location: placeGroup[i].location,
        username: placeGroup[i].username,
        twitter: placeGroup[i].twitter_screen_name,
        dribbbleUrl: placeGroup[i].url,
        websiteUrl: placeGroup[i].website_url,
        shotsCount: placeGroup[i].shots_count,
        followersCount: placeGroup[i].followers_count,
        followingCount: placeGroup[i].following_count,
        commentsCount: placeGroup[i].comments_count,
        commentsReceived: placeGroup[i].comments_received_count,
        likesCount: placeGroup[i].likes_count,
        likesReceived: placeGroup[i].likes_received_count,
        reboundsCount: placeGroup[i].rebounds_count,
        reboundsReceived: placeGroup[i].rebounds_received_count,
        draftees: placeGroup[i].draftees_count
      }));
      // socket.emit('findPlayerBenches', {dribbbleName: placeGroup[i].username, requestor: userId, elem: elemId});
    }
    playerLists[0].innerHTML = tempHTML.join('');
    document.getElementsByClassName('player-heading')[0].innerHTML = placeGroup.length.toString() + ' Players';
    readyMoreInfos();
  }
  function readyBenchLinks (benchLinks) {
    var closeWork = document.getElementsByClassName('close-work')[0],
      shareWork = document.getElementsByClassName('share-work')[0];
    for (var i = benchLinks.length - 1; i >= 0; i--) {
      benchLinks[i].addEventListener('click', readyWorkBench, false);
    }
    closeWork.addEventListener('click', closeWorkBench, false);
    // shareWork.addEventListener('click', shareWorkBench, false);
  }
  function shareWorkBench (evt) {
    evt.preventDefault();
    // todo
  }
  function closeWorkBench (evt) {
    evt.preventDefault();
    var workBench = document.getElementsByClassName('workbench')[0],
      workHeading = workBench.getElementsByClassName('work-heading')[0],
      workActions = workBench.getElementsByClassName('work-actions')[0],
      list = workBench.getElementsByClassName('work-list')[0],
      benchId = list.dataset.benchId,
      benchLinks = document.getElementsByClassName('bench-link');
    for (var i = benchLinks.length - 1; i >= 0; i--) {
      if(benchLinks[i].dataset.benchId == benchId) {
        classie.remove(benchLinks[i], 'active');
      }
    }
    list.innerHTML = null;
    list.dataset.benchId = '';
    workHeading.innerHTML = '<span class="muted">Select a bench</span>';
    workActions.style.display = 'none';
  }
  function readyWorkBench (evt) {
    evt.preventDefault();
    var id = this.dataset.benchId,
      name = this.textContent,
      workBench = document.getElementsByClassName('workbench')[0],
      workHeading = workBench.getElementsByClassName('work-heading')[0],
      workActions = workBench.getElementsByClassName('work-actions')[0],
      benchLinks = document.getElementsByClassName('bench-link'),
      list = workBench.getElementsByClassName('work-list')[0],
      daBench = _.find(bbbench.benches, {'_id': id}),
      elemId;
    list.addEventListener('dragover', workListDrag, false);
    list.addEventListener('drop', workListDrop, false);
    for (var i = benchLinks.length - 1; i >= 0; i--) {
      classie.remove(benchLinks[i], 'active');
    }
    classie.add(this, 'active');
    workHeading.innerHTML = daBench.title + ' (' + daBench.players.length.toString() + ')';
    workActions.style.display = 'block';
    workActions.children[0].href = '/bench/' + daBench._id;
    list.dataset.benchId = daBench._id;
    list.innerHTML = null;
    for (i = daBench.players.length - 1; i >= 0; i--) {
      elemId = 'working-' + i.toString();
      list.innerHTML += playerTemplate({
        name: daBench.players[i].name,
        elemId: elemId,
        draggable: false,
        captain: daBench.players[i].captain,
        benchCount: daBench.players[i].benchCount,
        dribbbleId: daBench.players[i].dribbbleId,
        draftedBy: daBench.players[i].draftedBy,
        image: daBench.players[i].image,
        location: daBench.players[i].location,
        username: daBench.players[i].dribbbleName,
        twitter: daBench.players[i].twitterName,
        dribbbleUrl: daBench.players[i].url,
        websiteUrl: daBench.players[i].websiteUrl,
        shotsCount: daBench.players[i].shotsCount,
        followersCount: daBench.players[i].followersCount,
        followingCount: daBench.players[i].followingCount,
        commentsCount: daBench.players[i].commentsCount,
        commentsReceived: daBench.players[i].commentsReceivedCount,
        likesCount: daBench.players[i].likesCount,
        likesReceived: daBench.players[i].likesReceivedCount,
        reboundsCount: daBench.players[i].reboundsCount,
        reboundsReceived: daBench.players[i].reboundsReceivedCount,
        draftees: daBench.players[i].drafteesCount
      });
      // socket.emit('findPlayerBenches', {dribbbleName: daBench.players[i].username, requestor: userId, elem: elemId});
    }
    readyMoreInfos();
    readyRemovePlayers();
  }
  function handlePlayerInfo(id, data){
    var elemId,
      playerHeading = document.getElementsByClassName('player-heading')[0];
    elemId = _.uniqueId();
    if (data.message) {
      playerLists[0].innerHTML += '<h3>' + data.message.toString() + '</h3>';
    } else {
      playerLists[0].innerHTML += playerTemplate({
        name: data.name,
        elemId: elemId,
        draggable: true,
        dribbbleId: data.id,
        draftedBy: data.drafted_by_player_id,
        image: data.avatar_url,
        location: data.location,
        username: data.username,
        twitter: data.twitter_screen_name,
        dribbbleUrl: data.url,
        websiteUrl: data.website_url,
        shotsCount: data.shots_count,
        followersCount: data.followers_count,
        followingCount: data.following_count,
        commentsCount: data.comments_count,
        commentsReceived: data.comments_received_count,
        likesCount: data.likes_count,
        likesReceived: data.likes_received_count,
        reboundsCount: data.rebounds_count,
        reboundsReceived: data.rebounds_received_count,
        draftees: data.draftees_count
      });
      // socket.emit('findPlayerBenches', {dribbbleName: data.players[i].username, requestor: userId, elem: elemId});
      for (i = playerLists[0].children.length - 1; i >= 0; i--) {
        playerLists[0].children[i].addEventListener('drag', playerDrag, false);
      }
      playerHeading.innerHTML = '1 Player';
      readyMoreInfos();
    }
  }
  function handlePlayerAdded(data) {
    var workBench = document.getElementsByClassName('workbench')[0],
      workHeading = workBench.getElementsByClassName('work-heading')[0],
      workActions = workBench.getElementsByClassName('work-actions')[0],
      list = workBench.getElementsByClassName('work-list')[0],
      daBench, elemId;
    for (var i = bbbench.benches.length - 1; i >= 0; i--) {
      if(bbbench.benches[i]._id == data.bench._id) {
        bbbench.benches[i] = data.bench;
        daBench = bbbench.benches[i];
      }
    }
    if (list.dataset.benchId == data.bench._id) {
      workHeading.innerHTML = daBench.title + ' (' + daBench.players.length.toString() + ')';
      list.innerHTML = null;
      for (i = daBench.players.length - 1; i >= 0; i--) {
        elemId = 'working-' + i.toString();
        list.innerHTML += playerTemplate({
          name: daBench.players[i].name,
          elemId: elemId,
          draggable: false,
          captain: daBench.players[i].captain,
          benchCount: daBench.players[i].benchCount,
          dribbbleId: daBench.players[i].dribbbleId,
          draftedBy: daBench.players[i].draftedBy,
          image: daBench.players[i].image,
          location: daBench.players[i].location,
          username: daBench.players[i].dribbbleName,
          twitter: daBench.players[i].twitterName,
          dribbbleUrl: daBench.players[i].url,
          websiteUrl: daBench.players[i].websiteUrl,
          shotsCount: daBench.players[i].shotsCount,
          followersCount: daBench.players[i].followersCount,
          followingCount: daBench.players[i].followingCount,
          commentsCount: daBench.players[i].commentsCount,
          commentsReceived: daBench.players[i].commentsReceivedCount,
          likesCount: daBench.players[i].likesCount,
          likesReceived: daBench.players[i].likesReceivedCount,
          reboundsCount: daBench.players[i].reboundsCount,
          reboundsReceived: daBench.players[i].reboundsReceivedCount,
          draftees: daBench.players[i].drafteesCount
        });
        // socket.emit('findPlayerBenches', {dribbbleName: daBench.players[i].username, requestor: userId, elem: elemId});
      }
      readyMoreInfos();
      readyRemovePlayers();
    }
  }
  function handlePlayerFollowing(id, data){
    var elemId,
      playerHeading = document.getElementsByClassName('player-heading')[0];
    for (i = data.players.length - 1; i >= 0; i--) {
      elemId = 'players-' + i.toString();
      playerLists[0].innerHTML += playerTemplate({
        name: data.players[i].name,
        elemId: elemId,
        draggable: true,
        dribbbleId: data.players[i].id,
        draftedBy: data.players[i].drafted_by_player_id,
        image: data.players[i].avatar_url,
        location: data.players[i].location,
        username: data.players[i].username,
        twitter: data.players[i].twitter_screen_name,
        dribbbleUrl: data.players[i].url,
        websiteUrl: data.players[i].website_url,
        shotsCount: data.players[i].shots_count,
        followersCount: data.players[i].followers_count,
        followingCount: data.players[i].following_count,
        commentsCount: data.players[i].comments_count,
        commentsReceived: data.players[i].comments_received_count,
        likesCount: data.players[i].likes_count,
        likesReceived: data.players[i].likes_received_count,
        reboundsCount: data.players[i].rebounds_count,
        reboundsReceived: data.players[i].rebounds_received_count,
        draftees: data.players[i].draftees_count
      });
      // socket.emit('findPlayerBenches', {dribbbleName: data.players[i].username, requestor: userId, elem: elemId});
      data.players[i].elemId = elemId;
      bbbench.following.push(data.players[i]);
    }
    for (i = playerLists[0].children.length - 1; i >= 0; i--) {
      playerLists[0].children[i].addEventListener('drag', playerDrag, false);
    }
    readyMoreInfos();
    playerHeading.innerHTML = bbbench.following.length.toString() + ' Players';
    if(parseInt(data.page, 10) < (location.hostname == 'localhost' ? 1 : parseInt(data.pages, 10))){
      setTimeout(function(){
        _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum + '&page=' + (parseInt(data.page, 10) + 1).toString(), 'following', handlePlayerFollowing);
      }, 1100);
    } else {
      clearInterval(followingLoader);
      bbbench.followingMap = bbbench.followingMap || createFollowingMap();
    }
  }
  function handlePlayerBenches (data) {
    var players = document.getElementsByClassName('player');
    for (var i = players.length - 1; i >= 0; i--) {
      if(players[i].dataset.dribbbleName == data.name) {
        players[i].dataset.benchCount = data.count;
      }
    }
  }
  function runFollowingLoader () {
    var playerHeading = document.getElementsByClassName('player-heading')[0];
    playerHeading.innerHTML += ' .';
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