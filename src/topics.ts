import FormData from 'form-data';

import {createTopicTitleForVersion} from './common';
import {Topic, PagedResponse, Visibility, Post} from './ipb';
import {createPostBodyForVersion} from './posts';
import {requestJson} from './requests';

export async function findTopicForVersion(
	version: string,
	forums = '312',
	authors = '5203'
): Promise<Topic | undefined> {
	const queryUrl = new URL(
		'https://www.ascensiongamedev.com/api/forums/topics'
	);
	queryUrl.searchParams.set('forums', forums);
	queryUrl.searchParams.set('authors', authors);
	queryUrl.searchParams.set('perPage', '1000');
	const response = await requestJson<PagedResponse<Topic>>(queryUrl.href);
	const topicForVersion = response.results.find(({title}) =>
		new RegExp(`^v${version} Nightly Builds$`).test(title)
	);
	return topicForVersion;
}

export async function getTopic(topicId: number): Promise<Topic> {
	const queryUrl = new URL(
		`https://www.ascensiongamedev.com/api/forums/topics/${topicId}`
	);
	const response = await requestJson<Topic>(queryUrl.href);
	return response;
}

export type CreateTopicForVersionInit = {
	forumId: number;
	authorId: number;
	hidden: Visibility;
};

const defaultCreateTopicForVersionInit: CreateTopicForVersionInit = {
	authorId: 5203,
	forumId: 312,
	hidden: Visibility.HiddenByModerator
};

export async function createTopicForVersion(
	version: string,
	initialBuild: number,
	initialHash: string,
	init: Partial<CreateTopicForVersionInit> = defaultCreateTopicForVersionInit
): Promise<Topic> {
	const queryUrl = new URL(
		'https://www.ascensiongamedev.com/api/forums/topics'
	);

	const {authorId, forumId, hidden} = {
		...defaultCreateTopicForVersionInit,
		...(init ?? {})
	};

	const formData = new FormData();
	formData.append('forum', forumId.toString());
	formData.append('title', createTopicTitleForVersion(version));
	formData.append('author', authorId.toString());
	formData.append('hidden', String(hidden));
	formData.append('prefix', 'Intersect');
	formData.append('featured', '1');
	formData.append('pinned', '1');

	const postBody = createPostBodyForVersion(version, initialBuild, initialHash);
	formData.append('post', postBody);

	const topic = await requestJson<Topic>(queryUrl, {
		method: 'POST',
		body: formData
	});

	return topic;
}

export async function updateTopicForVersion(
	version: string,
	build: number,
	hash: string,
	topicId: number
): Promise<{topic: Topic; post: Post}> {
	const existingPost = await cloneTopicPost(topicId);

	const queryUrl = new URL(
		`https://www.ascensiongamedev.com/api/forums/topics/${topicId}`
	);

	const formData = new FormData();

	const postBody = createPostBodyForVersion(version, build, hash);

	formData.append('post', postBody);

	const post = await makeTopicPost(topicId, existingPost.author.id, postBody);

	const topic = await requestJson<Topic>(queryUrl, {
		method: 'POST',
		body: formData
	});

	return {
		post,
		topic
	};
}

export async function makeTopicPost(
	topicId: number,
	authorId: number,
	postBody: string,
	date?: string
): Promise<Post> {
	const queryUrl = new URL('https://www.ascensiongamedev.com/api/forums/posts');

	const formData = new FormData();
	formData.append('topic', topicId.toString());
	formData.append('author', authorId.toString());
	formData.append('date', date ?? new Date().toISOString());
	formData.append('post', postBody);

	const post = await requestJson<Post>(queryUrl, {
		method: 'POST',
		body: formData
	});

	return post;
}

export async function cloneTopicPost(topicId: number): Promise<Post> {
	const existingTopic = await getTopic(topicId);

	const post = await makeTopicPost(
		existingTopic.id,
		existingTopic.firstPost.author.id,
		existingTopic.firstPost.content,
		existingTopic.firstPost.date
	);

	return post;
}
