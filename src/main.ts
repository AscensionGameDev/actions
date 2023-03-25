import {debug, getInput, setFailed} from '@actions/core';
import {
	createTopicForVersion,
	findTopicForVersion,
	updateTopicForVersion
} from './topics';
import {Visibility} from './ipb';
import {setApiKey} from './requests';
import {combineVersionBuildHash} from './common';

async function run(): Promise<void> {
	try {
		const apiKey = getInput('api-key');
		const version = getInput('version');
		const buildRaw = getInput('build');
		const build = Number.parseInt(buildRaw);
		const hash = getInput('hash');

		setApiKey(apiKey);

		let topic = await findTopicForVersion(version);
		if (topic) {
			const {post, topic: updatedTopic} = await updateTopicForVersion(
				version,
				build,
				hash,
				topic.id
			);
			debug(
				`Updated ${topic.id}/${updatedTopic.id} and created new post ${
					post.id
				} to replace the original for v${combineVersionBuildHash(
					version,
					build,
					hash
				)}`
			);
		} else {
			topic = await createTopicForVersion(version, build, hash, {
				hidden: Visibility.Visible
			});
			debug(
				`Created new post ${topic.id} for v${combineVersionBuildHash(
					version,
					build,
					hash
				)}`
			);
		}
	} catch (err) {
		setFailed(err as string | Error);
	}
}

run();
