# CrawlWebsite 
  [![NPM Version][npm-image]][npm-url] 
  [![Windows Build][appveyor-image]][appveyor-url]

According to crawl a special website，we can,undoubtedly , get good date that is benefits for analysing the tendency of different shops.Dianping‘s website currently is the target of this project，which is programmed by nodejs、express、jada and boostrap.

![Snapshot](docs/snapshot.png)

## Installation
* Source code installation

1. Download `CrawlWebsite` from the [the code page](https://github.com/pianoflu/CrawlWebsite/archive/master.zip).
2. unzip the code package and run command in the unzip directory with the permission of administrator.
3. run `npm install` .
4. run `node bin/www`.

```shell
npm install
```
```shell
node bin/www
```

* install the program with docker

1. get the image. `docker pull assertseal/crawlwebsite` .
2. run the container. `docker run -d --name crawlwebsite -p 3000:3000 assertseal/crawlwebsite` .
```shell
$ docker pull assertseal/crawlwebsite
$ docker run -d --name crawlwebsite -p 3000:3000 assertseal/crawlwebsite
```
## Quick Start
type `localhost:3000` in the chrome browser,then it works.

[npm-image]: https://img.shields.io/npm/v/express.svg
[npm-url]: https://npmjs.org/package/express
[appveyor-image]: https://img.shields.io/appveyor/ci/dougwilson/express/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/dougwilson/express
