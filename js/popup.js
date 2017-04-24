document.addEventListener('DOMContentLoaded', function() {

  var playerList = document.getElementById("playerList");
  var flag = {value: false};
  loadData(flag);

  while(!flag.value) {
    setTimeout(function() {
    }, 200);
  }

  checkAndCreatePlaylist();
  getPlaylist();

  chrome.windows.getAll({populate:true},function(windows){
  windows.forEach(function(window){
    window.tabs.forEach(function(tab){
      var player;
      if (isSupported(tab)) {
        addMCScript(tab);
        player = getPlayer(tab, window.id);
        playerList.appendChild(player);
      }
    });
  });
});

  document.getElementsByTagName("body")[0].appendChild(playerList);
}, false);

// "youtube_buttons" : [
//       {"type": "play", "selector" : [".ytp-button-play", null]},
//       {"type": "pause", "selector" : [".ytp-button-pause", null]},
//       {"type": "next", "selector" : [".ytp-button-next", ".ytp-next-button"]},
//       {"type": "prev", "selector" : [".ytp-button-prev", ".ytp-prev-button"]},
//       {"type": "replay", "selector" : [null, ".ytp-play-button[title='Replay']"]}
//   ]
//
//
//   "button_sequence" : ["prev", "play", "pause", "next", "mute", "unmute", "add-playlist"],
