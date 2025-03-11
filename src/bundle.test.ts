import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import type { BundleDescriptor, DirectorySegments, Result } from './bundle';
import { makeDirectory, packageBundle } from './bundle';


describe('makeDirectory()', () => {
    let testDirectoryName: string;

    beforeEach(async () => {
        testDirectoryName = await mkdtemp(path.join(tmpdir(), 'AscensionGameDev_actions_release-bundler_src_bundle_makeDirectory_'));
    });

    afterEach(async () => {
        await rm(testDirectoryName, { recursive: true, force: true });
    });

    it('returns ok when segments is a string', async () => {
        const result: Result<string> = await makeDirectory(testDirectoryName, 'abc');
        expect(result).toMatchObject(<Result<string>>{
            ok: true,
            value: path.join(testDirectoryName, 'abc'),
        });
    });

    it('returns ok when segments is an array of strings', async () => {
        const result = await makeDirectory(testDirectoryName, ['a', 'b', 'c']);
        expect(result).toMatchObject(<Result<string>>{
            ok: true,
            value: path.join(testDirectoryName, 'a', 'b', 'c'),
        });
    });

    it('converts non-string array segments into strings and returns ok', async () => {
        const result = await makeDirectory(testDirectoryName, ['a', 'b', 'c', 1, 2, 3] as any);
        expect(result).toMatchObject(<Result<string>>{
            ok: true,
            value: path.join(testDirectoryName, 'a', 'b', 'c', '1', '2', '3'),
        });
    });

    it('throws if segments is not a string or an array', async () => {
        const result = await makeDirectory(testDirectoryName, 1 as any);
        expect(result).toMatchObject(<Result<string>>{
            ok: false,
            err: new Error(`Invalid segment: ${1}`),
        });
    });
});

describe('packageBundle()', () => {

});