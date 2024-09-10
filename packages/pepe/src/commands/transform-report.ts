import { Command, Flags } from '@oclif/core';
import path, { dirname } from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import glob, { isDynamicPattern } from 'fast-glob';
// import mm from 'micromatch';
// import semver from 'semver';
import { getRepoInfo, RepoInfo } from '../utils';
import { formatISO } from 'date-fns';

import { LernaConf, PkgJSON } from './find-dependents';
// TODO: rename interface
import { Record } from './report-dependents';

export default class TransformReport extends Command {
  static description = 'Transform report data'

  static flags = {
      projectsPath: Flags.string({ multiple: true, description: 'path to projects to search dependents', aliases: ['path-to-project', 'project-path'], default: [process.cwd()] }),
      reportDir: Flags.directory({ description: 'Dir to read reports' }),
      date: Flags.string({
        description: 'Date in format: "YYYY-MM-DD" when report was collected',
        default: formatISO(new Date(), { representation: 'date' }),
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(TransformReport)

    const { projectsPath, reportDir } = flags;

    const possibleProjectsPath = (await Promise.all(projectsPath.map(projectPath => {
      return isDynamicPattern(projectPath) ? glob(projectPath, { deep: 1, onlyDirectories: true }) : projectPath;
    }))).flat()

    console.log(possibleProjectsPath);

    const logger = this;

    const pkgFileNamesToProcess: string[] = [];
    
    interface serviceInfo {
      name: string;
      dirname: string;
      path: string;
      repo: string;
      meta: Meta | null;
    }

    interface Meta {
      application: {
        description: string;
        isFreezed: boolean;
      }
    }
    
    const servicesInfo: serviceInfo[] = [];
    
    for (const projectPath of possibleProjectsPath) {
      const pttrns: string[] = [];
      const isRootPckg = await fs.pathExists(path.join(projectPath, 'package.json'));

      const repoInfo = await getRepoInfo(projectPath);

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
      }

      console.log('pttrns', pttrns.length, pttrns);
      for (const pttrn of pttrns) {
          const pkgFileNames = await glob(path.join(projectPath, pttrn, 'package.json'), { deep: 2 })
          // logger.log(chalk.gray(projectPath), `found packages at ${pttrn}: ${pkgFileNames.length}`);

          pkgFileNamesToProcess.push(...pkgFileNames);
          for (const pkgFileName of pkgFileNames) {
              const pkg: PkgJSON = await fs.readJson(pkgFileName);
              const dirname = path.dirname(pkgFileName);

              const dependentPath = path.relative(process.cwd(), path.dirname(pkgFileName));

              let meta: Meta | null = null;
              try {
                meta = await fs.readJSON(path.join(dirname, 'meta.json'));
              } catch (_) {
                logger.log(chalk.blue('no meta for'), dirname);
              }

              servicesInfo.push({
                name: pkg.name,
                dirname,
                meta,
                repo: repoInfo.repository,
                path: path.relative(projectPath, dependentPath), 
              });
          }
      }
    };

    
    const serviceInfoMap = new Map<string, serviceInfo>;

    for (const serviceInfo of servicesInfo) {
      // const uniq = path.join(serviceInfo.dirname, serviceInfo.name);
      const uniq = path.join(serviceInfo.repo, serviceInfo.path);

      if (serviceInfoMap.has(uniq)) {
        // TODO: we should keep info about service while doing find-dependencies
        logger.log(chalk.red('Double entries'), serviceInfo.dirname, uniq, serviceInfoMap.get(uniq));
        continue;
      }

      serviceInfoMap.set(uniq, serviceInfo);
    }

    const { date } = flags;
    const reporttDir = reportDir ?? path.join(this.config.dataDir, 'dependents-reports');


    const outDir = path.join(reporttDir, '__merged__');
    const outputName = `report__${date}.json`;
    const outputPath = path.join(outDir, outputName);

    const records: Array<Record & { date: string }> = [];
    try {
        const data = await fs.readJson(outputPath);
        this.log(`read report from ${outputPath}`);
        records.push(...data);
    } catch (err) {
        this.log(chalk.red(`Check ${outputPath} there is a proble while reading it`));
        this.error(err as Error);
    }

    if (records.length === 0) {
        this.log('There is no records to send, aborting');
        this.exit();
    }

    const filtered: Record[] = [];
    for (const record of records) {
      if (!record.repository) {
        // TODO: it shouldn't be optional
        logger.log(chalk.red('Why repository field is empty ??'), record);
        continue;
      }
      const uniq = path.join(record.repository, record.path);
      const serviceInfo = serviceInfoMap.get(uniq);

      if (!serviceInfo) {
        logger.log(chalk.red('miss serviceInfo for'), uniq);
      }

      if (serviceInfo?.meta?.application.isFreezed) {
        logger.log(chalk.green('Found freezed service'), uniq);
      } else {
        filtered.push(record);
      }
    }


    console.log(filtered.length, records.length);

    try {
      await fs.writeJSON(outputPath, filtered);
      this.log(`write report from ${outputPath}`);
  } catch (err) {
      this.log(chalk.red(`Check ${outputPath} there is a proble while writing it`));
      this.error(err as Error);
  }



    // // why we need set here??
    // const dirs = [...new Set(pkgFileNamesToProcess)].map(p => path.dirname(p));

    // console.log(dirs.length);

    // const metas:string[] = [];

   

    // console.log(metas.length);

    // const metaDirs = metas.map(p => path.dirname(p));

    // console.log(dirs.filter(dir => !metaDirs.includes(dir)));


  }
}
