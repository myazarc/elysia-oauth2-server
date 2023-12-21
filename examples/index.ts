import { Elysia, t } from 'elysia';
import {
	Oauth2Options,
	oauth2,
	Client,
	Token,
} from '@myazarc/elysia-oauth2-server';

const clients: Client[] = [
	{
		id: 'clientId1',
		clientSecret: 'client@secret',
		redirectUris: ['http://localhost:3000'],
		// only those allowed
		grants: [
			'password',
			'authorization_code',
			'client_credentials',
			'refresh_token',
		],
	},
];
const users = [{ id: '123', username: 'mira', password: '12345' }];

const tokens: any[] = [];
const codes: any[] = [];

const oauth2Opts: Oauth2Options = {
	model: {
		//#region all
		getAccessToken: async (accessToken: string) => {
			return tokens.find((token) => token.accessToken === accessToken);
		},
		getClient: async (clientId: string, clientSecret: string) => {
			if (clientSecret === null) {
				const client = clients.find((client) => client.id === clientId);
				return client;
			}

			const client = clients.find(
				(client) =>
					client.id === clientId && client.clientSecret === clientSecret,
			);
			return client;
		},
		getUser: async (username: string, password: string) => {
			return users.find(
				(user) => user.username === username && user.password === password,
			);
		},
		saveToken: async (token: any, client: any, user: any) => {
			const tokenData: Token = {
				accessToken: token.accessToken,
				accessTokenExpiresAt: token.accessTokenExpiresAt,
				refreshToken: token.refreshToken,
				refreshTokenExpiresAt: token.refreshTokenExpiresAt,
				client: {
					id: client.id,
					grants: client.grants,
				},
				user: {
					id: user.id,
				},
			};

			tokens.push(tokenData);

			return tokenData;
		},

		//#endregion

		//#region authorization code
		saveAuthorizationCode: async (code: any, client: any, user: any) => {
			codes.push({
				...code,
				client: {
					id: client.id,
					grants: client.grants,
				},
				user: {
					id: user.id,
				},
			});
			return code;
		},

		getAuthorizationCode: async (authorizationCode: string) => {
			const a = codes.find(
				(code) => code.authorizationCode === authorizationCode,
			);
			return a;
		},
		revokeAuthorizationCode: async (code: any) => {
			const index = codes.findIndex(
				(c) => c.authorizationCode === code.authorizationCode,
			);
			codes.splice(index, 1);
			return true;
		},

		//#endregion

		//#region client credentials
		getUserFromClient: async (client: any) => {
			// TODO: find related user
			return users[0];
		},

		//#endregion

		//#region refresh token
		getRefreshToken: async (refreshToken: string) => {
			return tokens.find((token) => token.refreshToken === refreshToken);
		},

		revokeToken: async (token: any) => {
			const index = tokens.findIndex(
				(t) => t.accessToken === token.accessToken,
			);
			tokens.splice(index, 1);
			return true;
		},

		//#endregion
	},
};

new Elysia()
	.use(oauth2(oauth2Opts)) // oauth2 wrapper
	.post(
		// getting token
		'/oauth2/token',
		({ oauth2, ...payload }) => {
			return oauth2.token(payload);
		},
		{
			headers: t.Object({
				// Example: "Basic " + Buffer.from("clientId1:client@secret").toString("base64"),
				authorization: t.String(),
			}),
			body: t.Object({
				username: t.Optional(t.String()),
				password: t.Optional(t.String()),
				grant_type: t.String({
					examples: [
						'password',
						'refresh_token',
						'client_credentials',
						'authorization_code',
					],
				}),
				code: t.Optional(t.String()),
				redirect_uri: t.Optional(t.String()),
				refresh_token: t.Optional(t.String()),
			}),
		},
	)
	.post(
		// verifing token
		'/oauth2/authenticate',
		({ oauth2, ...payload }) => {
			return oauth2.authenticate(payload);
		},
		{
			headers: t.Object({
				// Example: "Basic " + Buffer.from("clientId1:client@secret").toString("base64"),
				authorization: t.String(),
			}),
			body: t.Object({
				token: t.String(),
			}),
		},
	)
	.post(
		// checking credentials
		'/oauth2/authorize',
		({ oauth2, ...payload }) => {
			return oauth2.authorize(payload, {
				// TODO: implement.
				authenticateHandler: {
					handle: (request: any) => {
						return { id: '123' };
					},
				},
			});
		},
		{
			body: t.Object({
				client_id: t.String(),
				response_type: t.String({
					examples: ['code', 'token'],
				}),
				state: t.String(),
				redirect_uri: t.String(),
			}),
		},
	)
	.listen(3000);
