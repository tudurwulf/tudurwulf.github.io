(function (doc, $) {
  'use strict';

  var timeoutID,
      state, // fresh | playing | paused | stopped

      totalStart,
      playStart,
      pauseStart,
      lapStart,
      ckpStart,

      playSum,
      pauseSum,
      lapSum,
      ckpSum,

      pauseNo,
      lapNo,
      ckpNo,

      lapCancelled,

      $total,
      $play,
      $pause,
      $ratio,
      $lap,
      $ckp,
      $stats,
      $statsBody,
      $revStatsOrder;

  function init() {

    resetState();

    $total = $('#total').find('dd');
    $play = $('#play').find('dd');
    $pause = $('#pause').find('dd');
    $ratio = $('#ratio');
    $lap = $('#lap').find('dd');
    $ckp = $('#ckp').find('dd');
    $stats = $('#stats');
    $statsBody = $stats.find('tbody');
    $revStatsOrder = $('#revStatsOrder');

    // Bind keys
    $(doc).keydown(function(e) {
      switch (e.which) {
        case 32: // SPACE
          playPause();
          return false;
        case  9: // TAB
          recCkp();
          return false;
        case 13: // ENTER
          recLap();
          return false;
        case 27: // ESC
          stopReset();
          return false;
      }
    });

    // Bind buttons
    $('#stopResetButton').mousedown(stopReset);
    $('#lapButton').mousedown(recLap);
    $('#ckpButton').mousedown(recCkp);
    $('#playPauseButton').mousedown(playPause);
    $revStatsOrder.click(revStatsOrder);
  }

  function resetState() {
    playSum  =
    pauseSum =
    lapSum   =
    ckpSum   = 0;

    pauseNo =
    lapNo   =
    ckpNo   = 0;

    lapCancelled = false;

    state = 'fresh';
  }

  function run() {
    updateTimers( new Date() );
    timeoutID = setTimeout(run, 100);
  }

  function updateTimers(now, tEventName, tEventNo) {
    var total,
        fTotal,
        play,
        fPlay,
        pause,
        fPause,
        lap,
        fLap,
        ckp,
        fCkp,
        timestamp,
        row;

    if (state == 'playing') {
      total = now - totalStart;
      play = now - playStart + playSum;
      pause = pauseSum;
      lap = now - lapStart + lapSum;
      ckp = now - ckpStart + ckpSum;
    } else if (state == 'paused') {
      total = now - totalStart;
      play = playSum;
      pause = now - pauseStart + pauseSum;
      lap = lapSum;
      ckp = ckpSum;
    } else if (state == 'fresh') {
      total = play = pause = lap = ckp = 0;
    }

    fTotal = formatTime(total);
    fPlay = formatTime(play);
    fPause = formatTime(pause);
    fLap = formatTime(lap);
    fCkp = formatTime(ckp);

    $total.html( fTotal.slice(0, -2) );
    $play.html( fPlay.slice(0, -2) );

    // Remove decimals and set playtime as document title so it will be visible
    // in the browser's tabbar and desktop environment's taskbar
    //
    // NOTE
    //   When a tab is out of focus, setTimeout is called only once per second;
    //   thus, displaying decimals in the document title would make the app
    //   seem broken.
    doc.title = fPlay.slice(0, -4);

    $pause.html( fPause.slice(0, -2) );

    // The `|| 100` is needed only for the first run, when `total` can be 0.
    $ratio.html(Math.round( (play * 100 / total) || 100 ) + '%');

    $lap.html( fLap.slice(0, -2) );
    $ckp.html( fCkp.slice(0, -2) );

    if (tEventName) {

      timestamp =          now.getFullYear()                 + '-' +
                  ( '0'  + now.getMonth()        ).slice(-2) + '-' +
                  ( '0'  + now.getDate()         ).slice(-2) + ' ' +

                  ( '0'  + now.getHours()        ).slice(-2) + ':' +
                  ( '0'  + now.getMinutes()      ).slice(-2) + ':' +
                  ( '0'  + now.getSeconds()      ).slice(-2) + '.' +
                  ( '00' + now.getMilliseconds() ).slice(-3);

      row = '<tr class=' + tEventName + '>' +
              '<td>' + timestamp + '</td>' +
              '<td>' + tEventName + (tEventNo ? ' ' + tEventNo : '') + '</td>' +
              '<td>' + fCkp + '</td>' +
              '<td>' + fLap + '</td>' +
              '<td>' + fPlay + '</td>' +
              '<td>' + fPause + '</td>' +
              '<td>' + fTotal + '</td>' +
            '</tr>';

      // If paused, then insert a checkpoint or lap below the pause row
      if (state == 'paused' && (tEventName == 'CKP' || tEventName == 'LAP'))
        $statsBody.find('tr:first').after(row);
      // Otherwise, insert the row at the very top
      else
        $statsBody.prepend(row);
    }
  }

  // 4160527 -> 1:09:20.527
  function formatTime(ms) {
    var h, m, s;

    h = Math.floor(ms / 3600000);
    ms = ms % 3600000;

    m = Math.floor(ms / 60000);
    ms = ms % 60000;

    s = ms / 1000;

    m = ('0' + m).slice(-2);
    s = ( '0' + s.toFixed(3) ).slice(-6);

    return h + ':' + m + ':' + s;
  }

  function playPause() {
    if (state == 'stopped') return;

    var now = new Date();

    if (state == 'fresh') {

      totalStart = playStart = lapStart = ckpStart = now;

      $stats.css('visibility', 'visible');
      updateTimers(now, 'START');

      state = 'playing';

    } else if (state == 'playing') {

      clearTimeout(timeoutID);
      updateTimers(now, 'PAUSE', ++pauseNo);

      playSum += now - playStart;
      lapSum += now - lapStart;
      ckpSum += now - ckpStart;

      pauseStart = now;

      state = 'paused';

    } else if (state == 'paused') {

      clearTimeout(timeoutID);
      updateTimers(now, 'PLAY');

      pauseSum += now - pauseStart;
      playStart = lapStart = ckpStart = now;
      lapCancelled = false;

      state = 'playing';
    }

    run();
  }

  function recCkp() {
    if (
      (state == 'fresh' || state == 'stopped') ||
      (state == 'paused' && ckpSum === 0)
    ) return;

    var now = new Date();

    if (state == 'playing')
      updateTimers(now, 'CKP', ++ckpNo);
    else if (state == 'paused')
      updateTimers(pauseStart, 'CKP', ++ckpNo);

    ckpSum = 0;
    ckpStart = now;
    updateTimers(now);
  }

  function recLap() {
    if (
      (state == 'fresh' || state == 'stopped') ||
      (lapCancelled === true)
    ) return;

    var now = new Date();

    if (state == 'playing') {

      updateTimers(now, 'LAP', ++lapNo);

    // If paused and no and no lap was recorded during this time, then record a
    // lap with the pause's timestamp
    } else if (state == 'paused' && lapSum > 0) {

      // If a checkpoint was recorded during pause, then remove it. (It wouldn't
      // make sense to have a checkpoint and a lap with the same timestamp.)
      if (ckpSum === 0)

        // The row will be located after the last pause event, thus the 2nd
        // row from top
        $statsBody.find('tr:nth-child(2)').remove();

      updateTimers(pauseStart, 'LAP', ++lapNo);

    // If paused and a lap was already recorded during this time, then cancel it
    } else if (state == 'paused' && lapSum === 0) {

      lapNo--;
      $statsBody.find('tr:nth-child(2)').addClass('cancelled');
      lapCancelled = true;
    }

    lapSum = ckpSum = 0;
    lapStart = ckpStart = now;
    ckpNo = 0;
    updateTimers(now);
  }

  function stopReset() {
    var now = new Date();

    if (state == 'playing' || state == 'paused') {

      clearTimeout(timeoutID);
      updateTimers(now, 'FINISH');

      $revStatsOrder.css('visibility', 'visible');

      state = 'stopped';

    } else if (state == 'stopped') {

      $total.html( '0:00:00.0' );
      $play.html(  '0:00:00.0' );
      doc.title =  '0:00:00'    ;
      $pause.html( '0:00:00.0' );
      $ratio.html( '100%'      );
      $lap.html(   '0:00:00.0' );
      $ckp.html(   '0:00:00.0' );

      $revStatsOrder.css('visibility', 'hidden');
      $stats.css('visibility', 'hidden');
      $statsBody.empty();

      resetState();
    }
  }

  // Reverses the row order of statistics (ORDER BY timestamp ASC/DESC)
  function revStatsOrder() {
    var rows = $statsBody.find('tr').get();

    $statsBody.empty();

    for (var i = rows.length - 1; i >= 0; i--) {
      $statsBody.append(rows[i]);
    }
  }

  $(init);

})(document, jQuery);
