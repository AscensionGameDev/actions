import { debug, getInput, setFailed } from '@actions/core';
import {
	createTopicForVersion,
	findTopicById,
	findTopicForVersion,
	updateTopicForVersion
} from './topics';
import { Visibility } from './ipb';
import { setApiKey } from './requests';
import { combineVersionBuildHash } from './common';

async function run(): Promise<void> {
	try {
		const apiKey = getInput('api-key');
		const version = getInput('version');
		const buildRaw = getInput('build');
		const hash = getInput('hash');
		const runtimeIdentifiersRaw = getInput('runtime-identifiers');
		const topicIdRaw = getInput('topic-id');

		const build = Number.parseInt(buildRaw);
		const topicId = Number.parseInt(topicIdRaw);

		const runtimeIdentifiers = runtimeIdentifiersRaw?.split(',') ?? [''];
		debug(`Posting builds for the following runtime identifiers: ${runtimeIdentifiers.join(',') || 'None specified'}`);

		setApiKey(apiKey);

		let topic = await findTopicById(topicId);
		if (topic) {
			debug(`Found topic with id '${topicId}', will skip looking for a topic matching version '${version}'.`);
		} else {
			debug(`Did not find topic with id '${topicId}', looking for topic for version '${version}'...`);
			topic = await findTopicForVersion(version);
		}

		if (topic) {
			const { post, topic: updatedTopic } = await updateTopicForVersion(
				version,
				build,
				hash,
				topic.id,
				runtimeIdentifiers
			);
			debug(
				`Updated ${topic.id}/${updatedTopic.id} and created new post ${post.id
				} to replace the original for v${combineVersionBuildHash(
					version,
					build,
					hash
				)}`
			);
		} else {
			topic = await createTopicForVersion(
				version,
				build,
				hash,
				runtimeIdentifiers,
				{
					hidden: Visibility.Visible
				}
			);
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
