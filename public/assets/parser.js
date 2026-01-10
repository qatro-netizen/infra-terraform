const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const walk = require('walk');

const config = yargs
  .usage('Usage: $0 <projectPath>')
  .option('projectPath', {
    type: 'string',
    demandOption: true,
    describe: 'Path to the project directory',
  })
  .option('output', {
    type: 'string',
    demandOption: true,
    describe: 'Path to the output file',
  })
  .option('config', {
    type: 'string',
    default: 'terraform.tfvars',
    describe: 'Path to the terraform configuration file',
  })
  .parse();

async function readConfig(file) {
  try {
    const data = await readFile(file, 'utf8');
    const config = JSON.parse(data);
    return config;
  } catch (error) {
    throw new Error(`Failed to read configuration file: ${file}`);
  }
}

async function getFiles(projectPath, config) {
  const files = [];
  const walker = walk.walk(projectPath);
  const terraformFiles = [];

  walker.on('file', (root, fileStat, next) => {
    const filePath = path.join(root, fileStat.name);
    if (filePath.endsWith('.tf') || filePath.endsWith('.tfvars')) {
      terraformFiles.push(filePath);
    }
    next();
  });

  await new Promise((resolve, reject) => {
    walker.on('end', resolve);
    walker.on('error', reject);
  });

  terraformFiles.forEach((file) => {
    fs.readFile(file, 'utf8', (error, data) => {
      if (error) {
        console.error(`Failed to read file: ${file}`);
      } else {
        files.push({ file, data });
      }
    });
  });

  return files;
}

async function parseConfig(projectPath, config) {
  try {
    const files = await getFiles(projectPath, config);
    const terraformConfig = {};

    files.forEach((file) => {
      const { file: filePath, data } = file;
      const lines = data.split('\n').filter((line) => line.trim());
      lines.forEach((line) => {
        const match = line.match(/([a-zA-Z0-9_-]+) = (.*)/);
        if (match) {
          const { 1: key, 2: value } = match;
          terraformConfig[key] = value;
        }
      });
    });

    return terraformConfig;
  } catch (error) {
    throw new Error(`Failed to parse configuration: ${error.message}`);
  }
}

async function main() {
  try {
    const projectPath = config.projectPath;
    const output = config.output;
    const configPath = config.config;

    const projectConfig = await readConfig(configPath);
    const terraformConfig = await parseConfig(projectPath, projectConfig);

    fs.writeFile(output, JSON.stringify(terraformConfig, null, 2), (error) => {
      if (error) {
        console.error(`Failed to write output file: ${error.message}`);
      } else {
        console.log(`Configuration written to: ${output}`);
      }
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();