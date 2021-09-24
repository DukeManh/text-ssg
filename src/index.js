#! /usr/bin/env node
const yargs = require('yargs');
const version = require('../package.json').version;
const fs = require('fs');
const path = require('path');
const clear = require('clear');
const convertToHtml = require('../ssgHandler');
const chalk = require('chalk');
const figlet = require('figlet');
let isFile;

//Clear CLI and display Header
clear();
console.log(
  chalk.blue(figlet.textSync('Text - SSG', { horizontalLayout: 'full' }))
);

//version
yargs.version(version).alias('version', 'v');

//Help
yargs.help('help').alias('help', 'h');

//Usage description
yargs.usage(
  'Usage: This is a Static Site Generator CLI that convert .txt and .md files into .html files'
);

//Examples
yargs.example(`ssg --input <path>`);
yargs.example(`ssg --input <path> --output <path>`);
yargs.example(`ssg --input <path> --output <path> --stylesheet <URL>`);
yargs.example(`ssg -i <path> -o <path> -s <URL>`);

//reject non explicits
yargs.strict().fail((msg, err, yargs) => {
  //Print Error with help option
  console.log(yargs.help());

  console.error(`\n\n${chalk.red.bold('Error:')} ${chalk.red(msg || err)}`);
  process.exit(1);
});

//Input option
yargs
  .option('i', {
    alias: 'input',
    demandOption: true,
    describe: 'Folder/File input location',
    type: 'string',
    nargs: 1,
  })
  .check((argv) => {
    //Check if path exist
    if (fs.existsSync(argv.i)) {
      //Check if path is a file or directory
      if (fs.lstatSync(argv.i).isFile()) {
        const extname = path.extname(argv.i);
        //Check if path is a file ext end with .txt, or .md
        if (extname === '.txt' || extname === '.md') {
          isFile = true;
          return true;
        } else throw new Error('File must be a .txt or .md');
      } else if (fs.lstatSync(argv.i).isDirectory()) {
        isFile = false;

        //checkValidFile recursively check if any .txt or .md file exist
        const checkValidFile = (dirPath) => {
          const dirContents = fs.readdirSync(dirPath);

          //Loop through the content of the directory
          for (const dirContent of dirContents) {
            const dirContentLstat = fs.lstatSync(
              path.join(dirPath, dirContent)
            );

            if (dirContentLstat.isDirectory()) {
              if (checkValidFile(path.join(dirPath, dirContent))) return true;
            } else {
              const extname = path.extname(dirContent);
              if (extname === '.txt' || extname === '.md') return true;
            }
          }
          return false;
        };

        //Check if directory contains at least one .txt or .md file
        const hasValidFile = checkValidFile(argv.i);

        if (!hasValidFile)
          throw new Error("Directory doesn't contain any .txt or .md file.");
      }
      return true;
    } else throw new Error('Directory or file must exist.');
  });

//Stylesheet option
yargs
  .option('s', {
    alias: 'stylesheet',
    demandOption: false,
    describe: 'URL to a CSS stylesheet',
    type: 'string',
    nargs: 1,
  })
  .check((argv) => {
    if (argv.s) {
      //Check if it is an URL of a CSS stylesheet
      if (/^http.*\.css$/.test(argv.s)) return true;
      else throw new Error('Must be an URL to a CSS stylesheet.');
    } else return true;
  });

//Output option
yargs
  .option('o', {
    alias: 'output',
    describe: 'Folder output location',
    type: 'string',
    nargs: 1,
    default: './dist',
  })
  .check((argv) => {
    if (argv.o !== './dist') {
      //Check if it is a directory and exit
      if (fs.existsSync(argv.o)) {
        if (fs.lstatSync(argv.o).isDirectory()) return true;
        else throw new Error('Path must be a directory.');
      } else throw new Error('Directory must exist.');
    } else return true;
  });

//Call convertToHtml
try {
  convertToHtml(yargs.argv.i, yargs.argv.s, yargs.argv.o, isFile);
} catch (e) {
  console.error(`\n\n${chalk.red.bold('Error:')} ${chalk.red(e)}`);
  process.exit(1);
}
yargs.argv;
