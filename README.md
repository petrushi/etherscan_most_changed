Добавить файл .env в корневую директорию, где указать KEY=*апиключ* и PORT=*порт*. Без него работает на порту 5000 и очень медленно из-за ограничений на реквесты со стороны etherscan :0
# Сборка с помощью yarn:
Клонировать репозиторий:
```sh
git clone https://github.com/petrushi/etherscan_most_changed.git
```
Перейти в директорию:
```sh
cd etherscan_most_changed
```
Собрать модули и зависимости:
```sh
yarn
```
Скомпилировать TS:
```sh
yarn build
```
Запустить JS:
```sh
yarn start
```
API ендпоинт на http://localhost:5000/ или порте, указанном в .env

****

In file .env in root directory put KEY=*your_APIkey* and PORT=*your_port*.
Without .env working on port 5000 and slow because of etherscan's requests rate limit

# build with yarn:
Clone repo:
```sh
git clone https://github.com/petrushi/etherscan_most_changed.git
```
Go to directory:
```sh
cd etherscan_most_changed
```
Collect modules and deps with yarn:
```sh
yarn
```
Compile TS:
```sh
yarn build
```
Launch JS:
```sh
yarn start
```
API endpoint at http://localhost:5000/ or port from .env
