/* global OT Promise */
// This file exposes a publish function on window which when called returns a Promise to
// an OpenTok Publisher. The Publisher returned uses a custom videoSource while applies the
// currently selected video filter.

// Draws a video to a canvas and applies the selected video filter

(function closure(exports) {
  // Returns a Promise to a Publisher
  var publish = function publish() {
    return new Promise(function promise(resolve, reject) {
      var audioSource = exports.AudioFilters.getToneTrack();

      var publisherOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        // Pass in the canvas stream video track as our custom videoSource
        videoSource: null,
        // Pass in the audio track from our the mediaStream with a delay effect added
        audioSource: audioSource
      };
      var publisher = OT.initPublisher('publisher', publisherOptions, function initComplete(err) {
        if (err) {
          reject(err);
        } else {
          resolve(publisher);
        }
      });
    });
  };

  exports.publish = publish;
})(exports);
