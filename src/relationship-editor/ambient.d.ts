import type {
	DialogActionT,
	RelationshipEditorActionT,
} from '../types/MBS/scripts/relationship-editor/actions';
import type {
	RelationshipDialogStateT,
	RelationshipEditorStateT,
} from '../types/MBS/scripts/relationship-editor/state';

declare global {
	namespace MB {
		const relationshipEditor: {
			readonly dispatch: (action: RelationshipEditorActionT) => void;
			readonly state: RelationshipEditorStateT;
			readonly relationshipDialogDispatch: (action: DialogActionT) => void;
			readonly relationshipDialogState: RelationshipDialogStateT;
		};
	}
}
