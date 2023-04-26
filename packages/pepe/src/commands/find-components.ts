import fs from 'fs-extra';
import path from 'path';

import { Args, Command, Flags } from '@oclif/core';
import { Dependency, Dependent, Found, Query, searchProject } from './find-dependents';
import glob, { isDynamicPattern } from 'fast-glob';
import chalk from 'chalk';
import { installPackages, RepoInfo } from '../utils';

import { cruise, format } from 'dependency-cruiser';

export default class FindComponents extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    projectsPath: Flags.string({ multiple: true, description: 'path to projects to search dependents', aliases: ['path-to-project', 'project-path'], default: [process.cwd()] }),
  }

  static strict = false
  static args = {
    depNames: Args.string({ required: true, description: 'depNames (packages name) to search for component usage' })
  }

  public async run(): Promise<void> {
    const { argv, flags } = await this.parse(FindComponents);
    
    const projectsPath = flags.projectsPath;
    const depNames = argv as string[];

    const data: any[] = await fs.readJSON('/Users/vloginevskiy/Projects/SberDevices/pepe/out/collected.json');

    console.log(data.length);


    const query: Query = {
      exact: true,
      exclude: undefined,
      depNames,
    };

    const possibleProjectsPath = (await Promise.all(projectsPath.map(projectPath => {
      return isDynamicPattern(projectPath) ? glob(projectPath, { deep: 1, onlyDirectories: true }) : projectPath;
    }))).flat()

    const found = await Promise.all(possibleProjectsPath.map(projectPath => {
      return searchProject(projectPath, query, this)
    }));

    this.log();
    this.log('Total found dependents', chalk.green(found.reduce((acc, el) => acc + el.matchedDependents.length, 0)));
    this.log();

    const components: ComponentInfo[] = [];

    for (const project of found) {
      const { projectPath, repoInfo, matchedDependents } = project;

      for (const dependent of matchedDependents) {

        await searchComponents({
          ...dependent,
          path: path.join(projectPath, dependent.path)
        }, this)
        
      }
      
    }
  }
}


async function searchComponents(dependent: Dependent, logger: { log: Command['log'] }) {
  const { name, path: dependentPath, matched} = dependent;
  const depStr = matched.map(a => a.depName).join(', ');

  logger.log(`Searching ${chalk.green(depStr)} components at ${chalk.yellow(name)}: ${chalk.gray(dependentPath)}`);

  await prepareServiceForParsing(dependentPath, matched, logger);
  await findComponents(dependentPath, matched, logger);
}


async function prepareServiceForParsing(servicePath: string, deps: Dependency[], logger: { log: Command['log'] }) {

  logger.log('preparing for parsing', servicePath);

  const modulesInstalled = await fs.exists(path.join(servicePath, 'node_modules'));
  if (!modulesInstalled) {
      const depsToInstall = deps.map(d => `${d.depName}@${d.depVersion}`);

      await installPackages(depsToInstall, servicePath);

      // // extra install plasma-core If plasma-ui vc plasma-icons has different plasma-core
      // const [ dep ] = deps;
      // const pkgFileName = path.join(servicePath, 'node_modules', dep.depName, 'package.json');
      // if (fs.existsSync(pkgFileName)) {
      //     const buf = fs.readFileSync(pkgFileName);
      //     const json = JSON.parse(buf.toString());
      //     const plasmaCore = dep.depName.split('/')[0] + '/plasma-core';
      //     const plasmaCoreVersion = json.dependencies[plasmaCore];

      //     if (!fs.existsSync(path.join(servicePath, 'node_modules', plasmaCore, 'package.json'))) {
      //         installPackages([`${plasmaCore}@${plasmaCoreVersion}`], servicePath);
      //     }
      // }
  }

  logger.log('patching plasma modules');

  // const dd = deps.reduce((acc, dep) => {
  //     acc.add(dep.depName);

  //     // // extra plasma-core and plasma-core inside dep in case plasma-ui & plasma-icons has different cores
  //     // const plasmaCore = dep.depName.split('/')[0] + '/plasma-core';
  //     // acc.add(plasmaCore);
  //     // acc.add(path.join(dep.depName, 'node_modules', plasmaCore));

  //     return acc;
  // }, new Set());

  const dd = deps.map(d => d.depName);

  for (const dep of dd) {
      const pkgFileName = path.join(servicePath, 'node_modules', dep, 'package.json');
      if (!fs.existsSync(pkgFileName)) {
          continue;
      }
      const json = await fs.readJSON(pkgFileName);
      // const json = JSON.parse(buf.toString());

      // TODO: do we need to it for all packages ?
      if (json.module) {
          json.main = json.module;

          fs.writeFileSync(pkgFileName, JSON.stringify(json, null, 2));
          logger.log('patched!', pkgFileName);
      }
  }

  return true;
}

async function findComponents(servicePath: string, deps: Dependency[], logger: { log: Command['log'] }) {

  // console.log(serviceName);
  // const servicePath = path.join('services', serviceName);;
  const serviceSrc = fs.existsSync(path.join(servicePath, 'src')) ? path.join(servicePath, 'src') : servicePath;

  const paths = [
      path.join(serviceSrc, '**', '*.tsx'),
      // path.join(serviceSrc, '**', '*[!d].ts'),
      // path.join(serviceSrc, '**', '*.ts'),
      path.join(serviceSrc, '**', '*!(.d).ts'),
  ];

  const cruiseOptions = {
      // TODO: generic
      exclude: 'cypress|__test__|node_modules(?!(\/@salutejs|\/@sberdevices)\/plasma)',
      // Does it even work ??
      // tsConfig: {
      //     fileName: path.join(servicePath, 'tsconfig.json'),
      // },
  };

  logger.log('Start parsing ', serviceSrc);
  logger.log();

  const cruiseResult = cruise(paths, cruiseOptions);
  logger.log('parsed all modules of ', servicePath);
  // console.log(Object.keys(cruiseResult));

  const { output } = cruiseResult;
  if (typeof output === 'string') {
    logger.log('WAT???', output);
    return;
  }


  console.log(output.summary);
  console.log();
  console.log('=============');
  console.log();
  for (const m of output.modules) {
    console.log(m.source);
    console.log(m.dependencies);
  }
  
  // const modules = cruiseResult.output.modules;

  // const plasmaDeps = new Map();
  // for (const m of modules) {
  //     for (const dep of m.dependencies) {
  //         if (isPlasmaPath(dep.resolved)) {
  //             const key = plasmaPathToEntity(dep.resolved);
  //             plasmaDeps.set(key, (plasmaDeps.get(key) || []).concat(m.source));
  //         }
  //     }
  // }

  // const onlyProject = new Set();
  // for (const [key, value] of plasmaDeps) {
  //     // console.log(key, value);
  //     if (value.some(v => !v.includes('node_modules'))) {
  //         onlyProject.add(key);
  //     }
  // }

  // const entities = [...onlyProject];
  // const components = new Set();
  // const icons = new Set();
  // const helpers = new Set();
  // const tokens = new Set();
  // const other = new Set();

  // for (const entity of entities) {
  //     if (entity.includes('Icon')) {
  //         icons.add(entity);
  //         components.add('Icon');
  //     } else if (entity[0] <= 'Z' && entity[0] >= 'A') {
  //         components.add(entity);
  //     } else if (entity === 'plasma-tokens') {
  //         tokens.add(entity);
  //     } else if (entity.includes('@s') || entity === 'index') {
  //         other.add(entity);
  //     } else {
  //         helpers.add(entity);
  //     }
  // }

  // // console.log('plasma components');
  // // console.log(components);
  // // console.log(components.size);

  // // console.log('plasma icons');
  // // console.log(icons);
  // // console.log(icons.size);

  // // console.log('plasma helpers');
  // // console.log(helpers);
  // // console.log(helpers.size);

  // const results = {
  //     components: [...components],
  //     icons: [...icons],
  //     helpers: [...helpers],
  // };

  // // const resultsPath = path.join(__dirname, 'out', servicePath.replace('/', '__') + '.json');

  // // fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // return results;
}




interface Component {
  entityName: string;
  importPath: string;
  type: string;
}

interface ComponentInfo {
  component: Component;

  dependency: Dependency;
  dependent: Dependent;

  repoInfo: RepoInfo;
}

interface ComponentRecord extends Component, Dependency, RepoInfo {
  dependentName: Dependent['name'];
  dependentPath: Dependent['path'];
}


/**
 * 
 * 
 *     {
 * 
 *      "entityName": "Button",
 *      "importPath": "./src/components/myButton.tsx"
 *      "type": ????
 * 
        "repository": "sberdevices-frontend/awsdk-qa-apps",
        "sha": "a467376",
        "shaTimestamp": 1679068320,
        "shaDate": "17.03.2023",

        "dependentName": "payments",
        "dependentPath": "services/payments",

        "depName": "@salutejs/plasma-ui",
        "depVersion": "1.151.0",
        "depType": "dep",
        "major": 1,
        "minor": 151,
        "patch": 0,
        "prerelease": "",
        "isLocal": false,


        "date": "2023-03-20"
    },

 */

