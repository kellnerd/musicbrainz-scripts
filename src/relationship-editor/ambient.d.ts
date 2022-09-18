import type {
	DialogActionT,
	RelationshipEditorActionT,
	ReleaseRelationshipEditorActionT,
} from '../types/MBS/scripts/relationship-editor/actions';
import type {
	RelationshipDialogStateT,
	RelationshipEditorStateT,
	ReleaseRelationshipEditorStateT,
} from '../types/MBS/scripts/relationship-editor/state';

declare global {
	namespace MB {
		const relationshipEditor: {
			readonly dispatch: (action: RelationshipEditorActionT | ReleaseRelationshipEditorActionT) => void;
			readonly state: RelationshipEditorStateT | ReleaseRelationshipEditorStateT;
			readonly relationshipDialogDispatch?: (action: DialogActionT) => void;
			readonly relationshipDialogState?: RelationshipDialogStateT;
		};
	}
}
