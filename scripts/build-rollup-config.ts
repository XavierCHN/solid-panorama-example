import rollupTypescript, {
    RollupTypescriptOptions
} from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path, { join } from 'node:path';
import babel from '@rollup/plugin-babel';
import { RollupWatchOptions } from 'rollup';
import { existsSync, readdirSync, statSync } from 'node:fs';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';
import compatiblePanorama from './rollup-plugin-panorama';
import { isDir, Panorama } from './utils';
import { rollupPluginXML } from './rollup-plugin-xml';
import { rollupPluginScss } from './rollup-plugin-scss';

export default function GetRollupWatchOptions(rootPath: string) {
    // 入口文件夹
    const pages = readdirSync(rootPath).filter(
        v =>
            v !== 'common' &&
            isDir(path.join(rootPath, v)) &&
            existsSync(path.join(rootPath, `${v}/${v}.tsx`))
    );
    const inputFiles = pages.map(v => {
        return path.join(rootPath, `./${v}/${v}.tsx`);
    });
    console.log(pages.map(v => Panorama + ' 👁️  ' + v).join('\n'));

    const options: RollupWatchOptions = {
        input: inputFiles,
        output: {
            sourcemap: false,
            dir: 'content/panorama/scripts/custom_game',
            format: 'cjs',
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            assetFileNames: `[name].[ext]`,
            manualChunks(id, api) {
                // const u = new URL(id, 'file:');
                if (id.search(/[\\/]common[\\/]/) >= 0) {
                    return 'common';
                }
                if (
                    id.includes('commonjsHelpers.js') ||
                    id.includes('rollupPluginBabelHelpers.js') ||
                    id.search(/[\\/]node_modules[\\/]/) >= 0
                ) {
                    return 'libs';
                }
            }
        },
        plugins: [
            babel({
                comments: false,
                exclude: 'node_modules/**',
                extensions: ['.js', '.ts', '.tsx'],
                babelHelpers: 'bundled',
                presets: [
                    ['@babel/preset-env', { targets: { node: '8.2' } }],
                    '@babel/preset-typescript',
                    [
                        'babel-preset-solid-panorama',
                        {
                            moduleName: 'solid-panorama-runtime',
                            generate: 'universal'
                        }
                    ]
                ],
                plugins: [
                    '@babel/plugin-transform-typescript',
                    'babel-plugin-macros'
                ]
            }),
            alias({
                entries: [
                    {
                        find: '@common/(.*)',
                        replacement: join(__dirname, 'pages/common/$1.ts')
                    }
                ]
            }),
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify('production')
                // 'process.env.NODE_ENV': JSON.stringify('development'),
            }),
            // rollupTypescript({
            //     tsconfig: path.join(rootPath, `tsconfig.json`)
            // }),
            commonjs(),
            nodeResolve({ extensions: ['.tsx', '.ts', '.js', '.jsx'] }),
            compatiblePanorama(),
            rollupPluginXML({
                inputFiles,
                dir: join(
                    __dirname,
                    '../content/panorama/layout/custom_game'
                )
            }),
            rollupPluginScss({
                inputFiles,
                dir: join(
                    __dirname,
                    '../content/panorama/styles/custom_game'
                )
            })
        ]
    };

    return options;
}
