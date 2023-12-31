# Schedl3 - pseudonymous scheduling system

## An open-source privacy-preserving scheduler for anons.

Today, under a pseudonym, you can:
- publish ideas & gain a following
-	buy/sell digital goods/services
-	enter into a contract (with an anonymous counterparty backed with digital currencies enforced by code on a blockchain)

But suppose you were a white hat hacker who found a critical bug in Bitcoin. How would you arrange a meeting with Satoshi?

The pseudonymous economy needs pseudonymous tools. Web2 is neither adequate nor cares to serve this market. 

Using the reputation of your pseudonym, how do you arrange a meeting with another reputable pseudonym?

Where would you even go to try to contact someone trying hard not to be contacted?

How do you let strangers make an appointment with you without revealing an address that will get spammed?

---

Here we provide a solution that preserves privacy by not using email addresses or phone numbers. 
Our system builds on your existing pseudonymous reputation.
We seek to become a new Schelling point for pseudonyms to publish availability and allow contact without worrying about spam or revealing their identity.

Our system uses Ethereum addresses to identify users and verify ownership of Twitter handles and xmtp for decentralized notifications.

We deploy a contract to Linea (ETH L2) to prevent spam and allow pseudonyms to control who can contact them and under which conditions.

In the future we will allow relayers to connect to each other while using end-to-end encryption and allow users to deploy custom contracts to control how they can be contacted.

# schedl-backend

This repo serves as the backend for the pseudonymous scheduling app.

This project is split into two repositories and this repo is the backend while the frontend is located at https://github.com/schedl3/schedl-scaff. The backend is based on Nest and runs the web server that also hosts the static files generated by building the frontend. The frontend repo also contains the smart contracts and deployment scripts.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Troubleshooting](#troubleshooting)
- [Contact](#contact)

## Installation

```bash
$ npm install
```

# Prepare your environment for Schedl

Create a `.env` file from example.env set the necessary environment variables, especially the `DEVELOPMENT_TOKEN_CONTRACT_ADDRESS` for the CHED token address.

```
JWT_SECRET=""
SECRET=""
etc
```

- Run OpenSSL to generate certificates for HTTPS:
```
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

Ensure that MongoDB is running before starting the project: 
```
mongodb://localhost:27017/cats
```

## Features

- Ethereum sign-in
- XMTP notifications
- Time zone schedule transformation
- Twitter verification


## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Contributing

Contributions are welcome! If you encounter bugs or have improvements, follow these steps:

- Bug reports and contributions via pull requests are encouraged.
- Be sure to follow coding standards and guidelines.

## Contact

For questions, feedback, or inquiries, you can get in touch through GitHub (tomosaigon) or Twitter (@tomoXtechno).

## License

Nest is [MIT licensed](LICENSE).
