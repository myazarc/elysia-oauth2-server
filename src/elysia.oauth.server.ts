import NodeOAuthServer, {
	Request,
	Response,
	InvalidArgumentError,
	UnauthorizedRequestError,
	ServerOptions,
	AuthenticateOptions,
	TokenOptions,
	AuthorizeOptions,
} from '@node-oauth/oauth2-server';
import { transformRequest } from './utils';

export type ElysiaOAuthServerOptions = {
	useGlobalErrorHandler?: boolean;
} & ServerOptions;

export class ElysiaOAuthServer {
	private options: ElysiaOAuthServerOptions;

	private server: NodeOAuthServer;

	private useGlobalErrorHandler: boolean;

	constructor(options: ElysiaOAuthServerOptions) {
		this.options = options || {};

		if (!this.options.model) {
			throw new InvalidArgumentError('Missing parameter: `model`');
		}

		this.useGlobalErrorHandler = !!this.options.useGlobalErrorHandler;
		delete this.options.useGlobalErrorHandler;

		this.server = new NodeOAuthServer(this.options);
	}

	/**
	 * Authentication Middleware.
	 *
	 * Returns a middleware that will validate a token.
	 *
	 * (See: https://tools.ietf.org/html/rfc6749#section-7)
	 */
	async authenticate(handler: any, options: AuthenticateOptions = {}) {
		const request = transformRequest(handler);
		const response = new Response();

		let token;
		try {
			token = await this.server.authenticate(request, response, options);
		} catch (err: any) {
			return this._handleError(handler, err);
		}

		return {
			success: true,
			message: 'ok',
			data: token,
		};
	}
	/**
	 * Authorization Middleware.
	 *
	 * Returns a middleware that will authorize a client to request tokens.
	 *
	 * (See: https://tools.ietf.org/html/rfc6749#section-3.1)
	 */

	async authorize(handler: any, options: AuthorizeOptions = {}) {
		const request = transformRequest(handler);
		const response = new Response();

		let code;
		try {
			code = await this.server.authorize(request, response, options);
		} catch (err: any) {
			return this._handleError(handler, err);
		}
		return this._handleResponse(handler, response);
	}

	/**
	 * Authorization Middleware.
	 *
	 * Returns a middleware that will authorize a client to request tokens.
	 *
	 * (See: https://tools.ietf.org/html/rfc6749#section-3.1)
	 */

	async token(handler: any, options: TokenOptions = {}) {
		const request = transformRequest(handler);
		const response = new Response();

		let token;
		try {
			token = await this.server.token(request, response, options);
		} catch (err: any) {
			return this._handleError(handler, err);
		}

		return {
			success: true,
			message: 'ok',
			data: token,
		};
	}

	/**
	 * Grant Middleware.
	 *
	 * Returns middleware that will grant tokens to valid requests.
	 *
	 * (See: https://tools.ietf.org/html/rfc6749#section-3.2)
	 */

	_handleResponse(handler: any, oauthResponse: Response) {
		if (oauthResponse.status === 302) {
			const location = oauthResponse?.headers?.location;
			delete oauthResponse?.headers?.location;
			handler.set.headers = oauthResponse.headers;
			handler.set.status = oauthResponse.status;
			handler.set.redirect = location;
			return;
		}
		handler.set.headers = oauthResponse.headers;
		handler.set.status = oauthResponse.status;
		return oauthResponse.body;
	}

	/**
	 * Handles errors depending on the options of `this.useErrorHandler`.
	 * Either calls `next()` with the error (so the application can handle it), or returns immediately a response with the error.
	 */

	_handleError(handler: any, error: any) {
		if (this.useGlobalErrorHandler) {
			return error;
		}

		handler.set.status = error?.code || 500;

		if (error instanceof UnauthorizedRequestError) {
			return {
				success: false,
				message: error.message || 'Unauthorized',
				data: null,
			};
		}

		return {
			success: false,
			message: error.message || 'Internal Server Error',
			data: null,
		};
	}
}
