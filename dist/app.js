#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const YoutubeDl_1 = require("./YoutubeDl");
const path_1 = __importDefault(require("path"));
const packageJson = require('../package.json');
const cors = require('cors');
const compression = require('compression');
const boolParser = require('express-query-boolean');
// @ts-ignore
const request = require('superagent');
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use(compression());
app.use(cors());
app.use(boolParser());
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
app.set('view engine', 'pug');
app.set('views', path_1.default.join(__dirname, '..', 'views'));
app.get('/v1/video', async (req, res) => {
    var _a, _b;
    try {
        const url = req.query.url;
        const cliOptions = req.query.options;
        const cli = req.query.cli;
        const download = req.query.download;
        if (!url) {
            res.status(400);
            res.send('Missing url');
            return;
        }
        if (cli && cli !== 'youtube-dl' && cli !== 'yt-dlp') {
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let schema = req.query.schema;
        let metadata = await YoutubeDl_1.YoutubeDl.getVideoMetadata(url, { cli, cliOptions }, schema);
        // download video from url
        if (!!download) {
            const filename = ((_b = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.requested_downloads) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b._filename) || `${metadata.title}.${metadata.ext}`;
            downloadExternalUrl(res, metadata.url, filename);
            return;
        }
        // download metadata as JSON
        res.json(metadata);
    }
    catch (e) {
        console.error(e);
        res.status(500);
        res.send(e);
    }
});
app.get(['/video', '/info'], async (req, res) => res.redirect('/v1/video'));
app.get('/watch', async (req, res) => {
    var _a, _b;
    try {
        const v = req.query.v;
        const cliOptions = req.query.options;
        const cli = req.query.cli;
        const download = req.query.download;
        if (!v) {
            res.status(400);
            res.send('Missing video id!');
            return;
        }
        if (cli && cli !== 'youtube-dl' && cli !== 'yt-dlp') {
            res.status(400);
            res.send('Unsupported cli. valid options: youtube-dl | yt-dlp');
            return;
        }
        let metadata = await YoutubeDl_1.YoutubeDl.getVideoMetadata(v, { cli, cliOptions });
        // download video from url
        if (!!download) {
            const filename = ((_b = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.requested_downloads) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b._filename) || `${metadata.title}.${metadata.ext}`;
            downloadExternalUrl(res, metadata.url, filename);
            return;
        }
        // navigate to video url
        res.redirect(metadata.url);
    }
    catch (e) {
        console.error(e);
        res.status(500);
        res.send(e);
    }
});
app.get('/', async (req, res) => {
    const defaultParameters = {
        url: 'youtu.be/dQw4w9WgXcQ',
        cli: ['yt-dlp', 'youtube-dl'],
        download: false,
        cliOptions: '--format best'
    };
    res.render('home', Object.assign(Object.assign({}, packageJson), defaultParameters));
});
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
    console.log(`Try this url in your browser: http://localhost:${port}/watch?v=dQw4w9WgXcQ&cli=yt-dlp`);
    console.log(`Try this url in your browser: http://localhost:${port}/v1/video?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&download=1`);
});
let downloadExternalUrl = (res, url, filename) => {
    res.set('Content-Disposition', `attachment; filename=${filename}`);
    request(url).pipe(res);
    console.debug('external download:', `"${filename}"`, 'from:', url);
};
//# sourceMappingURL=app.js.map