In file .env in root directory put KEY=your_key and PORT=your_port.
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
Collect modules with yarn:
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
API endpoint at http://localhost:5000/
