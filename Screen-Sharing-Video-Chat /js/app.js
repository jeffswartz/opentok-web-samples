/* global OT API_KEY TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

var apiKey;
var sessionId;
var token;
var session;
var screenSharingSubscriberContainer;
var cameraSubscriberContainer;
var publishingScreen = false;
var screenSharingButton = document.getElementById('screen-sharing');
var bigVideoContainer = document.getElementById('big-video');
var smallVideoContainer = document.getElementById('small-video');

// Handling all of our errors here by alerting them
function handleError(error) {
  if (error) {
    alert(error.message);
  }
}

function toggleScreen() {
  if (publishingScreen) {
    session.unpublish(screenPublisher);
  } else  {
    screenSharingButton.disabled = true;
    var screenPublisher = OT.initPublisher('big-video', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      videoSource: 'screen'
    }, function handleInitPublishError(error) {
      if (error) {
        handleError(error);
        screenSharingButton.disabled = false;
        screenSharingButton.innerHTML = 'Share Screen';
        publishingScreen = false;
      } else {
        screenSharingButton.disabled = false;
        screenSharingButton.innerHTML = 'Stop Sharing Screen';
        publishingScreen = true;
      }
    });
    session.publish(screenPublisher, handleError);
    arrangeSubscribers();
    screenPublisher.on('streamDestroyed', function streamDestroyedHandler() {
      publishingScreen = false;
      screenSharingButton.innerHTML = 'Share Screen';
      arrangeSubscribers();
    });
    screenSharingButton.innerHTML = 'Stop Sharing Screen';
  }
}

function arrangeSubscribers() {
  if (publishingScreen) {
    smallVideoContainer.appendChild(cameraSubscriberContainer);
    smallVideoContainer.style.display = 'block';
  } else if (screenSharingSubscriberContainer) {
    if (cameraSubscriberContainer) {
      smallVideoContainer.appendChild(cameraSubscriberContainer);
      smallVideoContainer.style.display = 'block';
    } else {
      smallVideoContainer.style.display = 'none';
    }
    bigVideoContainer.appendChild(screenSharingSubscriberContainer);
  } else {
    if (cameraSubscriberContainer) {
      bigVideoContainer.appendChild(cameraSubscriberContainer);
    }
    smallVideoContainer.style.display = 'none';
  }
}

function initializeSession() {
  session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function streamCreated(event) {
    var container =  document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'absolute';
    session.subscribe(event.stream, container, {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    }, handleError);
    if (event.stream.videoType === 'screen') {
      screenSharingSubscriberContainer = container;
    } else {
      cameraSubscriberContainer = container;
    }
    arrangeSubscribers();
  });

  session.on('streamDestroyed', function streamDestroyed(event) {
    if (event.stream.videoType === 'screen') {
      screenSharingSubscriberContainer = null;
    } else {
      cameraSubscriberContainer = null;
    }
    arrangeSubscribers();
  });

  // Create a publisher
  var publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);

  // Check whether screen sharing is possible. If possible, display the Share Screen button
  OT.checkScreenSharingCapability(function checkScreenSharingCapability(response) {
    if (!response.supported || response.extensionRegistered === false) {
      alert('screen sharing not supported');
    } else if (response.extensionInstalled === false) {
      alert('screen sharing extension required, please install one to share your screen');
    } else {
      screenSharingButton.style.display = 'block';
    }
  });

  // Connect to the session
  session.connect(token, function callback(error) {
    // If the connection is successful, publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);

      screenSharingButton.disabled = false;

      // When the Share Screen button is pressed, call toggleScreen
      screenSharingButton.addEventListener('click', toggleScreen);
    }
  });
}

// See the config.js file.
if (API_KEY && TOKEN && SESSION_ID) {
  apiKey = API_KEY;
  sessionId = SESSION_ID;
  token = TOKEN;
  initializeSession();
} else if (SAMPLE_SERVER_BASE_URL) {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session').then(function fetch(res) {
    return res.json();
  }).then(function fetchJson(json) {
    apiKey = json.apiKey;
    sessionId = json.sessionId;
    token = json.token;

    initializeSession();
  }).catch(function catchErr(error) {
    handleError(error);
    alert('Failed to get opentok sessionId and token. Make sure you have updated the config.js file.');
  });
}
