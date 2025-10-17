import type { ValueOf } from 'ts-essentials';
import { expect, test } from 'vitest';
import * as Y from 'yjs';
import { MapSynchronizer } from './map-synchronizer.svelte.js';

type ComplexObject = {
	title: string;
	sections: {
		title: string;
		paragraphs: string[];
	}[];
};

test('Initialize complex object', () => {
	const yjsDocument = new Y.Doc();
	const yjsMap = yjsDocument.getMap<ValueOf<ComplexObject>>();

	const synchronizer = new MapSynchronizer<ComplexObject>(yjsMap, {
		title: 'Example document',
		sections: [
			{
				title: 'First section',
				paragraphs: ['Lorem ipsum']
			}
		]
	});

	const document = synchronizer.asTrap();

	expect(document).toEqual({
		title: 'Example document',
		sections: [
			{
				title: 'First section',
				paragraphs: ['Lorem ipsum']
			}
		]
	});

	expect(yjsMap.toJSON()).toEqual(document);

	expect([...yjsMap.keys()]).toEqual(['title', 'sections']);
	expect(yjsMap.get('title')).toEqual('Example document');

	const yjsSections = yjsMap.get('sections') as unknown as Y.Array<Y.Map<unknown>>;
	expect(yjsSections).toBeInstanceOf(Y.Array);
	expect(yjsSections).toHaveLength(1);

	const yjsSection = yjsSections.get(0);
	expect(yjsSection).toBeInstanceOf(Y.Map);
	expect([...yjsSection.keys()]).toEqual(['title', 'paragraphs']);
	expect(yjsSection.get('title')).toEqual('First section');

	const yjsSectionParagraphs = yjsSection.get('paragraphs') as Y.Array<string>;
	expect(yjsSectionParagraphs).toBeInstanceOf(Y.Array);
	expect(yjsSectionParagraphs).toHaveLength(1);
	expect(yjsSectionParagraphs.toArray()).toEqual(['Lorem ipsum']);
});

test('Modify complex object', () => {
	const yjsDocument = new Y.Doc();
	const yjsMap = yjsDocument.getMap<ValueOf<Partial<ComplexObject>>>();

	const synchronizer = new MapSynchronizer<Partial<ComplexObject>>(yjsMap);
	const document = synchronizer.asTrap();

	expect(document).toEqual({});
	expect(yjsMap.toJSON()).toEqual({});

	document.title = 'Example document';
	document.sections = [
		{
			title: 'First section',
			paragraphs: ['Lorem ipsum']
		}
	];

	expect(document).toEqual({
		title: 'Example document',
		sections: [
			{
				title: 'First section',
				paragraphs: ['Lorem ipsum']
			}
		]
	});
	expect(yjsMap.toJSON()).toEqual(document);

	const firstSectionParagraphs = document.sections[0].paragraphs;
	firstSectionParagraphs.unshift('Abstract');

	document.sections.push({
		title: 'Second section',
		paragraphs: ['First paragraph', 'Second paragraph']
	});

	expect(document).toEqual({
		title: 'Example document',
		sections: [
			{
				title: 'First section',
				paragraphs: ['Abstract', 'Lorem ipsum']
			},
			{
				title: 'Second section',
				paragraphs: ['First paragraph', 'Second paragraph']
			}
		]
	});
	expect(yjsMap.toJSON()).toEqual(document);

	document.sections[1].paragraphs = ['Edited first paragraph'];

	expect(document).toEqual({
		title: 'Example document',
		sections: [
			{
				title: 'First section',
				paragraphs: ['Abstract', 'Lorem ipsum']
			},
			{
				title: 'Second section',
				paragraphs: ['Edited first paragraph']
			}
		]
	});
	expect(yjsMap.toJSON()).toEqual(document);
});
