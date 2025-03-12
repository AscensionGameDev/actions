import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import type { BundleDescriptor, DirectorySegments, Result } from './bundle';
import { makeDirectory, packageBundle } from './bundle';

describe('packageBundle()', () => {
    it('dummy', () => {});
});