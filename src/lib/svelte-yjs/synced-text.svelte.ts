const IsSyncedText: unique symbol = Symbol();

export class SyncedText {
	// This prevents users from accidentally using Y.Text instead.
	private [IsSyncedText] = true;

	insert(index: number, text: string, attributes?: Record<string, unknown>): void {}
}
