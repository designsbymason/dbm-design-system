import { createContext } from "react";

/**
 * Internal: lets `ListItem` know whether its ancestor `List` is rendering
 * with `marker="none"`, so it can complete the matching Safari/VoiceOver
 * `role="listitem"` fix (see `List.tsx`'s `role="list"` counterpart) —
 * `ListItem` has no other way to observe its ancestor's `marker` prop.
 */
export const ListMarkerContext = createContext(false);
