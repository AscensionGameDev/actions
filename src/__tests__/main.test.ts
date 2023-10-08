import dotenv from 'dotenv';
import { open } from 'fs/promises';
import { join } from 'path';

import { request, setApiKey } from '../requests';

import { createTopicTitleForVersion } from '../common';
import { Member, Post, Topic } from '../ipb';
import { postNewBuildForVersion } from '../posts';
import {
	createTopicForVersion,
	findTopicForVersion,
	updateTopicForVersion
} from '../topics';

let runAgainstServer = false;

beforeAll(async () => {
	const fh = await open(join(__dirname, '..', '..', '.env'));
	const dotenvRaw = await fh.readFile('utf8');
	const env = dotenv.parse(dotenvRaw);
	const apiKey = env['INTERSECTBOT_FORUM_POST_API_KEY'];
	runAgainstServer = !!apiKey;
	setApiKey(apiKey);
});

(runAgainstServer ? describe : describe.skip)('topic', () => {
	const testRealTopicId = 6746;
	const testRealVersion = '0.7.2-beta';
	// const testRealBuild = 2;
	// const testRealHash = '7a017dcf7b21722063c52a79ad8dd16ad2e20de2';
	// const testVersionBuild = `${testRealVersion}.${testRealBuild}`;
	// const testVersionBuildHash = `${testVersionBuild}+build.${testRealHash}`;

	it('find no topic for version that does not exist', async () => {
		await expect(findTopicForVersion('doesnotexist')).resolves.toBeUndefined();
	});

	it('finds the topic for the known real version', async () => {
		const topicPromise = findTopicForVersion(testRealVersion);
		await expect(topicPromise).resolves.toMatchObject({
			id: testRealTopicId,
			title: createTopicTitleForVersion(testRealVersion)
		} as Partial<Topic>);
	});

	it('create topic for test-generated version', async () => {
		try {
			const version = `${99 + Math.floor(Math.random() * 10)}.${Math.floor(
				Math.random() * 10
			)}.${Math.floor(Math.random() * 10)}`;
			const buildNumber = 999 + Math.floor(Math.random() * 10000);
			const hash = `${Math.floor(Math.random() * 10000)}fakehash`;
			const topicPromise = createTopicForVersion(version, buildNumber, hash, ['linux-x64']);
			await expect(topicPromise).resolves.toMatchObject({
				id: expect.any(Number),
				title: createTopicTitleForVersion(version),
				firstPost: expect.objectContaining({
					id: expect.any(Number),
					author: expect.objectContaining({
						id: 5203,
						name: 'intersectbot'
					} as Partial<Member>)
				} as Partial<Post>),
				hidden: true
			} as Partial<Topic & { hidden: boolean }>);

			const topic = await topicPromise;
			await request(
				`https://www.ascensiongamedev.com/api/forums/topics/${topic.id}`,
				{ method: 'DELETE' }
			);
		} finally {
			// Do nothing
		}
	});

	it('create post on real version', async () => {
		try {
			const postPromise = postNewBuildForVersion(
				testRealVersion,
				99990 + Math.floor(Math.random() * 10),
				'faketesthash',
				['linux-x64'],
				testRealTopicId,
			);
			await expect(postPromise).resolves.toMatchObject({
				// eslint-disable-next-line camelcase
				item_id: testRealTopicId
			} as Partial<Post>);

			const post = await postPromise;
			await request(
				`https://www.ascensiongamedev.com/api/forums/posts/${post.id}`,
				{ method: 'DELETE' }
			);
		} finally {
			// Do nothing
		}
	});

	it('create post on test-generated topic', async () => {
		let topic: Topic | undefined = undefined;
		try {
			const version = `${99 + Math.floor(Math.random() * 10)}.${Math.floor(
				Math.random() * 10
			)}.${Math.floor(Math.random() * 10)}`;
			const buildNumber = 999 + Math.floor(Math.random() * 10000);
			const hash = `${Math.floor(Math.random() * 10000)}fakehash`;
			topic = await createTopicForVersion(version, buildNumber, hash, ['linux-x64']);

			const postPromise = postNewBuildForVersion(
				version,
				99990 + Math.floor(Math.random() * 10),
				'faketesthash',
				['linux-x64'],
				topic.id,
			);
			await expect(postPromise).resolves.toMatchObject({
				// eslint-disable-next-line camelcase
				item_id: topic.id
			} as Partial<Post>);

			const post = await postPromise;
			await request(
				`https://www.ascensiongamedev.com/api/forums/posts/${post.id}`,
				{ method: 'DELETE' }
			);
		} finally {
			try {
				if (topic !== undefined) {
					await request(
						`https://www.ascensiongamedev.com/api/forums/topics/${topic.id}`,
						{ method: 'DELETE' }
					);
				}
			} finally {
				// Do nothing
			}
		}
	});

	it('update post on test-generated topic', async () => {
		try {
			const version = `${99 + Math.floor(Math.random() * 10)}.${Math.floor(
				Math.random() * 10
			)}.${Math.floor(Math.random() * 10)}`;
			const buildNumber = 999 + Math.floor(Math.random() * 10000);
			const hash = `${Math.floor(Math.random() * 10000)}fakehash`;
			const topic = await createTopicForVersion(version, buildNumber, hash, ['linux-x64']);

			const updatedBuild = 99990 + Math.floor(Math.random() * 10);
			const updatedHash = 'fakeupdatedtesthash';
			const updatedVersionBuild = `${version}.${updatedBuild}`;
			const updatedVersionBuildHash = `${updatedVersionBuild}+build.${updatedHash}`;

			const topicUpdatePromise = updateTopicForVersion(
				version,
				updatedBuild,
				updatedHash,
				topic.id,
				['linux-x64'],
			);
			await expect(topicUpdatePromise).resolves.toMatchObject({
				post: {
					// eslint-disable-next-line camelcase
					item_id: topic.id,
					date: topic.firstPost.date
				} as Post,
				topic: {
					id: topic.id,
					title: createTopicTitleForVersion(version),
					firstPost: expect.objectContaining({
						id: topic.firstPost.id,
						author: expect.objectContaining({
							id: 5203,
							name: 'intersectbot'
						} as Partial<Member>),
						content: expect.stringContaining(
							`https://github.com/AscensionGameDev/Intersect-Engine/releases/download/v${updatedVersionBuild}/intersect-${updatedVersionBuildHash}.full.zip`
						)
					} as Partial<Post>),
					hidden: true
				} as Partial<Topic & { hidden: boolean }>
			});
			// await expect(topicUpdatePromise).resolves.not.toMatchObject({
			// 	post: {
			// 		id: topic.firstPost.id
			// 	}
			// });
			// await request(
			// 	`https://www.ascensiongamedev.com/api/forums/topics/${topic.id}`,
			// 	{method: 'DELETE'}
			// );
		} finally {
			// Do nothing
		}
	});
});
