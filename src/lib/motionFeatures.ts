// The animation feature set loaded by <LazyMotion> (App.tsx). `m.*` components in always-loaded code render their
// initial state immediately and animate once this small chunk arrives, instead of shipping the full `motion` runtime
// in the entry script. Pages that use the full `motion` component bundle it into their own chunks.
export { domAnimation as default } from "framer-motion";
