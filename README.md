# Sentinel

This website emulates the homepage of formerly regnumsentinel.com, displaying
WZ/BZ/Bosses infos so you can check out what's up at a glance instead of having
to watch several pages.

Each card title have links to CoRT if you need more infos.

It's a lightweight offshoot of [CoRT](https://github.com/mascaldotfr/CoRT),
which has not been integrated there because it would be redundant.

## Deploy

The trainer just requires a webserver serving static files to run, everything
is run client side. All the rest depends on a CoRT API server though; if you
don't want to depend on the official server you gotta either edit
`js/dist/bundle.js` or rebuild the bundle (see below).

## Development

Unlike CoRT where using nodejs is not wanted, Sentinel is compatible with all
browsers more recent than Firefox 51 (on Windows XP!!1!), thanks to `eslint`,
and javascript is as such bundled, with `js/src` used for modern sources, and
`js/dist` used for public use.

You'll need no install `npm` and run once:

```
npm install
```

To rebuild the bundle as you are modifying stuff:

```
npm run watch
```

To just build:

```
npm run build
```

The API doc can be found in the [CoRT repo](https://github.com/mascaldotfr/CoRT/tree/main/api/bin/sentinel).

## Contributing

It's considered as finished, as the goal is to stay minimal.

## License

   This repo is released under the terms of the GNU Affero General Public
   License v3.0.
   Some parts of the site are MIT licensed as exceptions, please see their
   header files.

### External assets

The [Game icons set](https://game-icons.net/) is licensed
under the CC-BY 3.0 license terms.

[Font Awesome Icons](https://fontawesome.com/license/free) are licensed
under the CC-BY 4.0 license terms.
