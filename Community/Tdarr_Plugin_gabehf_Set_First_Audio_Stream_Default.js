// tdarrSkipTest
/* eslint max-len: 0, no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_gabehf_Set_First_Audio_Stream_Default',
  Stage: 'Pre-processing',
  Name: 'Set First Audio Stream As Default',
  Type: 'Audio',
  Operation: 'Transcode',
  Description:
      'This plugin sets the first audio stream as the default. \n\n',
  Version: '1.0',
  Tags: 'audio only,ffmpeg',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let convert = false;
  let defaultHasBeenSet = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Catch error here incase the metadata is completely missing.
    try {
      // Check if stream is audio
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        // Check if the audio stream is the first AND it is not default
        if (audioIdx === 0 && file.ffProbeData.streams[i].disposition.default !== 1) {
          ffmpegCommandInsert += `-disposition:a:${audioIdx} default `;
          response.infoLog += `First audio stream 0:a:${audioIdx} is not default; setting as default. \n`;
          defaultHasBeenSet = true;
          convert = true;
          // else if it is not the first stream AND we have changed the default track AND this is the default track
        } else if (defaultHasBeenSet && audioIdx !== 0 && file.ffProbeData.streams[i].disposition.default === 1) {
          ffmpegCommandInsert += `-disposition:a:${audioIdx} 0 `;
          response.infoLog += `Removing audio stream 0:a:${audioIdx} as default. \n`;
          convert = true; // should already be set by now but whatever
        }
        audioIdx += 1;
      }
    } catch (err) {
      // Error
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.container = `.${file.container}`;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain audio tracks that require modification.\n";
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
