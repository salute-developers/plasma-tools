

import execa from "execa";
import { cwd } from "process";


  export async function readPipe() {
    const stream = process.stdin;
    if (stream.isTTY) {
      return '';
    }
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) chunks.push(chunk as Uint8Array)
    return Buffer.concat(chunks).toString('utf8')
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
  
  async function getHeadTimeStamp(cwd:string, sha: sha = '@'): Promise<timestamp> {
    const gitLog = 'log';
    const params = ['-1', '--format="%at"', sha];
  
    try {
        const { stdout } = await execa('git', [gitLog].concat(params), { cwd });
        return Number(JSON.parse(stdout));
    } catch(err) {
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

  export async function checkout(cwd: string, sha: string, force: boolean = false) {
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
    return stdout.replace(/.*:(.+)\..*/, "$1");
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
    return Math.floor(arr.reduce((acc, el) => {
        return acc += el;
    }, 0) / arr.length);
}

/** assume numbers are less then 1000 */
export function mode(arr: number[]) {
    const freq = new Array(1000).fill(0);

    for (const el of arr) {
        freq[el]++;
    }

    return freq.reduce((prevIx, el, ix, arr) => {
        return arr[prevIx] > el ? prevIx : ix
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