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
    activeString = 'active',
    playerTemplate = _.template([
      '<div id="<%= elemId %>" class="player<%= draggable ?  \'\' : \' no-drag\'%>" draggable="<%= draggable.toString() %>" data-dribbble-id="<%= dribbbleId %>" data-dribbble-name="<%= username %>">',
        '<span class="likes" style="display:none;"><%= likesReceived %></span>',
        '<div class="player-main">',
          '<div class="player-pic">',
            '<img class="player-img" src="<%= image %>" title="<%= name %>" alt="<%= name %>" draggable="false" />',
          '</div>',
          '<div class="player-basics">',
            '<div class="lead name"><%= name %>',
              '<% if (!draggable) { %>',
                '<span title="<%= captain ? \'I am the captain of this bench.\' : \'Make me captain!\' %>" class="icon-<%= captain ? \'star\' : \'star2\' %> captain-button" data-captain-status="<%= captain ? \'1\' : \'0\' %>"></span>',
              '<% } %>',
            '</div>',
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
                '<a class="remove-button" title="Remove <%= name %>" data-elem-id="<%= elemId %>"><span class="icon-cross2"></span></a>',
              '<% } %>',
              '<% if (draggable) { %>',
                '<a class="add-button" title="Add <%= name %>" data-elem-id="<%= elemId %>"><span class="icon-plus2"></span></a>',
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
          '<div class="latest text-center">',
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
      ].join('')),
    latestShotTemplate = _.template([
      '<a href="<%= imgLink %>" target="_blank" class="latest-img-link" title="<%= imgTitle %>">',
        '<h4>Latest Shot</h4>',
        '<span class="latest-img-wrap">',
          '<img src="<%= imgUrl %>" class="latest-img"/>',
          '<span class="latest-img-views"><span class="icon-eye"></span> <%= imgViews %></span>',
          '<span class="latest-img-comments"><span class="icon-comment"></span> <%= imgComments %></span>',
          '<span class="latest-img-likes"><span class="icon-heart"></span> <%= imgLikes %></span>',
        '</span>',
      '</a>'
      ].join('')),
    messageTemplate = _.template([
      '<p class="pull-center message">',
        '<a onclick="dismissAlert(this.parentNode.parentNode);" class="dismiss-alert"><span class="icon-cross"></span></a>',
        '<%= message %>',
      '</p>'
      ].join('')),
    errorTemplate = _.template([
      '<p class="pull-center error">',
        '<a onclick="dismissAlert(this.parentNode.parentNode);" class="dismiss-alert"><span class="icon-cross"></span></a>',
        '<%= error %>',
      '</p>'
      ].join(''));
  bbbench.uid = userId;
  bbbench.dribbbleId = dribbbleId;
  bbbench.following = [];

// logic
  if (dribbbleId && userId && isHome) {
    _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum, dribbbleId, handlePlayerFollowing);
    socket.on('foundPlayerBenches', handlePlayerBenches);
    socket.on('addedPlayersToBench', handlePlayerAdded);
    socket.on('madeBenchCaptain', generalAlert);
    socket.on('removedBenchCaptain', generalAlert);
    readyBenchLinks(benchLinks);
    readySorters(playerSorters, workSorters);
    addAnyone[0].addEventListener('click', handleAnyone, false);
    whoIFollow[0].addEventListener('click', handleWhoIFollow, false);
    if (benchLinks.length > 0) {
      fakeClick(benchLinks[0]);
    }
  }
  updateCycle();

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
        if (player && daBench) {
          socket.emit('addPlayersToBench', {players: [player], bench: daBench._id});
        } else{
          generalAlert({error: 'There seems to be an error with that. Maybe you should try refreshing the page?'});
        }
      }else{
        generalAlert({error: 'Already present!'});
      }
    }
    bbbench.draggard = [];
  }
  function workListAdd (evt) {
    evt.preventDefault();
    var dribbbleId = parseInt(document.getElementById(this.dataset.elemId).dataset.dribbbleId, 10),
      notYet = true,
      daBench = _.find(bbbench.benches, {'_id': document.getElementsByClassName('work-list')[0].dataset.benchId}),
      workerPlayers = daBench.players,
      player = _.find(bbbench.following, {'id': dribbbleId});
    for (i = workerPlayers.length - 1; i >= 0; i--) {
      if(parseInt(workerPlayers[i].dribbbleId, 10) == dribbbleId){
        notYet = false;
      }
    }
    if(notYet) {
      if (player && daBench) {
        socket.emit('addPlayersToBench', {players: [player], bench: daBench._id});
        generalAlert({message: 'Adding ' + player.name + ' to ' + daBench.title + '.'});
      } else{
        generalAlert({error: 'There seems to be an error with that. Maybe you should try refreshing the page?'});
      }
    }else{
      generalAlert({error: 'Already present!'});
    }
  }
  function playerDrag (evt) {
    bbbench.draggard = [parseInt(evt.target.dataset.dribbbleId, 10)];
  }
  function readyRemovePlayers () {
    var removePlayers = document.getElementsByClassName('remove-button'),
      captainButtons = document.getElementsByClassName('captain-button');
    for (var i = removePlayers.length - 1; i >= 0; i--) {
      removePlayers[i].addEventListener('click', removePlayer, false);
    }
    for (i = captainButtons.length - 1; i >= 0; i--) {
      captainButtons[i].addEventListener('click', switchCaptain, false);
    }
  }
  function switchCaptain (evt) {
    var playerElem = this.parentNode.parentNode.parentNode.parentNode,
      dribbbleId = playerElem.dataset.dribbbleId,
      dribbbleName = playerElem.dataset.dribbbleName,
      workList = document.getElementsByClassName('work-list')[0],
      benchId = workList.dataset.benchId,
      daBench = _.find(bbbench.benches, {'_id': benchId}),
      player = _.find(daBench.players, {'dribbbleId': dribbbleId}),
      captainButtons = document.getElementsByClassName('captain-button'),
      emitObj = {bench: benchId, player: player, elemId: playerElem.id},
      captainStatus = this.dataset.captainStatus;
    if(benchId && player){
      if (captainStatus == '0') {
        socket.emit('setBenchCaptain', emitObj);
      } else if(captainStatus == '1'){
        socket.emit('removeBenchCaptain', emitObj);
      }
    } else{
      generalAlert({error: 'There seems to be an error with that. Maybe you should try refreshing the page?'});
    }
    for (var i = captainButtons.length - 1; i >= 0; i--) {
      captainButtons[i].className = 'icon-star2 captain-button';
      captainButtons[i].dataset.captainStatus = '0';
    }
    if(benchId && player && (captainStatus == '0')){
      this.className = 'icon-star captain-button';
      this.dataset.captainStatus = '1';
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
    if(benchId && player){
      socket.emit('removePlayerFromBench', {bench: benchId, player: player});
    } else{
      generalAlert({error: 'There seems to be an error with that. Maybe yout should try refreshing the page?'});
    }
    playerElem.parentNode.removeChild(playerElem);
    for (var i = daBench.players.length - 1; i >= 0; i--) {
      if(daBench.players[i].dribbbleId == dribbbleId) {
        daBench.players.splice(i, 1);
      }
    }
  }
  function readyMoreInfos () {
    var moreInfos = document.getElementsByClassName('more-info-button'),
        addBtns = document.getElementsByClassName('add-button');
    for (var i = moreInfos.length - 1; i >= 0; i--) {
      moreInfos[i].addEventListener('click', showPlayerCard, false);
    }
    for (i = 0; i < addBtns.length; i++) {
      addBtns[i].addEventListener('click', workListAdd, false);
    }
  }
  function showPlayerCard (evt) {
    var spanClass = this.children[0].className,
      card = this.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('player-card')[0];
    if (spanClass == 'icon-arrow-down5') {
      this.children[0].className = 'icon-arrow-up5';
      card.style.display = 'block';
      _.asyncRequest(playerShotsUrl(card.parentNode.dataset.dribbbleId) + addendum, card.parentNode.id, handlePlayerLatest);
    } else {
      this.children[0].className = 'icon-arrow-down5';
      card.style.display = 'none';
    }
  }
  function handlePlayerLatest (id, data) {
    var player = document.getElementById(id),
      enough = (data.shots.length > 0),
      imgUrl = enough ? data.shots[0].image_teaser_url : '',
      imgLink = enough ? data.shots[0].url : '',
      imgTitle = enough ? data.shots[0].title : '',
      imgViews = enough ? data.shots[0].views_count : '',
      imgLikes = enough ? data.shots[0].likes_count : '',
      imgComments = enough ? data.shots[0].comments_count : '',
      latestDiv = player.getElementsByClassName('player-card')[0].getElementsByClassName('latest')[0];
    latestDiv.innerHTML = latestShotTemplate({
      imgLink: imgLink,
      imgTitle: imgTitle,
      imgUrl: imgUrl,
      imgViews: imgViews,
      imgComments: imgComments,
      imgLikes: imgLikes
    });
  }
  function readySorters (playerSorters, workSorters) {
    for (var i = playerSorters.length - 1; i >= 0; i--) {
      playerSorters[i].addEventListener('click', sortPlayers, false);
    }
    for (i = workSorters.length - 1; i >= 0; i--) {
      if(!workSorters[i].dataset.showing) {
        workSorters[i].addEventListener('click', sortWork, false);
      } else {
        workSorters[i].addEventListener('click', clickWorkListLatest, false);
      }
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
      classie.remove(playerSorters[i], activeString);
    }
    classie.remove(document.getElementsByClassName('add-anyone')[0], activeString);
    classie.add(this, activeString);
    playerLists[0].innerHTML = null;
    for (i = placeGroup.length - 1; i >= 0; i--) {
      elemId = 'players-' + i.toString();
      tempHTML.push(makeAlienPlayerTemplate(placeGroup[i], elemId, true, false));
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
      classie.remove(workSorters[i], activeString);
    }
    if(workList.dataset.benchId){
      classie.add(this, activeString);
      workList.innerHTML = null;
      for (i = daBench.players.length - 1; i >= 0; i--) {
        elemId = 'working-' + i.toString();
        workList.innerHTML += makeLocalPlayerTemplate(daBench.players[i], elemId, false);
        // socket.emit('findPlayerBenches', {dribbbleName: daBench.players[i].username, requestor: userId, elem: elemId});
      }
      readyMoreInfos();
      readyRemovePlayers();
    }
  }
  function clickWorkListLatest (evt) {
    evt.preventDefault();
    var workList = document.getElementsByClassName('work-list')[0],
      daBench = _.find(bbbench.benches, {'_id': workList.dataset.benchId}),
      elemId,
      workSorters = document.getElementsByClassName('work-sorter'),
      alreadyFetched;
    for (var i = workSorters.length - 1; i >= 0; i--) {
      classie.remove(workSorters[i], activeString);
    }
    if(workList.dataset.benchId){
      if (this.dataset.showing == 'latest') {
        workList.innerHTML = null;
        classie.remove(this, activeString);
        this.innerHTML = 'Latest Shots';
        this.dataset.showing = 'players';
        for (i = 0; i < benchLinks.length; i++) {
          if (benchLinks[i].dataset.benchId == workList.dataset.benchId) {
            fakeClick(benchLinks[i]);
          }
        }
      } else if (!bbbench.gettingLatestBench) {
        workList.innerHTML = null;
        classie.add(this, activeString);
        this.dataset.showing = 'latest';
        this.innerHTML = 'Latest Shots <span class="icon-cross"></span>';
        alreadyFetched = _.find(bbbench.fetchedLatest, {'_id': daBench._id});
        if (!alreadyFetched) {
          fetchBenchLatest(daBench, daBench._id, workList);
        } else {
          printBenchLatest(daBench, daBench._id, workList);
        }
      } else {
        generalAlert({error: 'It seems you are already fetching a bench\'s latest shots. Mind waiting a tick for that to finish?'});
      }
    }
  }
  function fetchBenchLatest(daBench, benchId, workList) {
    var elemId, i;
    bbbench.gettingLatestBench = {
      _id: benchId,
      count: daBench.players.length,
      total: daBench.players.length,
      workList: workList
    };
    bbbench.fetchedLatest = bbbench.fetchedLatest || [];
    bbbench.fetchedLatest.push({
      _id: benchId, 
      shots: []
    });
    document.getElementById('bench-load').style.height = '3px';
    for (i = 0; i < daBench.players.length; i++) {
      elemId = 'latest-' + i.toString();
      setTimeout(_.asyncRequest, i * 1100, playerShotsUrl(daBench.players[i].dribbbleId) + addendum, elemId, handleBenchLatest);
    }
  }
  function handleBenchLatest(id, data) {
    var i,
      fetchingBench = _.find(bbbench.fetchedLatest, {'_id': bbbench.gettingLatestBench._id}),
      shot = data.shots.length > 0 ? data.shots[0] : null,
      benchLoad = document.getElementById('bench-load');
    if (shot) {
      fetchingBench.shots.push(shot);
      printBenchShot(shot, id, fetchingBench, bbbench.gettingLatestBench.workList);
    }
    bbbench.gettingLatestBench.count--;
    benchLoad.title = benchLoad.style.width = (((bbbench.gettingLatestBench.total - bbbench.gettingLatestBench.count) / (bbbench.gettingLatestBench.total * 1.0)) * 100).toString() + '%';
    if (bbbench.gettingLatestBench.count === 0) {
      bbbench.gettingLatestBench = null;
      benchLoad.style.width = '100%';
      benchLoad.style.height = '0px';
    }
  }
  function printBenchLatest(daBench, benchId, workList) {
    var i, elemId,
      fetchingBench = _.find(bbbench.fetchedLatest, {'_id': benchId});
    for (i = 0; i < fetchingBench.shots.length; i++) {
      elemId = 'latest-' + i.toString();
      printBenchShot(fetchingBench.shots[i], elemId, fetchingBench, workList);
    }
  }
  function printBenchShot(shot, id, fetchingBench, workList) {
    console.log(shot, id, fetchingBench, workList);
  }
  function handleAnyone (evt) {
    evt.preventDefault();
    var person = prompt("Please enter a Dribbble player's username:","Harry Potter"),
      playerList = document.getElementsByClassName('player-list')[0];
    if (person!==null) {
      playerList.innerHTML = null;
      classie.add(this, activeString);
      classie.remove(document.getElementsByClassName('who-i-follow')[0], activeString);
      _.asyncRequest(playerInfoUrl(person) + addendum, 'info', handlePlayerInfo);
    }
  }
  function handleWhoIFollow (evt) {
    evt.preventDefault();
    classie.add(this, activeString);
    classie.remove(document.getElementsByClassName('add-anyone')[0], activeString);
    var placeGroup = bbbench.following,
      elemId, 
      tempHTML = [],
      playerSorters = document.getElementsByClassName('player-sorter');
    for (var i = playerSorters.length - 1; i >= 0; i--) {
      classie.remove(playerSorters[i], activeString);
    }
    playerLists[0].innerHTML = null;
    for (i = placeGroup.length - 1; i >= 0; i--) {
      elemId = 'players-' + i.toString();
      tempHTML.push(makeAlienPlayerTemplate(placeGroup[i], elemId, true, false));
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
        classie.remove(benchLinks[i], activeString);
      }
    }
    list.innerHTML = null;
    list.dataset.benchId = '';
    workHeading.innerHTML = '<span class="muted">Select a bench</span>';
    workActions.style.display = 'none';
  }
  function fakeClick(anchorObj) {
    if (anchorObj.click) {
      anchorObj.click();
    } else if(document.createEvent) {
      var evt = document.createEvent("MouseEvents"); 
      evt.initMouseEvent("click", true, true, window, 
          0, 0, 0, 0, 0, false, false, false, false, 0, null); 
      var allowDefault = anchorObj.dispatchEvent(evt);
      // you can check allowDefault for false to see if
      // any handler called evt.preventDefault().
      // Firefox will *not* redirect to anchorObj.href
      // for you. However every other browser will.
    }
  }
  function readyWorkBench (evt) {
    evt.preventDefault();
    var id = this.dataset.benchId,
      name = this.textContent,
      currentBtn = document.getElementsByClassName('current-bench-button')[0],
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
      classie.remove(benchLinks[i], activeString);
    }
    classie.add(this, activeString);
    workHeading.innerHTML = daBench.title + ' (' + daBench.players.length.toString() + ')';
    currentBtn.innerHTML = daBench.title + '<span class="icon-arrow-down4"></span>';
    workActions.style.display = 'block';
    workActions.children[0].href = '/bench/' + daBench._id;
    workActions.children[1].href = '/bench/' + daBench._id + '/edit';
    list.dataset.benchId = daBench._id;
    list.innerHTML = null;
    for (i = daBench.players.length - 1; i >= 0; i--) {
      elemId = 'working-' + i.toString();
      list.innerHTML += makeLocalPlayerTemplate(daBench.players[i], elemId, false);
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
      playerLists[0].innerHTML += makeAlienPlayerTemplate(data, elemId, true, false);
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
        list.innerHTML += makeLocalPlayerTemplate(daBench.players[i], elemId, false);
        // socket.emit('findPlayerBenches', {dribbbleName: daBench.players[i].username, requestor: userId, elem: elemId});
      }
      readyMoreInfos();
      readyRemovePlayers();
    }
  }
  function handlePlayerFollowing(id, data){
    var elemId, dumbArray = [],
      followingLoad = document.getElementById('following-load'),
      playerHeading = document.getElementsByClassName('player-heading')[0];
    followingLoad.title = followingLoad.style.width = ((parseInt(data.page, 10) / parseFloat(data.pages)) * 100).toString() + '%';
    for (i = data.players.length - 1; i >= 0; i--) {
      elemId = 'players-' + i.toString();
      dumbArray.push(makeAlienPlayerTemplate(data.players[i], elemId, true, false));
      // socket.emit('findPlayerBenches', {dribbbleName: data.players[i].username, requestor: userId, elem: elemId});
      data.players[i].elemId = elemId;
      socket.emit('updatePlayer', data.players[i]);
      bbbench.following.push(data.players[i]);
    }
    playerLists[0].innerHTML += dumbArray.join('');
    for (i = playerLists[0].children.length - 1; i >= 0; i--) {
      playerLists[0].children[i].addEventListener('drag', playerDrag, false);
    }
    readyMoreInfos();
    if(parseInt(data.page, 10) < (location.hostname == 'localhost' ? 2 : parseInt(data.pages, 10))){
      setTimeout(function(){
        _.asyncRequest(playerFollowingUrl(dribbbleId) + addendum + '&page=' + (parseInt(data.page, 10) + 1).toString(), 'following', handlePlayerFollowing);
      }, 1100);
    } else {
      followingLoad.style.backgroundColor = 'transparent';
      followingLoad.style.width = '100%';
      followingLoad.style.height = '0px';
      playerHeading.innerHTML = bbbench.following.length.toString() + ' Players';
      bbbench.followingMap = bbbench.followingMap || createFollowingMap();
    }
  }
  function makeLocalPlayerTemplate(data, elem, draggable) {
    return playerTemplate({
      name: data.name,
      elemId: elem,
      draggable: draggable,
      captain: data.captain,
      benchCount: data.benchCount,
      dribbbleId: data.dribbbleId,
      draftedBy: data.draftedBy,
      image: data.image,
      location: data.location,
      username: data.dribbbleName,
      twitter: data.twitterName,
      dribbbleUrl: data.url,
      websiteUrl: data.websiteUrl,
      shotsCount: data.shotsCount,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
      commentsCount: data.commentsCount,
      commentsReceived: data.commentsReceivedCount,
      likesCount: data.likesCount,
      likesReceived: data.likesReceivedCount,
      reboundsCount: data.reboundsCount,
      reboundsReceived: data.reboundsReceivedCount,
      draftees: data.drafteesCount
    });
  }
  function makeAlienPlayerTemplate(data, elem, draggable, captain) {
    return playerTemplate({
      name: data.name,
      elemId: elem,
      draggable: draggable,
      captain: captain,
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
  }
  function handlePlayerBenches (data) {
    var players = document.getElementsByClassName('player');
    for (var i = players.length - 1; i >= 0; i--) {
      if(players[i].dataset.dribbbleName == data.name) {
        players[i].dataset.benchCount = data.count;
      }
    }
  }
  function generalAlert (data) {
    var messageElem = document.getElementById('messages'),
      wrapper = messageElem.children[0];
    if (data.error) {
      wrapper.innerHTML = errorTemplate({error: data.error});
    } else if (data.message) {
      wrapper.innerHTML = messageTemplate({message: data.message});
    }
    messageElem.style.display = 'block';
  }
  function updateCycle () {
    var list = document.getElementsByClassName('player no-drag'),
      newA = [];
    for (var i = list.length - 1; i >= 0; i--) {
      newA.push({dribbbleId: list[i].dribbbleId, elemId: list[i].id});
    }
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