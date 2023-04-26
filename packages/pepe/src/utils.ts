/* eslint-disable no-use-before-define,  no-irregular-whitespace */

import execa from 'execa';
import semver from 'semver';
import { formatISO, subWeeks } from 'date-fns';

export async function readPipe() {
    const stream = process.stdin;

    if (stream.isTTY) {
        return '';
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) chunks.push(chunk as Uint8Array);

    return Buffer.concat(chunks).toString('utf8');
}

// repo tools

export interface RepoInfo {
    repository: string;
    sha: string;
    shaTimestamp: number;
    shaDate: string;
}

export async function getRepoInfo(projectPath: string): Promise<RepoInfo> {
    // TODO: check is it git repo ?
    /*
     * if no repo =>
     * {
     *   repository: 'unknown',
     *   sha: 'unknown',
     *   shaTimestamp: 0,
     *   shaDate: new Date().toLocaleDateString('ru'),
     * }
     */

    const repository = await getRepo(projectPath);
    const sha = await getSHA(projectPath);

    const originalTimestamp = await getHeadTimeStamp(projectPath, sha);
    const shaDate = new Date(originalTimestamp * 1000).toLocaleDateString('ru');

    return {
        repository,
        sha,
        shaTimestamp: originalTimestamp,
        shaDate,
    };
}

// TODO: move to separate files

type timestamp = number;
type sha = string;

async function getHeadTimeStamp(cwd: string, sha: sha = '@'): Promise<timestamp> {
    const gitLog = 'log';
    const params = ['-1', '--format="%at"', sha];

    try {
        const { stdout } = await execa('git', [gitLog].concat(params), { cwd });

        return Number(JSON.parse(stdout));
    } catch (err) {
        console.error(err);

        return 0;
    }
}

async function getSHA(cwd: string) {
    const { stdout } = await execa('git', ['rev-parse', '--short', '@'], { cwd });

    return stdout;
}

export async function getSHABeforeForDate(cwd: string, date: string) {
    const { stdout } = await execa('git', ['rev-list', '--max-count=1', `--before=${date}`, 'origin/master'], { cwd });

    return stdout;
}

export async function checkout(cwd: string, sha: string, force = false) {
    const { stdout } = await execa('git', ['checkout', sha, force ? '--force' : ''], { cwd });

    return stdout;
}

async function getRepo(cwd: string) {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], { cwd });

    // TODO: parse git origin strings with other formats
    // git@gl.nice.com:frontend/frontend.git
    if (!stdout) {
        return 'unknown';
    }

    // match whole string and replace it with group 1 => group 1 starts at `:` and ands at `/.`
    // git@gl.nice.com:frontend/frontend.git => frontend/frontend
    return stdout.replace(/.*:(.+)\..*/, '$1');
}

/** only for sorted arr */
export function median(arr: number[]) {
    const half = Math.floor(arr.length / 2);

    if (arr.length % 2) {
        return arr[half];
    }

    return (arr[half - 1] + arr[half]) / 2.0;
}

export function mean(arr: number[]) {
    return Math.floor(
        arr.reduce((acc, el) => {
            return acc + el;
        }, 0) / arr.length,
    );
}

/** assume numbers are less then 1000 */
export function mode(arr: number[]) {
    const freq = new Array(1000).fill(0);

    for (const el of arr) {
        freq[el]++;
    }

    return freq.reduce((prevIx, el, ix, arr) => {
        return arr[prevIx] > el ? prevIx : ix;
    }, 0);
}

/** only for sorted arr */
export function range(arr: number[]) {
    return arr[arr.length - 1] - arr[0];
}

export function min(arr: number[]) {
    return Math.min(...arr);
}

export function max(arr: number[]) {
    return Math.max(...arr);
}

// report helpers

const reportPrefix = 'dependents-';
/**
 * reportName – dependents-sberdevices-frontend_awsdk-qa-apps-2023-01-23-3fac980.json
 */
export function parseReportName(reportName: string): reportInfo {
    const params = reportName
        .replace(reportPrefix, '') // remove prefix
        .replace(/\..+/, ''); // remove extension

    const parts = params.split('-');

    const sha = parts.pop()!;
    const date = parts.slice(-3).join('-');
    // TODO: use better delimeter for easier parsing
    const repoName = parts.slice(0, -3).join('-').split('_').join('/');

    return {
        repoName,
        date,
        sha,
    };
}

export interface reportInfo {
    repoName: string;
    date: string;
    sha: string;
}

export function stringifyReportName(reportInfo: reportInfo): string {
    const { repoName, date, sha } = reportInfo;

    return `${reportPrefix}${repoName.replace('/', '_')}-${date}-${sha}`;
}

// Periods

export function getPeriods(date: Date, periods: number): string[] {
    return Array.from(Array(periods), (_, i) => formatISO(subWeeks(date, i), { representation: 'date' }));
}

// Packages

const cache: Record<string, Record<string, string>> = {};
// TODO: refactor
// probably we need to go to npm.js not to use execa
export function getStableVersionsByDate(packageName: string) {
    if (cache[packageName]) {
        return cache[packageName];
    }

    const params = ['time', '--json'];
    // npm info @salutejs/plasma-ui time --json
    const { stdout } = execa.sync('npm', ['info'].concat(packageName, params));

    // TODO: catch errors
    const data = JSON.parse(stdout);
    // console.log(data);

    // return data;

    const res: Record<string, string> = {};

    Object.keys(data).forEach((key) => {
        // skip canary versions
        const version = semver.parse(key);

        // if (version && version.prerelease.length === 0) {
        // TODO: why do we have version 2 ??
        if (version && version.major === 1) {
            res[key] = data[key];
        }
        // }
    });

    cache[packageName] = res;

    return res;
}


export async function installPackages(packages: string[], servicePath: string) {
  const flags = ['--no-save', '--no-package-lock', '--no-fund', '--ignore-scripts', '--no-audit'];
  await execa('npm', ['install'].concat(flags, packages), { cwd: servicePath, stdio: 'inherit' });
}
