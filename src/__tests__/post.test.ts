import { createPostBodyForVersion } from '../posts';

describe('posts', () => {
	describe('createPostBodyForVersion', () => {
		const currentVersion = '0.8.0-beta';
		const buildNumber = 104;
		const commitHash = 'ea049535df3586e8498f663399c8af597a0a6af7';

		test('no runtime identifiers', () => {
			expect(createPostBodyForVersion(currentVersion, buildNumber, commitHash, [])).toMatchSnapshot();
		});

		test('one runtime identifier', () => {
			expect(createPostBodyForVersion(currentVersion, buildNumber, commitHash, ['linux-x64'])).toMatchSnapshot();
		});

		test('multiple runtime identifiers', () => {
			expect(createPostBodyForVersion(currentVersion, buildNumber, commitHash, ['linux-x64', 'osx-x64', 'win-x64'])).toMatchSnapshot();
		});
	});
});
