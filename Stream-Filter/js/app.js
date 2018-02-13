/* global OT */

  var apiKey;
  var sessionId;
  var token;
  var publisher;

  function handleError(error) {
    if (error) {
      console.error('Received an error', error);
    }
  }
  exports.handleError = handleError;

  function initializeSession() {
    var session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on('streamCreated', function streamCreated(event) {
      var subscriberOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      };
      session.subscribe(event.stream, 'subscriber', subscriberOptions, handleError);
    });

    session.on('sessionDisconnected', function sessionDisconnected(event) {
      console.log('You were disconnected from the session.', event.reason);
    });

    // Connect to the session
    session.connect(token, function callback(error) {
      if (error) {
        handleError(error);
      } else {
        // If the connection is successful, initialize a publisher and publish to the session
        session.publish(publisher, function(error) {
          debugger;
        });
      }
    });
  }

    // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
    fetch('https://swartz-learning-ot-php.herokuapp.com/session').then(function fetchThen(res) {
      return res.json();
    }).then(function jsonThen(json) {
      apiKey = json.apiKey;
      sessionId = json.sessionId;
      token = json.token;

      var audioCtx = new AudioContext();
      var source = audioCtx.createMediaStreamDestination();
      var mediaStream = source.stream;
      var oscillator = audioCtx.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(2, audioCtx.currentTime);
      oscillator.connect(audioCtx.destination);
      //oscillator.start();
      var gainNode = audioCtx.createGain();
      source.connect(gainNode);
      gainNode.gain.value = 0;
      gainNode.connect(audioCtx.destination);

      var audioTrack = mediaStream.getAudioTracks()[0];
      var publisherOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        // Pass in the canvas stream video track as our custom videoSource
        videoSource: null,
        // Pass in the audio track from our the mediaStream with a delay effect added
        audioSource: audioTrack
      };
      publisher = OT.initPublisher('publisher', publisherOptions, function initComplete(err) {
        if (err) {
          console.error(err);
        } else {
          initializeSession()
        }
      });

    }).catch(function catchErr(error) {
      handleError(error);
      alert('Failed to get opentok sessionId and token. Make sure you have updated the config.js file.');
    });
