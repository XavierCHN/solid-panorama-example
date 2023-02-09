import { ensureDir, ensureDirSync } from 'fs-extra';
import * as rollup from 'rollup';
import path, { join } from 'path';
import {
    PreloadTemplates,
    RenderPanoramaXML,
    RenderPanoramaXMLOptions
} from 'dota2-panorama-xml-static-element';
import glob from 'glob';
import { readFile } from 'fs/promises';
import GetRollupWatchOptions from './build-rollup-config';
import { fileColor, normalizedPath, Panorama } from './utils';
import color from 'cli-color';
import { bundlePanoramaPolyfill } from 'solid-panorama-polyfill';

const rootPath = normalizedPath(path.join(__dirname, '../src'));

/**
 * 启动Rollup编译
 */
function StartRollup(): void {
    let options: rollup.RollupWatchOptions = GetRollupWatchOptions(rootPath);
    let watcher = rollup.watch(options);

    // 监听错误
    watcher.on('event', async evt => {
        if (evt.code === 'ERROR') {
            const f = normalizedPath(evt.error.loc?.file || '').replace(
                rootPath + '/',
                ''
            );
            console.log(evt);
            console.log(
                Panorama +
                    ' Build Error: ' +
                    color.red(f) +
                    ': ' +
                    color.yellow(evt.error.loc?.line)
            );
            console.log(
                Panorama + ' Build Error: ' + color.red(evt.error.message)
            );
        }
    });

    watcher.on('change', p => {
        console.log(Panorama + ' ✒️  ' + fileColor(path.basename(p)));
    });
}

/**
 * 任务入口
 */
export default async function TaskPUI() {
    // 确保三个目录存在
    ensureDirSync('./content/panorama/layout/custom_game');
    ensureDirSync('./content/panorama/scripts/custom_game');
    ensureDirSync('./content/panorama/styles/custom_game');

    await bundlePanoramaPolyfill({
        output: './content/panorama/scripts/custom_game/panorama-polyfill.js',
        using: { console: true, timers: true },
        merges: [join(__dirname, 'custom-polyfill.js')]
    });

    StartRollup();
}

TaskPUI();
