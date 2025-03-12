import { info, warning } from '@actions/core';
import { copyFile, open, stat } from 'fs/promises';
import { glob } from 'glob';
import { mkdirp } from 'mkdirp';
import { basename, dirname, join, normalize, relative, sep } from 'path';
import archiver from 'archiver';

export type Result<T = never> =
	| (T extends never ? { ok: true } : { ok: true; value: T })
	| { ok: false; err: Error };

export type FileMapping = {
	source: string;
	target: string;
};

export type DirectorySegments = string | string[];

export type BundleDescriptor = {
	directories: DirectorySegments[];
	includes: (FileMapping | string)[];
	name: string;
	platform?: string;
};

export interface FileSystem {
	isDirectory(pathTo: string): Promise<boolean>;
	isFile(pathTo: string): Promise<boolean>;
}

export const DefaultFileSystem: FileSystem = {
	async isDirectory(pathTo: string): Promise<boolean> {
		try {
			const stats = await stat(pathTo);
			return stats?.isDirectory() ?? false;
		} catch (err) {
			if (
				!err ||
				typeof err !== 'object' ||
				!('code' in err) ||
				err.code !== 'ENOENT'
			) {
				warning(err as string | Error);
			}
			return false;
		}
	},
	async isFile(pathTo: string): Promise<boolean> {
		try {
			const stats = await stat(pathTo);
			return stats?.isFile() ?? false;
		} catch (err) {
			if (
				!err ||
				typeof err !== 'object' ||
				!('code' in err) ||
				err.code !== 'ENOENT'
			) {
				warning(err as string | Error);
			}
			return false;
		}
	}
}

export const context = {
	fileSystem: DefaultFileSystem,
};

export async function makeDirectory(
	parent: string,
	segments: DirectorySegments
): Promise<Result<string>> {
	try {
		if (typeof segments === 'string') {
			const resolvedPath = join(parent, segments);
			info(`Creating directory: ${resolvedPath}`);
			await mkdirp(resolvedPath);
			return {
				ok: true,
				value: resolvedPath,
			};
		}

		if (!Array.isArray(segments)) {
			throw new Error(`Invalid segment: ${segments}`);
		}

		const resolvedPath = join(parent, ...segments.map(segment => typeof segment === 'string' ? segment : String(segment)));
		info(`Creating directory: ${resolvedPath}`);
		await mkdirp(resolvedPath);
		return {
			ok: true,
			value: resolvedPath,
		};
	} catch (err) {
		return {
			ok: false,
			err: err instanceof Error ? err : new Error(err as string)
		};
	}
}

export function isDefined<TValue>(value: TValue | undefined): value is TValue {
	return value !== undefined;
}

export function findAll(searchFor: string, searchIn: string): number[] {
	const positions: number[] = [];
	let index: number = 0;
	while ((index = searchIn.indexOf(searchFor, index)) > -1) {
		positions.push(index);
	}
	return positions;
}

export async function resolveGlobPath(
	globbedPaths: string[],
	repositoryRoot: string,
	resolvedTarget: string,
	normalizedIncludeSource: string,
	globbedFilePath: string
): Promise<string> {
	const globbedFileName = basename(globbedFilePath);
	info(`Resolved ${globbedFileName} (${globbedFilePath})`);
	let targetFilePath = join(resolvedTarget, globbedFileName);
	const firstGlobReplacementPosition = normalizedIncludeSource.indexOf('**');
	if (firstGlobReplacementPosition >= 0) {
		let resolvedIncludeSource = join(repositoryRoot, normalizedIncludeSource);
		if (normalizedIncludeSource.endsWith('**')) {
			resolvedIncludeSource = dirname(resolvedIncludeSource);
		}

		if (resolvedIncludeSource.length > firstGlobReplacementPosition) {
			const patternSource = resolvedIncludeSource.replace(/\*\*/g, (_, index) => `(?<glob${index}>.+)`);
			const resolvedIncludeSourcePattern = new RegExp(patternSource);
			const match = resolvedIncludeSourcePattern.exec(globbedFilePath);
			if (match) {
				const { groups } = match;
				let offset = 0;
				for (const globPositionKey in groups) {
					const globReplacementIndex = Number.parseInt(globPositionKey.replace('glob', ''));
					const globReplacement = groups[globPositionKey];
					// console.debug({
					// 	resolvedIncludeSource,
					// 	globReplacementIndex,
					// 	globReplacement,
					// 	offset,
					// 	resolvedIncludeSourc2: resolvedIncludeSource.slice(0, globReplacementIndex + offset) + globReplacement + resolvedIncludeSource.slice(globReplacementIndex + offset + 2)
					// });
					resolvedIncludeSource = resolvedIncludeSource.slice(0, globReplacementIndex + offset) + globReplacement + resolvedIncludeSource.slice(globReplacementIndex + offset + 2);
					offset += globReplacement.length - 2;
				}
			} else {
				warning(`No glob replacement sections found in '${globbedFilePath}' using glob pattern '${resolvedIncludeSource}'`);
			}
			// console.log([globbedFilePath, resolvedIncludeSource], match);
		}

		const relativeGlobbedFilePath = relative(
			resolvedIncludeSource,
			globbedFilePath
		);
		info(`Relative globbed file path: ${relativeGlobbedFilePath}`);
		const resolvedTargetGlobbedFilePath = join(
			resolvedTarget,
			relativeGlobbedFilePath
		);
		info(
			`Resolved target globbed file path: ${resolvedTargetGlobbedFilePath}`
		);
		if (relativeGlobbedFilePath.includes(sep)) {
			const resolvedTargetGlobbedFileDirName = dirname(
				resolvedTargetGlobbedFilePath
			);
			info(`mkdirp: ${resolvedTargetGlobbedFileDirName}`);
			await mkdirp(resolvedTargetGlobbedFileDirName);
		}
		info(
			`Re-resolved ${relativeGlobbedFilePath} to ${resolvedTargetGlobbedFilePath}`
		);
		targetFilePath = resolvedTargetGlobbedFilePath;
	} else if (globbedPaths.length === 1) {
		if (!await context.fileSystem.isDirectory(resolvedTarget)) {
			targetFilePath = resolvedTarget;
		}
	}

	return targetFilePath;
}

export async function packageBundle(
	version: string,
	...bundleDescriptors: BundleDescriptor[]
): Promise<Result<string[]>> {
	const repositoryRoot = process.cwd();
	info(`Bundling ${bundleDescriptors.length} packages from ${repositoryRoot}`);
	if (bundleDescriptors.length < 1) {
		warning('Is the `bundle` input parameter correct?');
	}

	const archivePaths: string[] = [];
	for (const { directories, includes, name, platform } of bundleDescriptors) {
		const bundleOutputDirectory = join(...['dist', platform, name].filter(isDefined));
		await mkdirp(bundleOutputDirectory);

		for (const nestableDirectory of directories) {
			const result = await makeDirectory(
				bundleOutputDirectory,
				nestableDirectory
			);
			if (result.ok !== true) {
				return {
					ok: false,
					err: result.err
				};
			}
		}

		for (const include of includes) {
			if (typeof include === 'object') {
				const normalizedIncludeSource = normalize(include.source);
				info(
					`Searching for "${normalizedIncludeSource}" (${include.source})...`
				);
				const globbedPaths = await glob(include.source, {
					absolute: true,
					cwd: repositoryRoot,
					nodir: true,
					realpath: true
				});
				const resolvedTarget = join(
					repositoryRoot,
					bundleOutputDirectory,
					include.target
				);
				if (globbedPaths.length > 0) {
					if (globbedPaths.length > 1) {
						await mkdirp(include.target);
					}

					info(
						`Found paths for glob '${include.source}': ${JSON.stringify(
							globbedPaths,
							null,
							2
						)}`
					);

					for (const globbedFilePath of globbedPaths) {
						const targetFilePath = await resolveGlobPath(
							globbedPaths,
							repositoryRoot,
							resolvedTarget,
							normalizedIncludeSource,
							globbedFilePath
						);
						info(`Copying ${include.source} to ${targetFilePath}`);
						await copyFile(globbedFilePath, targetFilePath);
					}
				} else {
					info(`No files found for: ${include.source}`);
				}
			}
		}

		try {
			const archiveRootName = `intersect${(platform ? `-${platform}` : '')}`;
			const archiveName = `${archiveRootName}-${name}-${version}.zip`;
			const archivePath = join(repositoryRoot, 'dist', archiveName);
			const fileHandle = await open(archivePath, 'w');
			info(`Writing '${archiveName}' to ${archivePath}`);
			const writeStream = fileHandle.createWriteStream();
			const archive = archiver('zip');

			writeStream.on('close', () => {
				info(`Wrote ${archive.pointer()}B to ${archiveName}`);
			});

			archive.on('warning', err => {
				if (err.code === 'ENOENT') {
					warning(err);
				} else {
					throw err;
				}
			});

			archive.pipe(writeStream);
			const directoryToArchive = join(repositoryRoot, bundleOutputDirectory);

			const archivedFilesGlobPath = join(directoryToArchive, '**');
			const archivedFiles = await glob(archivedFilesGlobPath, {
				absolute: true,
				cwd: repositoryRoot,
				nodir: true,
				realpath: true
			});

			const archivedFileLines = archivedFiles.map(archivedFileName => `\t${archivedFileName}`);
			info(`Adding directory to archive: ${directoryToArchive}\n${archivedFileLines.join('\n')}`);
			archive.directory(directoryToArchive, false);
			await archive.finalize();

			archivePaths.push(bundleOutputDirectory);
		} catch (err) {
			return {
				ok: false,
				err: err instanceof Error ? err : new Error(err as string)
			};
		}
	}

	return {
		ok: true,
		value: archivePaths
	};
}
