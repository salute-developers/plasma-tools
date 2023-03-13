import {expect, test} from '@oclif/test'

describe('collect-reports', () => {
  test
  .stdout()
  .command(['collect-reports'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['collect-reports', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
