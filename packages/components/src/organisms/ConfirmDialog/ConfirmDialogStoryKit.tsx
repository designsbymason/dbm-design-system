// The stage the stories draw an open dialog inside: the same box `AlertDialog`'s stories use (every `<Canvas>` on
// a Docs page shares one document, so a modal's fixed scrim would otherwise cover the whole page), re-exported so
// this folder's stories read from their own kit.
export { AlertStage as ConfirmStage } from "../AlertDialog/AlertDialogStoryKit";
