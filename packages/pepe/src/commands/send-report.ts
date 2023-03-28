/* eslint-disable no-use-before-define */

import { Args, Command, Flags } from '@oclif/core';
import { formatISO } from 'date-fns';
import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import chalk from 'chalk';

import { getStableVersionsByDate } from '../utils';

import { Record } from './report-dependents';

export default class SendReport extends Command {
    static description = 'send reports to analitcs servers';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        reportDir: Flags.directory({ description: 'Dir to read reports', aliases: ['report-dir'] }),
        date: Flags.string({
            description: 'Date in format: "YYYY-MM-DD" when report was collected',
            default: formatISO(new Date(), { representation: 'date' }),
        }),
        dryRun: Flags.boolean({ description: 'collect records, but not push them', aliases: ['dry-run'], char: 'd' }),
    };

    static args = {
        url: Args.url({ description: 'URL to send data in json format to', required: true }),
    };

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(SendReport);

        const { url } = args;
        const { date } = flags;
        const reporttDir = flags.reportDir ?? path.join(this.config.dataDir, 'dependents-reports');
        const { dryRun } = flags;

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

        const recordsToSend = records.map((r) => transformRecord(r));

        if (dryRun) {
            this.log(`Records: ${chalk.green(recordsToSend.length)} will be pushed to ${chalk.gray(url)}`);
            this.log('Sample: ', recordsToSend[0]);
            this.exit();
        }

        try {
            await got.post(url, { json: recordsToSend });
            this.log(`Records: ${chalk.green(recordsToSend.length)} succesfully pushed to ${chalk.gray(url)}`);
        } catch (err) {
            this.log(chalk.red(`Something wrong while sending data to ${chalk.gray(url)}`));
            this.error(err as Error);
        }
    }
}
// TODO: date should be in Record
function transformRecord(record: Record & { date: string }): RecordToSend {
    const { name, depName, depVersion, depType, major, minor, patch, prerelease, sha, repository, date } = record;

    const publishTimes = getStableVersionsByDate(depName);

    const time = publishTimes[depVersion];
    const publishTimestamp = Math.floor(+new Date(time) / 1000);
    const originalTimestamp = Math.floor(+new Date(date) / 1000);

    return {
        name,
        path: record.path,
        type: path.dirname(record.path),
        depName,
        depVersion,
        depType,
        major: major !== null ? major : undefined,
        minor: minor !== null ? minor : undefined,
        patch: patch !== null ? patch : undefined,
        hash: sha || '000',
        repository: repository || 'unkown',
        prerelease,
        publishTimestamp,
        originalTimestamp,
    };
}

interface RecordToSend {
    name: string; // 'assistant-web-sdk',
    path: string; // 'packages/assistant-web-sdk',
    type: string; // 'packages',
    depName: string; // '@salutejs/plasma-ui',
    depVersion: string; // '1.136.2',
    depType: string; // 'devDep',
    major?: number; // 1,
    minor?: number; // 136,
    patch?: number; // 2,
    prerelease: string; // '',
    hash: string; // 'efffff6eee8',
    repository: string; // 'frontend/frontend',
    publishTimestamp: number; // 1665405137,
    originalTimestamp: number; // 1679905561
}
