import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';

import type { BundleDescriptor, DirectorySegments, FileSystem, Result } from './bundle';
import { context, isDefined, resolveGlobPath } from './bundle';

const isDirectory: Record<string, boolean> = {};

context.fileSystem = {
    isDirectory(pathTo: string) {
        if (!(pathTo in isDirectory)) {
            console.warn(`Unknown path passed to isDirectory(): ${pathTo}`);
        }
        return Promise.resolve(isDirectory[pathTo] === true);
    },
    isFile(pathTo: string) {
        if (!(pathTo in isDirectory)) {
            console.warn(`Unknown path passed to isFile(): ${pathTo}`);
        }
        return Promise.resolve(isDirectory[pathTo] === false);
    }
};

const bundleDescriptor: BundleDescriptor = {
	directories: [
		'Client and Editor',
		'Server',
		'Server/wwwroot'
	],
	includes: [
		{
			source: 'Intersect.Client/LICENSE.md',
			target: 'Client and Editor/LICENSE.client.md'
		},
		{
			source: 'Intersect.Client/bin/Release/**/linux-x64/publish/Intersect Client',
			target: 'Client and Editor'
		},
		{
			source: 'Intersect.Server/LICENSE.md',
			target: 'Server/LICENSE.md'
		},
		{
			source: 'Intersect.Server/bin/Release/**/linux-x64/publish/Intersect Server',
			target: 'Server'
		},
		{
			source: 'Intersect.Server/bin/Release/**/linux-x64/publish/wwwroot/**',
			target: 'Server/wwwroot'
		},
		{
			source: 'assets_full/**',
			target: 'Client and Editor'
		},
		{
			source: 'Documentation/Intersect Documentation.url',
			target: 'Intersect Documentation.url'
		}
	],
	name: 'full',
	platform: 'linux-x64'
};

describe('resolveGlobPath()', () => {
    const { directories, includes, name, platform } = bundleDescriptor;
    let bundleOutputDirectory: string;
    let repositoryRoot: string;

    beforeAll(() => {
        bundleOutputDirectory = join(...['dist', platform, name].filter(isDefined));
    });

    beforeEach(async () => {
        repositoryRoot = await mkdtemp(join(tmpdir(), 'AscensionGameDev_actions_release-bundler_src_bundle_resolveGlobPath_'));
    });

    afterEach(async () => {
        await rm(repositoryRoot, { recursive: true, force: true });
    });

    it.each([
        ['Intersect.Client/LICENSE.md', 'Client and Editor/LICENSE.client.md', false, 'Client and Editor/LICENSE.client.md', undefined],
        ['Intersect.Client/bin/Release/**/linux-x64/publish/Intersect Client', 'Client and Editor', true, 'Client and Editor/Intersect Client', undefined],
        ['Intersect.Server/LICENSE.md', 'Server/LICENSE.md', false, 'Server/LICENSE.md', undefined],
        ['Intersect.Server/bin/Release/**/linux-x64/publish/Intersect Server', 'Server', true, 'Server/Intersect Server', undefined],
        ['Intersect.Server/bin/Release/**/**/publish/wwwroot/**', 'Server/wwwroot', true, 'Server/wwwroot', [
            'favicon.ico',
            'AscensionGameDev.Intersect.Server.styles.css',
            'js/tabset.js',
        ]],
        ['assets_full/**', 'Client and Editor', true, 'Client and Editor', [
            'Upgrading.md',
            'resources/credits.json',
            'resources/tilesets/Autotiles_Interior & Terrain.png',
            'resources/gui/layouts/shared/SettingsWindow.json',
        ]],
        ['Documentation/Intersect Documentation.url', 'Intersect Documentation.url', false, 'Intersect Documentation.url', undefined],
    ])('resolves `%s` to `%s`', async (source, target, targetIsDirectory, expectedPartial, globFiles?: string[]) => {
        const normalizedIncludeSource = normalize(source);
        const resolvedTarget = join(
            repositoryRoot,
            bundleOutputDirectory,
            target
        );
        isDirectory[resolvedTarget] = targetIsDirectory;

        const baseGlobPath = join(repositoryRoot, source.replace('Release/**', 'Release/net8.0').replace('Release/net8.0/**', `Release/net8.0/${platform}`));
        const sourceIsDirectory = baseGlobPath.endsWith('/**');
        const resolvedSource = baseGlobPath.replace(/\/(?:\*\*)?$/, '');
        isDirectory[resolvedSource] = sourceIsDirectory;

        const cases = globFiles?.map(globFile => [
            baseGlobPath.replace(/\*\*$/, globFile),
            join(repositoryRoot, bundleOutputDirectory, expectedPartial, globFile),
        ]) ?? [
            [
                baseGlobPath,
                join(repositoryRoot, bundleOutputDirectory, expectedPartial),
            ],
        ];
        const globPaths = cases.map(([globPath]) => globPath);

        const expected: string[] = [];
        const actual: string[] = [];
        for (const [globPath, expectedResolvedPath] of cases) {
            expected.push(expectedResolvedPath);
            // console.log({ repositoryRoot, resolvedTarget, normalizedIncludeSource, globPath, expectedResolvedPath });
            actual.push(await resolveGlobPath(globPaths, repositoryRoot, resolvedTarget, normalizedIncludeSource, globPath));
        }
        expect(actual).toMatchObject(expected);
    });
});