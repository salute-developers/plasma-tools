/* eslint-disable */
// TODO: smthing wrong with @typescript-eslint/typescript-estree

import { Args, Command, Flags } from '@oclif/core';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import glob, { isDynamicPattern } from 'fast-glob';
import mm from 'micromatch';
import semver from 'semver';
import { getRepoInfo, RepoInfo } from '../utils';
import { Logger } from '@oclif/core/lib/errors';

/** @example "packages/*", "services/*" */
type pttrn = string;

export interface LernaConf {
  "packages"?: Array<pttrn>;
}

export interface Query {
  exact: boolean;
  exclude?: string;
  depNames: string[];
}

export type FindResult = Awaited<ReturnType<FindDependents['run']>>;

export default class FindDependents extends Command {
  static description = 'find all dependents of particular package'

  static strict = false

  static enableJsonFlag = true

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    exact: Flags.boolean({ description: 'use exact names of packages, not partial match' }),
    exclude: Flags.string({ description: 'exclude partical names from match' }),
    excludeProjects: Flags.string({ multiple: true, description: 'exclude projects names from search' }),
    projectsPath: Flags.string({ multiple: true, description: 'path to projects to search dependents', aliases: ['path-to-project', 'project-path'], default: [process.cwd()] }),
  }

  static args = {
    depNames: Args.string({ required: true, description: 'depNames (packages name) or partial names to search' }),
  }

  public async run(): Promise<Found[]> {
    const { args, flags, argv } = await this.parse(FindDependents)

    const { projectsPath, exact, exclude } = flags;

    // TODO: if process.stdout.isTTY is falsy then supress logs
    // console.error('ISTTY??');
    // console.error(process.stdout.isTTY);

    const { excludeProjects } = flags;
    
    
    const depNames = argv as string[];

    const query: Query = {
      exact,
      exclude,
      depNames,
    };

    if (this.config.debug) {
        this.log();
        this.log('Debug info:');
        this.log('search for',  args.depNames);
        this.log('search for all',  argv);
        this.log('flags', flags);
        this.log('workdir', projectsPath);
        this.log();
    }

    const excludeProjectsSet = new Set(excludeProjects || [])

    const possibleProjectsPath = (await Promise.all(projectsPath.map(projectPath => {
      return isDynamicPattern(projectPath) ? glob(projectPath, { deep: 1, onlyDirectories: true }) : projectPath;
    }))).flat()

    const found = await Promise.all(possibleProjectsPath.map(projectPath => {
      return searchProject(projectPath, query, this, excludeProjectsSet)
    }));

    this.log();
    this.log('Total found', chalk.green(found.reduce((acc, el) => acc + el.matchedDependents.length, 0)));
    this.log('TOTal', found.reduce((acc, el)=> acc + el.count, 0))

    return found;
  }


}

  // TODO: logs should be grouped by projectPath
export async function searchProject(projectPath:string, query: Query, logger: { log: Command['log'] }, excludeProjects?: Set<string>): Promise<Found & {count: number}> {
    // TODO: exact & exclude
    const { depNames, exact } = query;

    const repoInfo = await getRepoInfo(projectPath);

    const pttrns:string[] = [];

    const isRootPckg = await fs.pathExists(path.join(projectPath, 'package.json'));
    if (isRootPckg) {
      logger.log(chalk.gray(projectPath), `Searching in root ${chalk.yellow('package.json')}`);
        pttrns.push('.');
    }

    // TODO: extend to more monorepo.tools
    const isMonorepo = await fs.pathExists(path.join(projectPath, 'lerna.json'));

    if (isMonorepo) {
        const lernaConf: LernaConf = await fs.readJSON(path.join(projectPath, 'lerna.json'));
        const lernaPttrns = lernaConf.packages || ['packages/*'];

        logger.log(chalk.gray(projectPath), `Searching in [ ${chalk.yellow(lernaPttrns.join(' '))} ]`);
        pttrns.push(...lernaPttrns);
    }

    if (!pttrns.length) {
      logger.log(chalk.gray(projectPath), 'No package.json detected, try another directory ( use --project-path)');
        return {
          projectPath,
          repoInfo,
          query,
          matchedDependents: [],
          count: 0
        };
    }

    const pkgFileNamesToProcess: string[] = [];

    for (const pttrn of pttrns) {
        const pkgFileNames = await glob(path.join(projectPath, pttrn, 'package.json'), { deep: 2 })
        logger.log(chalk.gray(projectPath), `found packages at ${pttrn}: ${pkgFileNames.length}`);

        pkgFileNamesToProcess.push(...pkgFileNames);
    }

    // TODO: actually we need a graph here
    // AND we could collect first everything, then extract information we need
    // AND we could use a cache here
    const matchedDependents: Dependent[] = [];
let count = 0;
    for (const pkgFileName of pkgFileNamesToProcess) {
        const pkg: PkgJSON = await fs.readJson(pkgFileName);

        const dependentPath = path.relative(process.cwd(), path.dirname(pkgFileName));
        // @scope/foo-bar => foo-bar
        const dependentName = pkg.name.split('/').pop()!;

        let meta: Meta | null = null;
        try {
          meta = await fs.readJSON(path.join(path.dirname(pkgFileName), 'meta.json'));
        } catch (_) {
          logger.log(chalk.blue('no meta for'), dependentPath);
        }

        // TODO: is should be excludeProjects or in some config
        if (meta?.application?.isFreezed) {
          logger.log(chalk.red('Exclude'), pkg.name);
          continue;
        }


        if (excludeProjects?.has(pkg.name) || excludeProjects?.has(dependentName)) {
          logger.log(chalk.red('Exclude'), pkg.name);
          continue;
        }

        // this.config.debug && console.log({
        //     dependentPath,
        //     dependentName,
        // });
        logger.log(dependentPath);
        logger.log(dependentName);
        count++;

        const deps: Array<Dependency> = [];

        deps.push(...collectDeps('dep', pkg.dependencies).map(dep => addSemver(dep, logger)));
        deps.push(...collectDeps('devDep', pkg.devDependencies).map(dep => addSemver(dep, logger)));
        deps.push(...collectDeps('peerDep', pkg.peerDependencies).map(dep => addSemver(dep, logger)));

        // TODO: if depName is in devDep & peerDep, peerDep will win =/
        const depsMap = deps.reduce((acc, el) => acc.set(el.depName, el), new Map());
        // this.config.debug && console.log(`Collected deps: ${deps.length}`);

        const matched = exact
        ? deps.map(({ depName }) => depName).filter(depName => depNames.includes(depName)).map((depName) => depsMap.get(depName))
        : mm(deps.map(({ depName }) => depName), depNames, { basename: true }).map((depName) => depsMap.get(depName));

        matched.length && matchedDependents.push({
          name: dependentName,
          path: path.relative(projectPath, dependentPath),
          matched,
        });
    }

    
    logger.log();
    logger.log(chalk.gray(projectPath), 'found dependents:', chalk.green(matchedDependents.length));
    logger.log(chalk.red(count));
    logger.log(chalk.gray(pkgFileNamesToProcess.length));

    // TODO: add flag to write to file or stdout or prettyprint ( write now => --json)
    // TODO: add `clean` command
    // const pathToData = path.join(this.config.dataDir, path.basename(pathToProject) + '-matchedDependents.json')
    // await fs.ensureFile(pathToData);
    // await fs.writeJSON(pathToData, matchedDependents);

    // this.log('data is writen to ', pathToData);
    // this.log(`use ${chalk.magenta('report')} command to examine matched dependents and deps`);

    return {
      projectPath,
      repoInfo,
      query,
      matchedDependents,
      count
    }
  }


// TODO: remove me
  interface Meta {
    application?: {
      description: string;
      isFreezed: boolean;
    }
  }

export interface Found {
  projectPath: string;
  // TODO: what to do with not git projects ?
  // isGit: boolean;
  repoInfo: RepoInfo;
  query: Query;
  matchedDependents: Dependent[];
}

export interface Dependent {
  name: string;
  path: string;

  matched: Dependency[];
}

type depType = 'dep' | 'devDep' | 'peerDep';

interface SemVer {
  major: number | null;
  minor: number | null;
  patch: number | null;
  prerelease: string;
}

interface Dep {
  depName: string;
  depVersion: version;
  depType: depType;
}

export interface Dependency extends Dep, SemVer {
  // if dep is local pkg: "bla" : "file: bla/bla"
  isLocal: boolean;
}

function collectDeps(depType: depType, dependencies?: dependenciesRecord): Array<Dep> {
  return dependencies ? Object.entries(dependencies).reduce<Array<Dep>>((acc, [depName, depVersion]) => {
    acc.push({
      depName,
      depVersion,
      depType,
    });
    return acc;
  }, []) : [];
}

function addSemver(dep: Dep, logger: { log: Command['log'] }): Dependency {
  const { depVersion } = dep;

  // logger.log('^___^');
  const version = semver.validRange(depVersion);
  // logger.log(depVersion, dep.depName);
  // logger.log(version!, version ? semver.minVersion(version)! : {min: null});
  // logger.log();
  // logger.log();
  const noop = {
    major: null,
    minor: null,
    patch: null,
    prerelease: [],
  }
  // NOTE: semver.minVersion(version) could result to null if range is not valid; exmpl: "@salutejs/plasma-web": ">= 1.114.0 < 1",
  const { major, minor, patch, prerelease } = version ? semver.minVersion(version) || noop : noop;

  return {
      ...dep, 
      major,
      minor,
      patch,
      prerelease: prerelease.join('.'),
      isLocal: !Boolean(version),
  };

}

type version = string;
type dependenciesRecord = Record<string, version>;

export interface PkgJSON {
    name: string;

    devDependencies?: dependenciesRecord;
    dependencies?: dependenciesRecord
    peerDependencies?: dependenciesRecord;
}
