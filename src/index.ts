import Elysia from 'elysia';
import {
	ElysiaOAuthServer,
	ElysiaOAuthServerOptions,
} from './elysia.oauth.server';

import { Client as _Client, Token as _Token } from '@node-oauth/oauth2-server';

export type Client = _Client;
export type Token = _Token;

export type Oauth2Options = ElysiaOAuthServerOptions;

export const oauth2 = (options: Oauth2Options) => {
	const oauth = new ElysiaOAuthServer(options);

	return new Elysia({
		name: 'ElysiaOAuth2Server',
	}).decorate('oauth2', oauth);
};
