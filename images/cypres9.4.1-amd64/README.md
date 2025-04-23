## cypress/amd64:9.4.1

Образ с Cypress версии 9.4.1.

Содержит версии:
- node: 16.13.0
- chromium: latest

Как собрать
```bash
docker build -t "cypress/amd64:9.4.1" --build-arg VERSION=9.4.1 . 
```