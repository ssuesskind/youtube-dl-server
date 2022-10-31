#!/usr/bin/env node

import express, {Response} from 'express';
import {YoutubeDl} from './YoutubeDl';
import path from 'path';

const packageJson = require('../package.json');

const cors = require('cors');
const compression = require('compression');
const boolParser = require('express-query-boolean');
// @ts-ignore
const request = require('superagent');

const app = express();
const port = process.env.PORT || 8080;

app.use(compression());
app.use(cors());
app.use(boolParser());

app.use(express.static(path.join(__dirname, '..', 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

app.get('/v1/video', async (req, res) => {
    try {
        const url = req.query.url as string;
        const cliOptions = req.query.options as string;
        const cli = req.query.cli as 'youtube-dl' | 'yt-dlp';
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
        let schema = req.query.schema as string[];
        let metadata = await YoutubeDl.getVideoMetadata(url, {cli, cliOptions}, schema);
        // download video from url
        if (!!download) {
            const filename = metadata?.requested_downloads?.[0]?._filename || `${metadata.title}.${metadata.ext}`;
            downloadExternalUrl(res, metadata.url, filename);
            return;
        }
        // download metadata as JSON
        res.json(metadata);
    } catch (e) {
        console.error(e);
        res.status(500);
        res.send(e);
    }
});

app.get(['/video', '/info'], async (req, res) => res.redirect('/v1/video'));

app.get('/watch', async (req, res) => {
    try {
        const v = req.query.v as string;
        const cliOptions = req.query.options as string;
        const cli = req.query.cli as 'youtube-dl' | 'yt-dlp';
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
        let metadata = await YoutubeDl.getVideoMetadata(v, {cli, cliOptions});
        // download video from url
        if (!!download) {
            const filename = metadata?.requested_downloads?.[0]?._filename || `${metadata.title}.${metadata.ext}`;
            downloadExternalUrl(res, metadata.url, filename);
            return;
        }
        // navigate to video url
        res.redirect(metadata.url);
    } catch (e) {
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

    res.render('home', {
        ...packageJson,
        ...defaultParameters
    });
});

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);

    console.log(`Try this url in your browser: http://localhost:${port}/watch?v=dQw4w9WgXcQ&cli=yt-dlp`);
    console.log(`Try this url in your browser: http://localhost:${port}/v1/video?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&download=1`);
});

let downloadExternalUrl = (res: Response, url: string, filename: string) => {
    res.set('Content-Disposition', `attachment; filename=${filename}`);
    request(url).pipe(res);
    console.debug('external download:',`"${filename}"` , 'from:', url);
};
