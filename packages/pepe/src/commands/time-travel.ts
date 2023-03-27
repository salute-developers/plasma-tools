import { Args, Command, Flags } from '@oclif/core';
import path from 'path';
import { subWeeks, formatISO, parseISO } from 'date-fns';
import glob, { isDynamicPattern } from 'fast-glob';

import { checkout, getSHABeforeForDate } from '../utils';

import { Query, searchProject } from './find-dependents';
import { writeJSONReports } from './report-dependents';

export default class TimeTravel extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        // TODO: maybe not only once week ( period freq )
        // TODO: from, to
        dateToTravel: Flags.string({
            description:
                'date to begin time travel back several periods, use --periods to get what you want; FORMAT: "YYYY-MM-DD"',
            default: formatISO(new Date(), { representation: 'date' }),
        }),
        periods: Flags.integer({ description: 'periouds to collect info, calls find & report inside', default: 25 }),

        exact: Flags.boolean({ description: 'use exact names of packages, not partial match' }),
        exclude: Flags.string({ description: 'exclude partical names from match' }),
        projectsPath: Flags.string({
            multiple: true,
            description: 'path to projects to search dependents',
            aliases: ['path-to-project', 'project-path'],
            default: [process.cwd()],
        }),

        outDir: Flags.directory({ description: 'Directory to put reports, use with type="json"', aliases: ['outdir'] }),
    };

    static args = {
        depNames: Args.string({ required: true, description: 'depNames (packages name) or partial names to search' }),
    };

    public async run(): Promise<void> {
        const { flags, argv } = await this.parse(TimeTravel);

        const { projectsPath, exact, exclude, outDir, dateToTravel } = flags;

        // TODO: validate Date format
        const dateToBeginTravel = parseISO(dateToTravel);

        const periods = Array.from(Array(flags.periods), (_, i) =>
            formatISO(subWeeks(dateToBeginTravel, i), { representation: 'date' }),
        );

        const depNames = argv as string[];

        const query: Query = {
            exact,
            exclude,
            depNames,
        };

        const outputDir = outDir ?? path.join(this.config.dataDir, 'dependents-reports');

        const possibleProjectsPath = (
            await Promise.all(
                projectsPath.map((projectPath) => {
                    return isDynamicPattern(projectPath)
                        ? glob(projectPath, { deep: 1, onlyDirectories: true })
                        : projectPath;
                }),
            )
        ).flat();

        /* eslint-disable no-await-in-loop */
        for (const period of periods) {
            const search = [];

            for (const projectPath of possibleProjectsPath) {
                this.log();
                this.log(projectPath, period);
                const sha = await getSHABeforeForDate(projectPath, period);

                if (!sha) {
                    this.log('Skipping', projectPath);
                    // eslint-disable-next-line no-continue
                    continue;
                }

                this.log('Checking to:', sha);

                await checkout(projectPath, sha, true);
                this.log();
                search.push(searchProject(projectPath, query, this));
            }

            const found = await Promise.all(search);
            this.log('total', found.length);
            await writeJSONReports(outputDir, found, period, this);
        }
        /* eslint-enable no-await-in-loop */
    }
}
