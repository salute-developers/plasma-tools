PEPE-SILVIA
=================

<p align="center">
  <img width="800" src="https://i.kym-cdn.com/entries/icons/original/000/022/524/pepe_silvia_meme_banner.jpg" alt="pepe-silvia meme" />
</p>



```sh
npm install -g pepe-silvia
npx pepe --help
```

## Usage

Checking plasma-ui dependents in https://github.com/salute-developers/plasma repository.

```sh
npx pepe find-dependents @salutejs/plasma-ui  --json | npx pepe report-dependents

repo info: salute-developers/plasma 89c6e51b7 23.03.2023 1679591979
Found dependents: 4

plasma-temple packages/plasma-temple
@salutejs/plasma-ui ^1.0.0 peerDep

demo-canvas-app examples/demo-canvas-app
@salutejs/plasma-ui 1.178.1 dep

plasma-temple-docs website/plasma-temple-docs
@salutejs/plasma-ui 1.178.1 dep

plasma-ui-docs website/plasma-ui-docs
@salutejs/plasma-ui 1.178.1 dep

Total dependents found 4
```
