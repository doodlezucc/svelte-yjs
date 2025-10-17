import { building } from '$app/environment';
import { Server } from '@hocuspocus/server';

declare const globalThis: {
	__webSocketServer?: Server;
};

if (globalThis.__webSocketServer) {
	console.log('Closing WebSocket server');
	await globalThis.__webSocketServer.destroy();
}

export let webSocketServer: Server;

if (!building) {
	const webSocketServer = new Server({ port: 5174 });

	globalThis.__webSocketServer = webSocketServer;

	await webSocketServer.listen();
	console.log('Started WebSocket server');
}
