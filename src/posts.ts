import type {Document, Element} from 'parse5/dist/tree-adapters/default';

import FormData from 'form-data';
import {serialize} from 'parse5';

import {combineVersionBuild, combineVersionBuildHash} from './common';
import {Visibility, Post} from './ipb';
import {requestJson} from './requests';

export function createPostBodyForVersion(
	version: string,
	build: number,
	hash: string
): string {
	const versionBuild = combineVersionBuild(version, build);
	const versionBuildHash = combineVersionBuildHash(version, build, hash);
	const post: Document = {
		nodeName: '#document',
		mode: 'quirks' as Document['mode'],
		childNodes: [
			{
				nodeName: 'p',
				tagName: 'p',
				attrs: [],
				namespaceURI: 'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
				childNodes: [
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null,
						sourceCodeLocation: {
							startLine: 1,
							startCol: 4,
							startOffset: 3,
							endLine: 2,
							endCol: 2,
							endOffset: 5
						}
					},
					{
						nodeName: 'span',
						tagName: 'span',
						attrs: [
							{
								name: 'style',
								value: 'font-size:1.5rem;'
							}
						],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: 'strong',
								tagName: 'strong',
								attrs: [],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value: `v${versionBuild} (`,
										parentNode: null
									},
									{
										nodeName: 'a',
										tagName: 'a',
										attrs: [
											{
												name: 'href',
												value: `https://github.com/AscensionGameDev/Intersect-Engine/releases/tag/v${versionBuild}`
											},
											{
												name: 'rel',
												value: 'external nofollow'
											}
										],
										namespaceURI:
											'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
										childNodes: [
											{
												nodeName: '#text',
												value: 'Release Notes',
												parentNode: null
											}
										],
										parentNode: null
									},
									{
										nodeName: '#text',
										value: ')',
										parentNode: null
									}
								],
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: 'br',
						tagName: 'br',
						attrs: [],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n\t \n',
						parentNode: null
					}
				],
				parentNode: null
			},
			{
				nodeName: '#text',
				value: '\n\n',
				parentNode: null
			},
			{
				nodeName: 'p',
				tagName: 'p',
				attrs: [],
				namespaceURI: 'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
				childNodes: [
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null
					},
					{
						nodeName: 'span',
						tagName: 'span',
						attrs: [
							{
								name: 'style',
								value: 'font-size:1rem;'
							}
						],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: 'strong',
								tagName: 'strong',
								attrs: [],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value: 'Downloads',
										parentNode: null
									}
								],
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n',
						parentNode: null
					}
				],
				parentNode: null
			},
			{
				nodeName: '#text',
				value: '\n\n',
				parentNode: null
			},
			{
				nodeName: 'ul',
				tagName: 'ul',
				attrs: [],
				namespaceURI: 'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
				childNodes: [
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null
					},
					{
						nodeName: 'li',
						tagName: 'li',
						attrs: [],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: '#text',
								value: '\n\t\t',
								parentNode: null
							},
							{
								nodeName: 'a',
								tagName: 'a',
								attrs: [
									{
										name: 'href',
										value: `https://github.com/AscensionGameDev/Intersect-Engine/releases/download/v${versionBuild}/intersect-${versionBuildHash}.full.zip`
									},
									{
										name: 'rel',
										value: 'external nofollow'
									}
								],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value:
											'Full (includes the new engine binaries, and all stock assets)',
										parentNode: null
									}
								],
								parentNode: null
							},
							{
								nodeName: '#text',
								value: '\n\t',
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null
					},
					{
						nodeName: 'li',
						tagName: 'li',
						attrs: [],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: '#text',
								value: '\n\t\t',
								parentNode: null
							},
							{
								nodeName: 'a',
								tagName: 'a',
								attrs: [
									{
										name: 'href',
										value: `https://github.com/AscensionGameDev/Intersect-Engine/releases/download/v${versionBuild}/intersect-${versionBuildHash}.upgrade.zip`
									},
									{
										name: 'rel',
										value: 'external nofollow'
									}
								],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value:
											'Upgrade (includes the new engine binaries, and the stock assets that have changed since the first nightly of the previous version)',
										parentNode: null
									}
								],
								parentNode: null
							},
							{
								nodeName: '#text',
								value: '\n\t',
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null
					},
					{
						nodeName: 'li',
						tagName: 'li',
						attrs: [],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: '#text',
								value: '\n\t\t',
								parentNode: null
							},
							{
								nodeName: 'a',
								tagName: 'a',
								attrs: [
									{
										name: 'href',
										value: `https://github.com/AscensionGameDev/Intersect-Engine/releases/download/v${versionBuild}/intersect-${versionBuildHash}.patch.zip`
									},
									{
										name: 'rel',
										value: 'external nofollow'
									}
								],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value: 'Patch (only includes the new engine binaries)',
										parentNode: null
									}
								],
								parentNode: null
							},
							{
								nodeName: '#text',
								value: '\n\t',
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null
					},
					{
						nodeName: 'li',
						tagName: 'li',
						attrs: [],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: '#text',
								value: '\n\t\t',
								parentNode: null
							},
							{
								nodeName: 'a',
								tagName: 'a',
								attrs: [
									{
										name: 'href',
										value: `https://github.com/AscensionGameDev/Intersect-Engine/archive/refs/tags/v${versionBuild}.zip`
									},
									{
										name: 'rel',
										value: 'external nofollow'
									}
								],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value: 'Source (.zip)',
										parentNode: null
									}
								],
								parentNode: null
							},
							{
								nodeName: '#text',
								value: '\n\t',
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n\t',
						parentNode: null
					},
					{
						nodeName: 'li',
						tagName: 'li',
						attrs: [],
						namespaceURI:
							'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
						childNodes: [
							{
								nodeName: '#text',
								value: '\n\t\t',
								parentNode: null
							},
							{
								nodeName: 'a',
								tagName: 'a',
								attrs: [
									{
										name: 'href',
										value: `https://github.com/AscensionGameDev/Intersect-Engine/archive/refs/tags/v${versionBuild}.tar.gz`
									},
									{
										name: 'rel',
										value: 'external nofollow'
									}
								],
								namespaceURI:
									'http://www.w3.org/1999/xhtml' as Element['namespaceURI'],
								childNodes: [
									{
										nodeName: '#text',
										value: 'Source (.tar.gz)',
										parentNode: null
									}
								],
								parentNode: null
							},
							{
								nodeName: '#text',
								value: '\n\t',
								parentNode: null
							}
						],
						parentNode: null
					},
					{
						nodeName: '#text',
						value: '\n',
						parentNode: null
					}
				],
				parentNode: null
			},
			{
				nodeName: '#text',
				value: '\n',
				parentNode: null
			}
		]
	};

	const postBody = serialize(post);
	return postBody;
}

export async function postNewBuildForVersion(
	version: string,
	build: number,
	hash: string,
	topicId: number,
	author = 5203,
	hidden = Visibility.HiddenByModerator
): Promise<Post> {
	const queryUrl = new URL('https://www.ascensiongamedev.com/api/forums/posts');

	const formData = new FormData();
	formData.append('topic', topicId.toString());
	formData.append('author', author.toString());
	formData.append('hidden', String(hidden));

	const postBody = createPostBodyForVersion(version, build, hash);
	formData.append('post', postBody);

	const post = await requestJson<Post>(queryUrl, {
		method: 'POST',
		body: formData
	});

	return post;
}
