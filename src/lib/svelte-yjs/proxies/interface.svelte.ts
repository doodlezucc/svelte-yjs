import * as Y from 'yjs';

type YEventOf<T> = T extends Y.AbstractType<infer YEvent> ? YEvent : never;

export abstract class Synchronizer<TType, YType extends Y.AbstractType<any> = Y.AbstractType<any>> {
	readonly inYjs: YType;
	abstract readonly inSvelte: TType;

	constructor(inYjs: YType) {
		this.inYjs = inYjs;
		this.inYjs.observe((event, transaction) => {
			if (!transaction.local) {
				this.handleRemoteUpdate(event);
			}
		});
	}

	abstract handleRemoteUpdate(event: YEventOf<YType>): void;

	abstract asTrap(): TType;
}
