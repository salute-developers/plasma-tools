import { Command, Flags} from '@oclif/core';
import fs from 'fs-extra';
import { formatISO } from 'date-fns';

import { Dependency, Dependent, FindResult } from './find-dependents';
import path from 'path';
import chalk from 'chalk';
import { readPipe, RepoInfo } from '../utils';


export default class ReportDependents extends Command {
  static description = 'report found dependents'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    type: Flags.string({ description: 'type of report', options: ['txt', 'csv', 'json'], default: 'txt' }),
    // TODO: implement flag
    // repo: Flags.boolean({ description: 'include git repository info', default: true }),
    date: Flags.string({ description: 'Date in format: "YYYY-MM-DD" when report was collected'}),
    outDir: Flags.directory({ description: 'Directory to put reports, use with type="json"', aliases:['outdir']})
  }
  
  public async run(): Promise<void> {
    const { flags } = await this.parse(ReportDependents)
    
    // TODO: validate date
    const date =  formatISO(flags.date ? new Date(flags.date) : new Date(), { representation: 'date' });
    
    const outputDir = flags.outDir ?? path.join(this.config.dataDir, 'dependents-reports');


    const stdin = await readPipe();

    if (!stdin) {
      // TODO: read from file / stdin or maybe run find-dependents ?
      this.log('pipe find-dependents to report');
    }

    
    let res: FindResult = [];
  
    try {
      // TODO: write typeguard isFound
      res = JSON.parse(stdin);
    } catch {
      this.log('dependents data is corrupted');
      this.exit(1);
    }

    let total = 0;

    for (const found of res) {    
        const repoInfo = found!.repoInfo;
        const dependents = found!.matchedDependents;

        if (!dependents.length) {
          continue;
        }
        total += dependents.length;
    
        if (flags.type === 'txt') {
          this.log();
          this.log('repo info:', chalk.green(repoInfo.repository), repoInfo.sha, repoInfo.shaDate, repoInfo.shaTimestamp);
          this.log('Found dependents:', chalk.yellow(dependents.length));
          this.log();
    
          for (const dependent of dependents) {
            this.log(dependent.name, chalk.gray(dependent.path));
            for (const dep of dependent.matched) {
              // TODO: color for substring that matched : `@salutejs/${chalk.green(plasma-ui)}`
              this.log(chalk.yellow(dep.depName), dep.depVersion, chalk.gray(dep.depType));
            }
            this.log();
          }
        }
    
        if (flags.type === 'json') {
          const records: Record[] = dependents.flatMap(dependent => {
            const { matched, ...rest} = dependent;
            return matched.map(dep => ({
              ...repoInfo,
              ...rest,
              ...dep,
              date
            }));
          });
    
          const outputName = `dependents-${repoInfo.repository.replace('/', '_')}-${date}-${repoInfo.sha}.json`;
          const outputPath = path.join(outputDir, outputName);
          
          await fs.ensureDir(outputDir);
          await fs.writeJSON(outputPath, records);
          this.log('write to ' + outputPath);
        }

    }
    
    if (flags.type === 'txt') {
      this.log('Total found', chalk.green(total));
    }
  }
}

export interface Record extends Omit<Dependent, 'matched'>, Dependency, Partial<RepoInfo> { } 


