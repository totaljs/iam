[![MIT License][license-image]][license-url]

# Node.js OAuth 2 Identity and Access Management

![IAM called OpenSocial](http://cdn.totaljs.com/images/iam.png)

---

- [Homepage](https://www.totaljs.com/iam/)
- MIT license

## Requirements

- Node.js +v10
- PostgreSQL +v11
- Total.js framework +v3.3

## Installation

- first set up DB and make DB called `opensocial`
- then create tables + views + function and stored procedures defined in `database.sql`
- import all code lists `database_*.sql`
- get a free API key for Geolocation IP: <https://www.ipdata.co> defined in `config` file
- set up SMTP server defined in `config` file

```bash
$ cd opensocial
$ npm install
```

## To-Do

- [ ] implement other OAuth 2.0 services (Yahoo, Yandex, Live, etc.)
- [ ] improve Developer / My apps section by adding list of users
- [ ] improve Admin / Apps section by adding list of users
- [ ] add a missing documentation for OAuth 2.0

## Funding

This product is __100%__ sponsored by [LabLynx, Inc.](https://www.lablynx.com). It's written under MIT license.

## Author

- Total Avengers <info@totalavengers.com>
- Developer: Peter Širka
- <https://www.totalavengers.com>

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: license.txt