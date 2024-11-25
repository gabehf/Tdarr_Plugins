const run = require('../helpers/run');
const _ = require('lodash');

const testFile = (d1, f1, d2, f2, d3, f3, d4, f4) => ({
    fileMedium: 'video',
    container: 'mkv',
    ffProbeData: {
      streams: [
        {
          codec_type: 'video',
        },
        {
          codec_type: 'audio',
        },
        {
          codec_type: 'audio',
        },
        {
          codec_type: 'subtitle',
          tags: {
            title: '',
            language: 'eng',
          },
          disposition: {
            default: d1,
            forced: f1,
          },
        },
        {
          codec_type: 'subtitle',
          tags: {
            title: 'Sings / Songs',
            language: 'eng',
          },
          disposition: {
            default: d2,
            forced: f2,
          },
        },
        {
          codec_type: 'subtitle',
          tags: {
            title: 'Full Dialogue',
            language: 'fre',
          },
          disposition: {
            default: d3,
            forced: f3,
          },
        },
        {
          codec_type: 'subtitle',
          tags: {
            title: 'Signs & Songs',
            language: 'fre',
          },
          disposition: {
            default: d4,
            forced: f4,
          },
        },
      ],
    },
  });

const tests = [
    // default input, no matches
    {
        input: {
        file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
        librarySettings: {},
        inputs: {},
        otherArguments: {},
        },
        output: {
            processFile: false,
            preset: '',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: false,
            infoLog: "☑File doesn't contain subtitle tracks that require modification.\n"
        },
    },
    // default input, match
    {
        input: {
        file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
        librarySettings: {},
        inputs: {},
        otherArguments: {},
        },
        output: {
            processFile: true,
            preset: ', -map 0 -disposition:s:0 default -c copy -max_muxing_queue_size 9999',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: true,
            infoLog: "☒Subtitle stream 0:s:0 is the first track in preferred language and not currently default; setting as default. \n"
        },
    },
    // custom input, match
    {
        input: {
        file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
        librarySettings: {},
        inputs: {
            preferred_language: `fra,fre`
        },
        otherArguments: {},
        },
        output: {
            processFile: true,
            preset: ', -map 0 -disposition:s:1 default -c copy -max_muxing_queue_size 9999',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: true,
            infoLog: "☒Subtitle stream 0:s:1 is the first track in preferred language and not currently default; setting as default. \n"
        },
    },
    // custom input, no matches
    {
        input: {
        file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
        librarySettings: {},
        inputs: {
            preferred_language: `dut,ger`
        },
        otherArguments: {},
        },
        output: {
            processFile: false,
            preset: '',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: false,
            infoLog: "☑File doesn't contain subtitle tracks that require modification.\n"
        },
    },
    // match, default set after
    {
        input: {
        file: testFile(0,0, 0,0, 1,0, 1,0),
        librarySettings: {},
        inputs: {},
        otherArguments: {},
        },
        output: {
            processFile: true,
            preset: ', -map 0 -disposition:s:0 default -disposition:s:2 0 -disposition:s:3 0 -c copy -max_muxing_queue_size 9999',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: true,
            infoLog: "☒Subtitle stream 0:s:0 is the first track in preferred language and not currently default; setting as default. \n" +
            `☒Subtitle stream 0:s:2 was default but not in preferred language; removing disposition. \n` +
            `☒Subtitle stream 0:s:3 was default but not in preferred language; removing disposition. \n`
        },
    },
    // match, default before
    {
        input: {
        file: testFile(1,0, 1,0, 0,0, 0,0),
        librarySettings: {},
        inputs: {
            preferred_language: `fre`
        },
        otherArguments: {},
        },
        output: {
            processFile: true,
            preset: ', -map 0 -disposition:s:2 default -disposition:s:0 0 -disposition:s:1 0 -c copy -max_muxing_queue_size 9999',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: true,
            infoLog: "☒Subtitle stream 0:s:2 is the first track in preferred language and not currently default; setting as default. \n" +
            `☒Subtitle stream 0:s:0 was default but not in preferred language; removing disposition. \n` +
            `☒Subtitle stream 0:s:1 was default but not in preferred language; removing disposition. \n`
        },
    },
    // language already has default track
    {
        input: {
        file: testFile(0,0, 1,0, 0,0, 0,0),
        librarySettings: {},
        inputs: {},
        otherArguments: {},
        },
        output: {
            processFile: false,
            preset: '',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: false,
            infoLog: "☑File doesn't contain subtitle tracks that require modification.\n"
        },
    },
    // language already has default track
    {
        input: {
        file: testFile(0,0, 0,0, 0,0, 1,0),
        librarySettings: {},
        inputs: {
            preferred_language: 'fre',
        },
        otherArguments: {},
        },
        output: {
            processFile: false,
            preset: '',
            container: '.mkv',
            handBrakeMode: false,
            FFmpegMode: true,
            reQueueAfter: false,
            infoLog: "☑File doesn't contain subtitle tracks that require modification.\n"
        },
    },
]
void run(tests)