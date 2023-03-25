import fetch, {Headers, RequestInfo, RequestInit, Response} from 'node-fetch';

let _apiKey: string;

export function setApiKey(apiKey: string): void {
	_apiKey = apiKey;
}

export async function request(
	requestLike: RequestInfo | URL,
	init?: RequestInit | undefined
): Promise<Response> {
	const safeInit = init ?? {};
	const method = safeInit?.method ?? 'GET';
	const requestHeaders = new Headers(safeInit.headers);
	requestHeaders.append(
		'authorization',
		`Basic ${Buffer.from(`${_apiKey}:`, 'utf8').toString('base64url')}`
	);
	const response = await fetch(requestLike, {
		...safeInit,
		method,
		body: safeInit.body,
		headers: requestHeaders
	});

	if (!response.ok) {
		const contentLength = Number.parseInt(
			response.headers.get('content-length') ?? ''
		);
		if (Number.isNaN(contentLength) || contentLength < 1) {
			throw new Error(
				`${method} ${response.url} ${response.status}: ${response.statusText}`
			);
		}

		const responseBody = await response.text();
		throw new Error(
			`${method} ${response.url} ${response.status}: ${response.statusText}\n${responseBody}`
		);
	}

	return response;
}

export async function requestJson<TResponseBody>(
	requestLike: RequestInfo | URL,
	init?: RequestInit | undefined
): Promise<TResponseBody> {
	const response = await request(requestLike, init);
	return await response.json();
}
