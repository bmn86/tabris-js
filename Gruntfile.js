module.exports = function(grunt) {

  let pkg = grunt.file.readJSON('package.json');
  let version = pkg.version;
  let release = grunt.option('release');
  if (!release) {
    version += '-dev.' + grunt.template.today('yyyymmdd+HHMM');
  }
  let banner = blockComment('Tabris.js ' + version + '\n\n' + grunt.file.read('LICENSE'));

  grunt.log.writeln('Building version ' + version);

  grunt.initConfig({
    version,
    clean: ['build'],
    concat: {
      tabris: {
        options: {
          banner,
          process: src => src.replace(/\${VERSION}/g, version)
        },
        src: ['build/tabris-transpiled.js'],
        dest: 'build/tabris/tabris.js'
      },
      boot: {
        options: {
          banner,
          process: src => src.replace(/\${VERSION}/g, version)
        },
        src: ['build/boot-transpiled.js'],
        dest: 'build/boot.js'
      },
      typings: {
        src: [
          'typings/whatwg-fetch.d.ts',
          'typings/JSX.d.ts',
          'typings/timer.d.ts',
          'typings/console.d.ts',
          'typings/localStorage.d.ts',
          'typings/XMLHttpRequest.d.ts',
          'typings/Event.d.ts',
          'typings/WebSocket.d.ts',
          'typings/EventObject.d.ts'
        ],
        dest: 'build/tabris/globals.d.ts'
      },
    },
    doc: {
      api: 'doc/api/**/*.json',
      typings: 'typings/propertyTypes.d.ts',
      target: 'build/doc/'
    },
    copy: {
      doc: {
        expand: true,
        cwd: 'doc/',
        src: ['*.md', 'api/*.md', 'api/img/**/*.*', 'img/*.*', 'toc.yml'],
        dest: 'build/doc/'
      },
      readme: {
        src: 'README.md',
        dest: 'build/tabris/'
      },
      test_ts: {
        expand: true,
        cwd: 'test/typescript/',
        src: ['**/*.test.ts', '**/*.test.tsx', 'package.json', 'tsconfig.json'],
        dest: 'build/typescript/'
      }
    },
    exec: {
      verify_typings: {
        cmd: 'npm install && node node_modules/typescript/bin/tsc -p . --noImplicitAny',
        cwd: 'build/typescript'
      },
      test_boot: {
        cmd: 'node node_modules/mocha/bin/mocha --colors --compilers js:babel-core/register "test/boot/**/*.test.js"'
      },
      verify_tabris: {
        cmd: 'node node_modules/mocha/bin/mocha --colors "test/**/*.verify.js"'
      },
      test_tabris: {
        cmd: 'node node_modules/mocha/bin/mocha --colors --compilers js:babel-core/register "test/tabris/**/*.test.js"'
      },
      test_spec: {
        cmd: `node node_modules/mocha/bin/mocha --colors --compilers js:babel-core/register "${grunt.option('spec')}"`
      },
      eslint: {
        cmd: 'node node_modules/eslint/bin/eslint.js --color .'
      },
      tslint: {
        cmd: 'node node_modules/tslint/bin/tslint --exclude "**/*.d.ts" "examples/**/*.ts" "test/**/*.ts"'
      },
      bundle_tabris: {
        cmd: 'node node_modules/rollup/bin/rollup --format=cjs --output=build/tabris-bundle.js -- src/tabris/main.js'
      },
      bundle_boot: {
        cmd: 'node node_modules/rollup/bin/rollup --format=cjs --output=build/boot-bundle.js -- src/boot/main.js'
      },
      transpile_tabris: {
        options: {env: Object.assign({}, process.env, {BABEL_ENV: 'build'})},
        cmd: 'node node_modules/babel-cli/bin/babel.js --compact false ' +
          '--out-file build/tabris-transpiled.js build/tabris-bundle.js'
      },
      transpile_boot: {
        options: {env: Object.assign({}, process.env, {BABEL_ENV: 'build'})},
        cmd: 'node node_modules/babel-cli/bin/babel.js --compact false ' +
          '--out-file build/boot-transpiled.js build/boot-bundle.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadTasks('./grunt');

  /* runs static code analysis tools */
  grunt.registerTask('lint', [
    'exec:eslint',
    'exec:tslint'
  ]);

  grunt.registerTask('package', 'create package.json', () => {
    let stringify = require('format-json');
    let pack = grunt.file.readJSON('package.json');
    delete pack.devDependencies;
    pack.main = 'tabris.js';
    pack.typings = 'tabris.d.ts';
    pack.version = version;
    grunt.file.write('build/tabris/package.json', stringify.plain(pack));
  });

  /* concatenates and minifies code */
  grunt.registerTask('build', [
    'exec:bundle_tabris',
    'exec:transpile_tabris',
    'concat:tabris',
    'exec:bundle_boot',
    'exec:transpile_boot',
    'concat:boot',
    'package',
    'copy:readme',
    'concat:typings',
    'generate-tsd'
  ]);

  grunt.registerTask('test', [
    'exec:test_boot',
    'exec:test_tabris'
  ]);

  /* runs tests against the build output */
  grunt.registerTask('verify', [
    'exec:verify_tabris',
    'copy:test_ts',
    'exec:verify_typings'
  ]);

  /* generates reference documentation */
  grunt.registerTask('doc', [
    'copy:doc',
    'generate-doc'
  ]);

  /* packages example code */
  grunt.registerTask('examples', [
    'copy-examples'
  ]);

  grunt.registerTask('default', [
    'clean',
    'lint',
    'test',
    'build',
    'verify',
    'doc',
    'examples'
  ]);

  function blockComment(text) {
    let commented = text.trim().split('\n').map(line => ' * ' + line).join('\n');
    return '/*!\n' + commented + '\n */\n';
  }

};
