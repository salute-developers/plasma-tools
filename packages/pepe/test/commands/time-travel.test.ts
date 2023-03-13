import {expect, test} from '@oclif/test'

describe('time-travel', () => {
  test
  .stdout()
  .command(['time-travel'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['time-travel', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
