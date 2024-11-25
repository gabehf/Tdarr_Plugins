/* eslint max-len: 0, no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_gabehf_Set_Subtitle_Dispositions_By_Title',
  Stage: 'Pre-processing',
  Name: 'Set Subtitle Dispositions By Title',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description:
    'This plugin sets the disposition of specified subtitle tracks based on track titles. \n\n',
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
      'Specify titles to set as default, separated by a comma. If a track contains any of those titles, it will be made default. The first matching track will be made default, and any other default tracks will have their dispositions removed.',
  },
  {
    name: 'titles_to_set_forced',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip:
      'Specify titles to set as forced, separated by a comma. If a track contains any of those titles, it will be made forced. The first matching track will be made forced, and any other forced tracks will have their dispositions removed.',
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
  let forcedHasBeenSet = false;
  let defaultHasBeenSet = false;
  let streamAltered = false;
  let streamDisposition = {};

  const titles_to_set_forced = inputs.titles_to_set_forced === undefined || inputs.titles_to_set_forced === '' ? [] : inputs.titles_to_set_forced.split(',').map((s) => s.toLowerCase());
  const titles_to_set_default = inputs.titles_to_set_default === undefined || inputs.titles_to_set_default === '' ? [] : inputs.titles_to_set_default.split(',').map((s) => s.toLowerCase());
  const titles_to_remove_disposition = inputs.titles_to_remove_disposition === undefined || inputs.titles_to_remove_disposition === '' ? [] : inputs.titles_to_remove_disposition.split(',').map((s) => s.toLowerCase());

  // TODO: Make it more clever and able to ensure all other subtitle tracks have no disposition if both default and forced tracks were changed
  // 1: English (Default)
  // 2: Sing/Song (Forced)
  // 3: Dialogue
  // 4: Signs/Songs

  // TODO: Make it create a table of current tracks and dispoisitons, then a table on how it should be, then use the difference in the tables to build the ffmpeg command.
  // TODO: (Maybe for another all-in-one "anime subtitle fixer (sub)") If there is only one English subtitle track, and it is not set default, make it default.

  // Build the track tables
  // Desired track dispositions;
  const desiredDispositions = [];
  // Current track dispositions
  const currentDispositions = [];
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
        streamAltered = false;
        streamDisposition = file.ffProbeData.streams[i].disposition;

        if (streamDisposition.default === 1 && streamDisposition.forced === 1) {
          currentDispositions[subtitleIdx] = 'default+forced';
        } else if (streamDisposition.default === 1) {
          currentDispositions[subtitleIdx] = 'default';
        } else if (streamDisposition.forced === 1) {
          currentDispositions[subtitleIdx] = 'forced';
        } else {
          currentDispositions[subtitleIdx] = '0';
        }

        if (titles_to_set_default.some((s) => file.ffProbeData.streams[i].tags.title.toLowerCase().includes(s))) {
          if (defaultHasBeenSet) {
            desiredDispositions[subtitleIdx] = '0';
          } else {
            if (currentDispositions[subtitleIdx] === 'forced' && !forcedHasBeenSet) {
              desiredDispositions[subtitleIdx] = 'default+forced';
            } else {
              desiredDispositions[subtitleIdx] = 'default';
            }
            // ensure any previous default will have its disposition removed
            // note this is only being done when we set a new default so that if the user
            //  does not want to change defaults, this does not get triggered
            for (let j = 0; j < subtitleIdx; j++) {
              if (desiredDispositions[j] === 'default') {
                desiredDispositions[j] = '0';
              } else if (desiredDispositions[j] === 'default+forced') {
                desiredDispositions[j] = 'forced';
              }
            }
          }
          defaultHasBeenSet = true;
          streamAltered = true;
        }
        if (titles_to_set_forced.some((s) => file.ffProbeData.streams[i].tags.title.toLowerCase().includes(s))) {
          if (forcedHasBeenSet) {
            desiredDispositions[subtitleIdx] = '0';
          } else {
            if (desiredDispositions[subtitleIdx] === 'default' || (currentDispositions[subtitleIdx] === 'default' && !defaultHasBeenSet)) {
              desiredDispositions[subtitleIdx] = 'default+forced';
            } else {
              desiredDispositions[subtitleIdx] = 'forced';
            }
            // ensure any previous forced will have its disposition removed
            // note this is only being done when we set a new forced so that if the user
            //  does not want to change forced, this does not get triggered
            for (let j = 0; j < subtitleIdx; j++) {
              if (desiredDispositions[j] === 'forced') {
                desiredDispositions[j] = '0';
              } else if (desiredDispositions[j] === 'default+forced') {
                desiredDispositions[j] = 'default';
              }
            }
          }
          forcedHasBeenSet = true;
          streamAltered = true;
        }
        if ((defaultHasBeenSet && forcedHasBeenSet && !streamAltered) || titles_to_remove_disposition.some((s) => file.ffProbeData.streams[i].tags.title.toLowerCase().includes(s))) {
          desiredDispositions[subtitleIdx] = '0';
          streamAltered = true;
        }
        if (!streamAltered && currentDispositions[subtitleIdx] === 'default+forced') {
          if (defaultHasBeenSet) {
            desiredDispositions[subtitleIdx] = 'forced';
            streamAltered = true;
          } else if (forcedHasBeenSet) {
            desiredDispositions[subtitleIdx] = 'default';
            streamAltered = true;
          }
        }
        if (!streamAltered) {
          desiredDispositions[subtitleIdx] = currentDispositions[subtitleIdx];
        }
        subtitleIdx += 1;
      }
    } catch (err) {
      // Error
    }
  }

  // Generate ffmpeg commands for the differences in the dispositions
  for (let i = 0; i < currentDispositions.length; i++) {
    if (currentDispositions[i] !== desiredDispositions[i]) {
      convert = true;
      switch (desiredDispositions[i]) {
        case 'default':
          ffmpegCommandInsert += `-disposition:s:${i} default `;
          if (currentDispositions[i] === 'default+forced') {
            response.infoLog += `☒Subtitle stream 0:s:${i} has overlapping disposition 'forced'; setting as default. \n`;
          } else {
            response.infoLog += `☒Subtitle stream 0:s:${i} detected as being [${titles_to_set_default}]; setting as default. \n`;
          }
          break;
        case 'forced':
          ffmpegCommandInsert += `-disposition:s:${i} forced `;
          if (currentDispositions[i] === 'default+forced') {
            response.infoLog += `☒Subtitle stream 0:s:${i} has overlapping disposition 'default'; setting as forced. \n`;
          } else {
            response.infoLog += `☒Subtitle stream 0:s:${i} detected as being [${titles_to_set_forced}]; setting as forced. \n`;
          }
          break;
        case 'default+forced':
          ffmpegCommandInsert += `-disposition:s:${i} default+forced `;
          if (currentDispositions[i] === 'default') {
            response.infoLog += `☒Subtitle stream 0:s:${i} detected as being [${titles_to_set_forced}] and is already default; setting as default+forced. \n`;
          } else if (currentDispositions[i] === 'forced') {
            response.infoLog += `☒Subtitle stream 0:s:${i} detected as being [${titles_to_set_default}] and is already forced; setting as default+forced. \n`;
          } else {
            response.infoLog += `☒Subtitle stream 0:s:${i} detected as being both [${titles_to_set_default}] and [${titles_to_set_forced}]; setting as default+forced. \n`;
          }
          break;
        case '0':
          ffmpegCommandInsert += `-disposition:s:${i} 0 `;
          response.infoLog += `☒Subtitle stream 0:s:${i} detected as being [${titles_to_remove_disposition}] or has disposition overlapping with new default/forced; removing disposition. \n`;
          break;
        default:
          // should not get here, error
      }
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert}-c copy -max_muxing_queue_size 9999`;
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
