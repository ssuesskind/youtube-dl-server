"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeDl = void 0;
const { exec } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';
class YoutubeDl {
    static async getVideoMetadata(url, options, schema) {
        options = options || {};
        const cli = options.cli || process.env.CLI || 'youtube-dl';
        let cliOptions = options.cliOptions || '--format \"best\"';
        cliOptions = cli === 'yt-dlp' ? `${cliOptions} --no-config --no-sponsorblock` : cliOptions;
        const bin = path.resolve(__dirname, '../tools/bin/' + cli + (isWin ? '.exe' : ''));
        const command = `${bin} ${cliOptions} --dump-single-json --no-warnings --restrict-filenames ${url}`;
        return await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject({ error: error.message, stderr, stdout });
                    return;
                }
                try {
                    let resultObject = JSON.parse(stdout);
                    if (schema) {
                        resultObject = YoutubeDl.filterKeys(resultObject, schema);
                    }
                    resolve(resultObject);
                }
                catch (e) {
                    reject({ error: e, stderr, stdout });
                }
            });
        });
    }
    static filterKeys(obj, keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        const reducer = function (accumulator, currentValue) {
            if (obj[currentValue]) {
                accumulator[currentValue] = obj[currentValue];
            }
            return accumulator;
        };
        return keys.reduce((reducer), {});
    }
}
exports.YoutubeDl = YoutubeDl;
//# sourceMappingURL=YoutubeDl.js.map