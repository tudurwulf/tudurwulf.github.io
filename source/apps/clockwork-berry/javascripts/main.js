(function (doc, $) {
  'use strict';

  var timeoutID,
      state, // fresh | playing | inTimeout | stopped

      totalStart,
      playStart,
      timeoutStart,
      lapStart,
      ckpStart,

      playSum,
      timeoutSum,
      lapSum,
      ckpSum,

      timeoutNo,
      lapNo,
      ckpNo,

      $total,
      $play,
      $timeout,
      $ratio,
      $lap,
      $ckp,
      $stats,
      $statsBody;

  function init() {
    state = 'fresh';

    playSum    =
    timeoutSum =
    lapSum     =
    ckpSum     = 0;

    timeoutNo =
    lapNo     =
    ckpNo     = 0;

    $total = $('#total').find('dd');
    $play = $('#play').find('dd');
    $timeout = $('#timeout').find('dd');
    $ratio = $('#ratio');
    $lap = $('#lap').find('dd');
    $ckp = $('#ckp').find('dd');
    $stats = $('#stats');
    $statsBody = $stats.find('tbody');

    // Bind keys
    $(doc).keydown(function(e) {
      switch (e.which) {
        case 32: // SPACE
          playTimeout();
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
    $('#playTimeoutButton').mousedown(playTimeout);
  }

  function run() {
    updateTimers( new Date() );
    timeoutID = setTimeout(run, 100);
  }

  function updateTimers(now, printStats, tEvent, tEventNo) {
    var total,
        fTotal,
        play,
        fPlay,
        timeout,
        fTimeout,
        lap,
        fLap,
        ckp,
        fCkp,
        timestamp;

    if (state == 'playing') {
      total = now - totalStart;
      play = now - playStart + playSum;
      timeout = timeoutSum;
      lap = now - lapStart + lapSum;
      ckp = now - ckpStart + ckpSum;
    } else if (state == 'inTimeout') {
      total = now - totalStart;
      play = playSum;
      timeout = now - timeoutStart + timeoutSum;
      lap = lapSum;
      ckp = ckpSum;
    } else if (state == 'fresh') {
      total = play = timeout = lap = ckp = 0;
    }

    fTotal = formatTime(total);
    fPlay = formatTime(play);
    fTimeout = formatTime(timeout);
    fLap = formatTime(lap);
    fCkp = formatTime(ckp);

    $total.html( fTotal.slice(0, -2) );
    $play.html( fPlay.slice(0, -2) );
    // Remove decimals and set document title
    // NOTE When a tab is out of focus setTimeout is called only once a second,
    //      thus displaying decimals in the document title wouldn't make sense.
    doc.title = fPlay.slice(0, -4);
    $timeout.html( fTimeout.slice(0, -2) );
    // The `|| 100` is needed only for the first run, when `total` can be 0.
    $ratio.html(Math.round( (play * 100 / total) || 100 ) + '%');
    $lap.html( fLap.slice(0, -2) );
    $ckp.html( fCkp.slice(0, -2) );

    if (printStats) {

      timestamp =          now.getFullYear()                 + '-' +
                  ( '0'  + now.getMonth()        ).slice(-2) + '-' +
                  ( '0'  + now.getDate()         ).slice(-2) + ' ' +

                  ( '0'  + now.getHours()        ).slice(-2) + ':' +
                  ( '0'  + now.getMinutes()      ).slice(-2) + ':' +
                  ( '0'  + now.getSeconds()      ).slice(-2) + '.' +
                  ( '00' + now.getMilliseconds() ).slice(-3);

      $statsBody.append(
        '<tr class=' + tEvent + '>' +
          '<td>' + timestamp + '</td>' +
          '<td>' + tEvent + (tEventNo ? ' ' + tEventNo : '') + '</td>' +
          '<td>' + fCkp + '</td>' +
          '<td>' + fLap + '</td>' +
          '<td>' + fPlay + '</td>' +
          '<td>' + fTimeout + '</td>' +
          '<td>' + fTotal + '</td>' +
        '</tr>'
      );
    }
  }

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

  function playTimeout() {
    if (state == 'stopped') return;

    var now = new Date();

    if (state == 'fresh') {

      totalStart = playStart = lapStart = ckpStart = now;

      $stats.css('display', 'table');
      updateTimers(now, true, 'START');

      state = 'playing';

    } else if (state == 'playing') {

      clearTimeout(timeoutID);
      updateTimers(now, true, 'TIMEOUT', ++timeoutNo);

      playSum += now - playStart;
      lapSum += now - lapStart;
      ckpSum += now - ckpStart;

      timeoutStart = now;

      state = 'inTimeout';

    } else if (state == 'inTimeout') {

      clearTimeout(timeoutID);
      updateTimers(now, true, 'PLAY');

      timeoutSum += now - timeoutStart;

      playStart = lapStart = ckpStart = now;
      state = 'playing';

    }

    run();
  }

  function recCkp() {
    if (
      (state == 'fresh' || state == 'stopped') ||
      (state == 'inTimeout' && ckpSum === 0)
    ) return;

    var now = new Date();

    if (state == 'playing')
      updateTimers(now, true, 'CHECKPOINT', ++ckpNo);
    else if (state == 'inTimeout')
      updateTimers(timeoutStart, true, 'CHECKPOINT', ++ckpNo);

    ckpSum = 0;
    ckpStart = now;
    updateTimers(now);
  }

  function recLap() {
    if (
      (state == 'fresh' || state == 'stopped') ||
      (state == 'inTimeout' && lapSum === 0)
    ) return;

    var now = new Date();

    if (state == 'playing')
      updateTimers(now, true, 'LAP', ++lapNo);
    else if (state == 'inTimeout')
      updateTimers(timeoutStart, true, 'LAP', ++lapNo);

    lapSum = ckpSum = 0;
    lapStart = ckpStart = now;
    ckpNo = 0;
    updateTimers(now);
  }

  function stopReset() {
    var now = new Date();

    if (state == 'playing' || state == 'inTimeout') {

      clearTimeout(timeoutID);
      updateTimers(now, true, 'FINISH');

      state = 'stopped';

    } else if (state == 'stopped') {

      $total.html(   '0:00:00.0' );
      $play.html(    '0:00:00.0' );
      doc.title =    '0:00:00'    ;
      $timeout.html( '0:00:00.0' );
      $ratio.html(   '100%'      );
      $lap.html(     '0:00:00.0' );
      $ckp.html(     '0:00:00.0' );

      $statsBody.empty();
      $stats.css('display', 'none');

      playSum    =
      timeoutSum =
      lapSum     =
      ckpSum     = 0;

      timeoutNo =
      lapNo     =
      ckpNo     = 0;

      state = 'fresh';

    }
  }

  $(init);

})(document, jQuery);
