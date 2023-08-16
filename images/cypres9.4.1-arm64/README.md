## cypress/arm64:9.4.1

Образ с Cypress версии 9.4.1, которая поддерживает arm64 архитектуру.

Содержит версии:
- node: 16.13.0
- chromium: latest

Как собрать
```bash
docker build -t "cypress/arm64:9.4.1" --build-arg VERSION=9.4.1 . 
```