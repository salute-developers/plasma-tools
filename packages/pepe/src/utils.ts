

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
  
  