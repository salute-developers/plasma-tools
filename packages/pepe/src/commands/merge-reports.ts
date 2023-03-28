/* eslint-disable no-use-before-define, no-continue, no-await-in-loop */

import { Command, Flags } from '@oclif/core';
import path from 'path';
import fs from 'fs-extra';
import glob from 'fast-glob';
import { formatISO, parseISO } from 'date-fns';
import { stringify } from 'csv-stringify';

import { getPeriods, parseReportName } from '../utils';

import { Record } from './report-dependents';

type reportType = 'csv' | 'json';

export default class MergeReports extends Command {
    static description = 'Merge reports collected with time-travel';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        type: Flags.string({ description: 'type of merged report', options: ['csv', 'json'] as reportType[] }),
        reportDir: Flags.directory({ description: 'Dir to read reports' }),
        periods: Flags.integer({ description: 'Periods to merge, periods count back from date' }),
        date: Flags.string({
            description: 'Date in format: "YYYY-MM-DD" when report was collected',
            default: formatISO(new Date(), { representation: 'date' }),
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(MergeReports);

        const reportType = flags.type as reportType;

        const reporttDir = flags.reportDir ?? path.join(this.config.dataDir, 'dependents-reports');
        const outPttrn = glob.isDynamicPattern(reporttDir) ? reporttDir : path.join(reporttDir, '**');
        const paths = await glob(outPttrn, { onlyFiles: true });
        const outDir = path.join(path.dirname(outPttrn), '__merged__');

        const { date } = flags;
        const periods = flags.periods ? getPeriods(parseISO(flags.date), flags.periods) : [];

        const records: Record[] = [];

        for (const reportPath of paths) {
            if (reportPath.includes('__merged__') || path.extname(reportPath) !== '.json') {
                continue;
            }

            if (periods.length && !periods.includes(parseReportName(path.basename(reportPath)).date)) {
                continue;
            }

            const report = (await fs.readJSON(reportPath)) as Record[];
            records.push(...report);
        }

        if (!records.length) {
            this.log('No reports found, use --reportDir to locate reports');
            this.exit();
        }

        if (reportType === 'json') {
            const outputName = `report__${date}.json`;
            const outputPath = path.join(outDir, outputName);

            await fs.ensureDir(outDir);
            await fs.writeJSON(outputPath, records, { spaces: 4 });
            this.log(`write to ${outputPath}`);
        }

        if (reportType === 'csv') {
            const outputName = `report__${date}.csv`;
            const outputPath = path.join(outDir, outputName);

            await fs.ensureDir(outDir);
            await writeCSV(outputPath, records);
            this.log(`write to ${outputPath}`);
        }
    }
}

async function writeCSV(path: string, records: Array<any>): Promise<void> {
    return new Promise((res, rej) => {
        const write = fs.createWriteStream(path);
        write
            .on('finish', () => {
                res();
            })
            .on('error', (err) => rej(err));

        stringify(
            records,
            {
                header: true,
            },
            (err) => {
                if (err) {
                    // err while stringifying to csv
                    rej(err);
                }
            },
        ).pipe(write);
    });
}
