/* eslint max-len: 0, no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
    id: 'Tdarr_Plugin_gabehf_Make_First_Subtitle_In_Lang_Default',
    Stage: 'Pre-processing',
    Name: 'Make First Subtitle In The Preferred Language Default',
    Type: 'Subtitle',
    Operation: 'Transcode',
    Description:
      'If no subtitles in the preferred language are made default already, this plugin sets the first subtitle stream in that language as default. \\n',
    Version: '1.0',
    Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
    Inputs: [{
      name: 'preferred_language',
      type: 'string',
      defaultValue: 'eng,en',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Your preferred language code(s) in ISO 639-2 language scheme, separated by a comma. Only the first track that matches any of these language codes will be made default. \\n Default: eng,en',
    }],
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    var languages = []
    if (inputs.preferred_language == "") {
        languages = ["eng", "en"]; //these languages should be kept, named according to ISO 639-2 language scheme
    } else {
        languages = inputs.preferred_language.toLowerCase().split(","); //these languages should be kept, named according to ISO 639-2 language scheme
    }

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
    let defaults = [] // list of tracks currently set as default
    
    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
            defaults[subtitleIdx] = file.ffProbeData.streams[i].disposition.default === 1
            if (!convert && file.ffProbeData.streams[i].disposition.default === 0 && languages.includes(file.ffProbeData.streams[i].tags.language)) {
                convert = true;
                ffmpegCommandInsert += `-disposition:s:${subtitleIdx} default `;
                response.infoLog += `☒Subtitle stream 0:s:${subtitleIdx} is the first track in preferred language and not currently default; setting as default. \n`;
            } else if (file.ffProbeData.streams[i].disposition.default === 1 && languages.includes(file.ffProbeData.streams[i].tags.language)) {
                // if any subtitle with the preferred language is marked default, no action is needed.
                convert = false;
                response.infoLog = '';
                break;
            }
          subtitleIdx += 1;
        }
        } catch (err) {
            // Error
        }
    }

    if (convert) {
        // remove previous default(s)
        for (let i = 0; i < defaults.length; i++) {
            if (defaults[i]) {
                ffmpegCommandInsert += `-disposition:s:${i} 0 `;
                response.infoLog += `☒Subtitle stream 0:s:${i} was default but not in preferred language; removing disposition. \n`;
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
  