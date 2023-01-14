import type { LinkedEntitiesT } from '../types/MBS/scripts/release';
import type {
	DialogActionT,
	RelationshipEditorActionT,
	ReleaseRelationshipEditorActionT,
} from '../types/MBS/scripts/relationship-editor/actions';
import type {
	RelationshipDialogStateT,
	RelationshipEditorStateT,
	ReleaseRelationshipEditorStateT,
	SeededRelationshipT,
} from '../types/MBS/scripts/relationship-editor/state';

import * as Tree from 'weight-balanced-tree';

declare global {
	namespace MB {
		function entity(data: CoreEntityT, type?: CoreEntityTypeT): CoreEntityT;
		// function entity(data: CoreEntityT, type?: CoreEntityTypeT): CoreEntityT & Record<string,any>;

		function getSourceEntityInstance(): CoreEntityT;

		const linkedEntities: Partial<LinkedEntitiesT>;

		const relationshipEditor: {
			readonly dispatch: (action: RelationshipEditorActionT | ReleaseRelationshipEditorActionT) => void;
			readonly state: RelationshipEditorStateT | ReleaseRelationshipEditorStateT;
			readonly relationshipDialogDispatch?: (action: DialogActionT) => void;
			readonly relationshipDialogState?: RelationshipDialogStateT;
			readonly getRelationshipStateId: (relationship: RelationshipT | SeededRelationshipT | null) => number;
		};

		const tree: typeof Tree;
	}
}
