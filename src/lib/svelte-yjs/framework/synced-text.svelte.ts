import * as Y from 'yjs';

export const ConnectedYText: unique symbol = Symbol();

export class SyncedText {
	readonly [ConnectedYText]: Y.Text;

	#string = $state() as string;
	#delta = $state() as DeltaOperation[];
	readonly length = $derived.by(() => this.#string.length);

	constructor(initialString?: string);
	constructor(yjsText: Y.Text);
	constructor(source: string | Y.Text = '') {
		const yjsText = source instanceof Y.Text ? source : new Y.Text(source);

		this[ConnectedYText] = yjsText;

		if (typeof source === 'string') {
			this.#string = source;

			if (source.length === 0) {
				this.#delta = [];
			} else {
				this.#delta = [{ insert: source }];
			}
		} else {
			this.inferStateFromYText();
		}

		yjsText.observe(() => {
			// This is not at all optimized. Currently, the entire text delta
			// document has to be rebuilt everytime there is a change. A better
			// way would be to handle the events from this observe(...) callback
			// and modify only what's changed.
			this.inferStateFromYText();
		});
	}

	get string() {
		return this.#string;
	}

	get delta() {
		return this.#delta;
	}

	private inferStateFromYText() {
		this.#string = this[ConnectedYText].toString();
		this.#delta = this[ConnectedYText].toDelta();
	}

	insert(index: number, text: string, attributes?: object): void {
		this[ConnectedYText].insert(index, text, attributes);
	}

	insertEmbed(index: number, embed: object | Y.AbstractType<any>, attributes?: object): void {
		this[ConnectedYText].insertEmbed(index, embed, attributes);
	}

	format(index: number, length: number, attributes: object): void {
		this[ConnectedYText].format(index, length, attributes);
	}

	delete(index: number, length: number): void {
		this[ConnectedYText].delete(index, length);
	}
}

export interface InsertOperation {
	insert: string | object | Y.AbstractType<any>;
	attributes?: object;
}

export interface RetainOperation {
	retain: number;
	attributes?: object;
}

export interface DeleteOperation {
	delete: number;
}

export type DeltaOperation = InsertOperation | RetainOperation | DeleteOperation;
