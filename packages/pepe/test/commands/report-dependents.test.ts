import {expect, test} from '@oclif/test'

describe('report-dependents', () => {
  test
  .stdout()
  .command(['report-dependents'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['report-dependents', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
