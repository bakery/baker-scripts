#!/usr/bin/env node

import packageJSON from '../package';
import program from 'commander';
import path from 'path';
import fs from 'fs';
import run from 'cross-spawn';
import forever from 'forever-monitor';
import { findExecutable } from './helpers';
 
const executableLocations = [
  path.resolve(__dirname, '../node_modules/.bin/'),
  path.resolve(__dirname, '../../.bin/')
];

const mocha = function() {
  return findExecutable(executableLocations, 'mocha');
};

const babel = function() {
  return findExecutable(executableLocations, 'babel');
};

const babelCli = function() {
  return findExecutable(executableLocations, 'babel-node');
};

const eslint = function() {
  return findExecutable(executableLocations, 'eslint');
};

const mongo = function() {
  return findExecutable(executableLocations, 'mongodb-runner');
};

const babelTestRequire = path.resolve(__dirname, '../config/babel-test-require.js');
const setupTests = path.resolve(__dirname, '../config/test-setup.js');

program.version(packageJSON.version);

program
  .command('test <path>')
  .action(function(testPath, options){
    run(
      mocha(),      
      [
        setupTests,
        testPath,
        '--require',
        babelTestRequire
      ],
      {stdio: 'inherit'}
    );
  });

program
  .command('test-react-native <test_require> <test_scripts>')
  .action(function(test_require, test_scripts, options){
    run(
      mocha(),
      [
        setupTests,
        test_scripts,
        '--require',
        test_require
      ],
      {stdio: 'inherit'}
    );
  });

program
  .command('run <script_path> [otherArgs...]')
  .option('-d, --node_dev', 'Sets NODE_ENV to development')
  .option('-f, --forever', 'Run script forever and ever')
  .option('-w, --watch <watch>', 'Watch directory and reload on change (only works with --forever)')
  .option('-d, --debug', 'Run script in debug mode')
  .option('-t, --test_run', 'Runs script in a test run mode and curls localhost:8000 after launching it')
  .option('-m, --with_mongo', 'Also starts a local version of MongoDB before running the script')
  .action(function(script_path, otherArgs, options){
    const environment = {};

    if (options.node_dev) {
      environment.NODE_ENV = 'development';
    }

    if (!options.forever) {
      // normal mode
      run(
        babelCli(),
        [
          script_path,
          '--presets',
          'es2015',
          ...otherArgs
        ],
        {stdio: 'inherit', env: Object.assign({}, process.env, environment)}
      );
      return;
    }

    // forever mode
    const opts = {
      max: 3,
      command: babelCli(),
      args: ['--presets', 'es2015', '--plugins', 'transform-object-rest-spread'],
      env: environment
    };

    if (options.watch) {
      console.log('watching');
      opts.watch = true;
      opts.watchDirectory = options.watch;
    }

    if (options.debug) {
      console.log('debugging');
      opts.args.push('--debug');
    }

    const monitor = new (forever.Monitor)(script_path, opts);

    monitor.on('start', function onMonitorStarted() {
      if (options.test_run) {
        console.log('testing server...');
        setTimeout(function onAfterServerStared() {
          run('curl', ['localhost:8000'], {stdio: 'inherit'});
          monitor.stop();
        }, 30000);
      }
    });

    monitor.on('stderr', function onServerScriptError(error) {
      console.error(error.toString());
    });

    monitor.start();
  });

program
  .command('build <input_directory> <output_directory>')
  .action(function(input_directory, output_directory, options){
    run(
      babel(),
      [
        input_directory,
        '--presets',
        'es2015',
        '-d',
        output_directory
      ],
      {stdio: 'inherit'}
    );
  });

program
  .command('push_to_heroku <directory>')
  .option('-s, --settings <settings>', 'Path to json file with settings')
  .action(function(directory, options){
    const serverGitRemote = 'heroku';
    let settings;

    if (options.settings) {
      try {
        settings = require(path.resolve(options.settings));
      } catch (e) {
        console.log(`Cannot load settings module from ${path.resolve(options.settings)}.json`);
        process.exit(1);
      }

      console.log('Deploying with settings:', JSON.stringify(settings, null, ' '));  
    }

    try {
      run('git', ['ls-remote', serverGitRemote]);
    } catch (e) {
      // eslint-disable-next-line max-len
      console.log(`${serverGitRemote} git remote is not set. Try: git remote add ${serverGitRemote} <heroku_app_git_url>`);
      process.exit(1);
    }

    if (settings) {
      run(
        'heroku', 
        [
          'config:set',
          `APPLICATION_SETTINGS='${JSON.stringify(settings)}'`
        ],
        {stdio: 'inherit'}
      );
    }

    run(
      'git', 
      [
        'subtree',
        'push',
        '--prefix',
        directory,
        'heroku',
        'master'
      ], 
      {
        stdio: 'inherit'
      }
    );    
  });

program
  .command('lint <directory> [otherDirectories...]')
  .action(function(directory, otherDirectories){
    run(
      eslint(),
      [
        directory,
        ...otherDirectories
      ],
      {stdio: 'inherit'}
    );
  });

program
  .command('mongo')
  .action(function(){
    run(
      mongo(),
      [
        'start',
        '--name=dev',
        '--purge',
        'false'
      ],
      {stdio: 'inherit'}
    );
  });
program.parse(process.argv);
