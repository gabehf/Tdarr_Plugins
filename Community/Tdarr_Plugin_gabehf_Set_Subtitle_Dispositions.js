// tdarrSkipTest
/* eslint max-len: 0, no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_gabehf_Set_Subtitle_Dispositions',
  Stage: 'Pre-processing',
  Name: 'Set Subtitle Dispositions',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description:
    'This plugin sets the disposition of specified subtitle tracks based on track titles, and removes the disposition from any non-matching tracks. \n\n',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
  Inputs: [{
    name: 'titles_to_set_default',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip:
      'Specify titles to set as default, separated by a comma. If a track contains any of those titles, it will be made default.',
  },
  {
    name: 'titles_to_set_forced',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip:
      'Specify titles to set as forced, separated by a comma. If a track contains any of those titles, it will be made forced.',
  },
  {
    name: 'titles_to_remove_disposition',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip:
      'Specify titles to remove dispositions from, separated by a comma. If a track contains any of those titles, its disposition will be set to 0 (none).',
  }],
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
  let subtitleIdx = 0;
  let convert = false;

  const titles_to_set_forced = inputs.titles_to_set_forced === undefined || inputs.titles_to_set_forced === '' ? [] : inputs.titles_to_set_forced.split(',').map((s) => s.toLowerCase());
  const titles_to_set_default = inputs.titles_to_set_default === undefined || inputs.titles_to_set_default === '' ? [] : inputs.titles_to_set_default.split(',').map((s) => s.toLowerCase());
  const titles_to_remove_disposition = inputs.titles_to_remove_disposition === undefined || inputs.titles_to_remove_disposition === '' ? [] : inputs.titles_to_remove_disposition.split(',').map((s) => s.toLowerCase());

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Catch error here incase the title metadata is completely missing.
    try {
      // Check if stream is subtitle
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
        // Check if the subtitle stream title matches the make default input(s)
        if (titles_to_set_default.some((s) => file.ffProbeData.streams[i].tags.title.toLowerCase().includes(s))) {
          ffmpegCommandInsert += `-disposition:s:${subtitleIdx} default `;
          response.infoLog += `☒Subtitle stream 0:s:${subtitleIdx} detected as being ${titles_to_set_default}; setting as default. \n`;
          convert = true;
        } else if (titles_to_set_forced.some((s) => file.ffProbeData.streams[i].tags.title.toLowerCase().includes(s))) {
          ffmpegCommandInsert += `-disposition:s:${subtitleIdx} forced `;
          response.infoLog += `☒Subtitle stream 0:s:${subtitleIdx} detected as being ${titles_to_set_forced}; setting as forced. \n`;
          convert = true;
        } else if (titles_to_remove_disposition.some((s) => file.ffProbeData.streams[i].tags.title.toLowerCase().includes(s))) {
          ffmpegCommandInsert += `-disposition:s:${subtitleIdx} 0 `;
          response.infoLog += `☒Subtitle stream 0:s:${subtitleIdx} detected as being ${titles_to_remove_disposition}; removing disposition. \n`;
          convert = true;
        }
        subtitleIdx += 1; // increment current subtitle id
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
    response.infoLog += "☑File doesn't contain subtitle tracks that require modification.\n";
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
