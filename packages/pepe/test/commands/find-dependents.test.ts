import {expect, test} from '@oclif/test'

describe('find-dependents', () => {
  test
  .stdout()
  .command(['find-dependents'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['find-dependents', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
