/* eslint max-len: 0 */
const run = require('../helpers/run');

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
          language: 'eng',
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
          language: 'eng',
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
  // no change
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 0, 0),
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
      infoLog: '☑File doesn\'t contain subtitle tracks that require modification.\n',
    },
  },
  // no change
  {
    input: {
      file: testFile(0, 0, 0, 0, 1, 1, 0, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Full,Dialogue',
        titles_to_set_forced: 'Full,Dialogue',
        // titles_to_remove_disposition: "Remove Me"
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
      infoLog: '☑File doesn\'t contain subtitle tracks that require modification.\n',
    },
  },
  // third set to default
  {
    input: {
      file: testFile(1, 0, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Full,Dialogue',
        // titles_to_set_forced: "Full,Dialogue",
        // titles_to_remove_disposition: "Remove Me"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:2 default -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
            + '☒Subtitle stream 0:s:2 detected as being [full,dialogue]; setting as default. \n',
    },
  },
  // third set to forced
  {
    input: {
      file: testFile(0, 1, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_forced: 'Full,Dialogue',
        // titles_to_remove_disposition: "Remove Me"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:2 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:2 detected as being [full,dialogue]; setting as forced. \n',
    },
  },
  // third set to default, fourth set to forced
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Full,Dialogue',
        titles_to_set_forced: 'Signs & Songs',
        // titles_to_remove_disposition: "Remove Me"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:2 default -disposition:s:3 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:2 detected as being [full,dialogue]; setting as default. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs]; setting as forced. \n',
    },
  },
  // third set to default + forced
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Full,Dialogue',
        titles_to_set_forced: 'Full,Dialogue',
        // titles_to_remove_disposition: ""
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:2 default+forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:2 detected as being both [full,dialogue] and [full,dialogue]; setting as default+forced. \n',
    },
  },
  {
    input: {
      file: testFile(1, 0, 0, 0, 0, 0, 0, 1),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Full,Dialogue',
        // titles_to_set_forced: "Full,Dialogue",
        titles_to_remove_disposition: 'Signs & Songs',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:2 default -disposition:s:3 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [signs & songs] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:2 detected as being [full,dialogue]; setting as default. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs] or has disposition overlapping with new default/forced; removing disposition. \n',
    },
  },
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_forced: 'Song',
        // titles_to_remove_disposition: "Signs & Songs"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 default -disposition:s:1 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 has overlapping disposition \'forced\'; setting as default. \n'
              + '☒Subtitle stream 0:s:1 detected as being [song]; setting as forced. \n',
    },
  },
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_default: 'Song',
        // titles_to_remove_disposition: "Signs & Songs"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 forced -disposition:s:1 default -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 has overlapping disposition \'default\'; setting as forced. \n'
              + '☒Subtitle stream 0:s:1 detected as being [song]; setting as default. \n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 0, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Song',
        titles_to_set_forced: 'Song',
        titles_to_remove_disposition: 'Song',
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
      infoLog: '☑File doesn\'t contain subtitle tracks that require modification.\n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 0, 0, 0, 1, 1),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_default: 'Sing',
        // titles_to_remove_disposition: "Song"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:1 default -disposition:s:3 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:1 detected as being [sing]; setting as default. \n'
                + '☒Subtitle stream 0:s:3 has overlapping disposition \'default\'; setting as forced. \n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 0, 0, 0, 1, 1),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_forced: 'Sing',
        // titles_to_remove_disposition: "Song"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:1 forced -disposition:s:3 default -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:1 detected as being [sing]; setting as forced. \n'
                + '☒Subtitle stream 0:s:3 has overlapping disposition \'forced\'; setting as default. \n',
    },
  },
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 1, 1),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_default: 'Sing',
        // titles_to_remove_disposition: "Song"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 forced -disposition:s:1 default -disposition:s:3 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 has overlapping disposition \'default\'; setting as forced. \n'
                + '☒Subtitle stream 0:s:1 detected as being [sing]; setting as default. \n'
                + '☒Subtitle stream 0:s:3 has overlapping disposition \'default\'; setting as forced. \n',
    },
  },
  {
    input: {
      file: testFile(1, 1, 0, 0, 0, 0, 1, 1),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_forced: 'Sing',
        // titles_to_remove_disposition: "Song"
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 default -disposition:s:1 forced -disposition:s:3 default -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 has overlapping disposition \'forced\'; setting as default. \n'
                + '☒Subtitle stream 0:s:1 detected as being [sing]; setting as forced. \n'
                + '☒Subtitle stream 0:s:3 has overlapping disposition \'forced\'; setting as default. \n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 0, 0, 0, 1, 1),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        // titles_to_set_forced: "Sing",
        titles_to_remove_disposition: 'Signs & Songs',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:3 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:3 detected as being [signs & songs] or has disposition overlapping with new default/forced; removing disposition. \n',
    },
  },
  {
    input: {
      file: testFile(0, 1, 0, 0, 0, 0, 1, 0),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        // titles_to_set_forced: "Sing",
        titles_to_remove_disposition: 'Signs & Songs',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:3 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:3 detected as being [signs & songs] or has disposition overlapping with new default/forced; removing disposition. \n',
    },
  },
  {
    input: {
      file: testFile(0, 1, 0, 1, 0, 0, 1, 0),
      librarySettings: {},
      inputs: {
        // titles_to_set_default: "Full,Dialogue",
        titles_to_set_forced: 'Signs & Songs',
        // titles_to_remove_disposition: ""
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:1 0 -disposition:s:3 default+forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:1 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs] and is already default; setting as default+forced. \n',
    },
  },
  {
    input: {
      file: testFile(1, 0, 1, 0, 0, 0, 0, 1),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Signs & Songs',
        // titles_to_set_forced: "Signs & Songs",
        // titles_to_remove_disposition: ""
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:0 0 -disposition:s:1 0 -disposition:s:3 default+forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:1 detected as being [] or has disposition overlapping with new default/forced; removing disposition. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs] and is already forced; setting as default+forced. \n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 1, 0, 0, 0, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Sing',
        titles_to_set_forced: 'Signs & Songs',
        // titles_to_remove_disposition: ""
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:1 default -disposition:s:3 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:1 detected as being [sing]; setting as default. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs]; setting as forced. \n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 0, 0, 0, 0, 1),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Signs & Songs',
        titles_to_set_forced: 'Sing',
        // titles_to_remove_disposition: ""
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:1 forced -disposition:s:3 default -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:1 detected as being [sing]; setting as forced. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs]; setting as default. \n',
    },
  },
  {
    input: {
      file: testFile(0, 0, 0, 0, 0, 0, 1, 0),
      librarySettings: {},
      inputs: {
        titles_to_set_default: 'Sing',
        titles_to_set_forced: 'Signs & Songs',
        // titles_to_remove_disposition: ""
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -disposition:s:1 default -disposition:s:3 forced -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:1 detected as being [sing]; setting as default. \n'
                + '☒Subtitle stream 0:s:3 detected as being [signs & songs]; setting as forced. \n',
    },
  },
];

void run(tests);
