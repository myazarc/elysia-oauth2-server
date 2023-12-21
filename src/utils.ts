import { Request } from '@node-oauth/oauth2-server';

export const transformRequest = (handler: any): Request => {
	const _headers = handler.request.headers;
	const headers: HeadersInit = {};
	_headers.forEach((v: string, k: string) => (headers[k] = v));

	return new Request({
		headers: {
			...headers,
			'content-type': 'application/x-www-form-urlencoded',
		},
		query: handler.request.query || {},
		body: handler.body,
		method: handler.request.method,
	});
};
