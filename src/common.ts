export function createTopicTitleForVersion(version: string): string {
	return `v${version} Nightly Builds`;
}

export function combineVersionBuild(version: string, build: number): string {
	return `${version}.${build}`;
}

export function combineVersionBuildHash(
	version: string,
	build: number,
	hash: string
): string {
	const versionBuild = combineVersionBuild(version, build);
	return `${versionBuild}+build.${hash}`;
}
