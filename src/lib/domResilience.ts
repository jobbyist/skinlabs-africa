/**
 * Makes React tolerant of third-party code that mutates DOM it owns.
 *
 * AdSense (Auto ads / anchor / vignette formats), browser auto-translate and
 * some extensions insert or wrap nodes inside React-managed elements. The next
 * time React re-renders that subtree (commonly right after the tab regains
 * focus and data refetches), it calls removeChild/insertBefore against a node
 * whose parent has changed, throws a NotFoundError, and unmounts the whole
 * app — the "page looks broken after switching back to the browser" symptom.
 *
 * This is the widely used mitigation from facebook/react#11538: skip the
 * operation instead of throwing when the node is no longer where React
 * expects it. It only changes behaviour in the exact case that would
 * otherwise crash.
 */
export const installDomResilience = () => {
  if (typeof Node !== "function" || !Node.prototype) return;
  const proto = Node.prototype as Node & { __skinlabsPatched?: boolean };
  if (proto.__skinlabsPatched) return;
  proto.__skinlabsPatched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) console.warn("[dom-resilience] Skipped removeChild of a node moved by third-party code.", child);
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) console.warn("[dom-resilience] Skipped insertBefore with a reference node moved by third-party code.", referenceNode);
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
};
