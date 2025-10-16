import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

export function createHocuspocusProvider(doc: Y.Doc) {
	return new HocuspocusProvider({
		url: 'ws://127.0.0.1:5174',
		name: 'demo-document',
		document: doc,
		onSynced: ({ state }) => {
			doc.emit('sync', [state, doc]);
		}
	});
}
