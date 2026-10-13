import type { CommunityComment, CommunityPost } from "./rules";

/** Visual indent levels stop here; deeper replies stay in the last column, so a long chain never squeezes the text. */
export const MAX_INDENT_DEPTH = 5;

export interface CommentNode {
  comment: CommunityComment;
  /** Real depth in the reply chain (0 = top level). The indent is `min(depth, MAX_INDENT_DEPTH)`. */
  depth: number;
  children: CommentNode[];
  /** Every reply beneath this one, however deep. */
  descendants: number;
}

/**
 * Groups a flat, oldest-first comment list by `parent_id`. A reply whose parent is not in the list (deleted, removed,
 * held, or on a page that hasn't loaded) is shown at the top level rather than disappearing.
 */
export const buildCommentTree = (comments: readonly CommunityComment[]): CommentNode[] => {
  const nodes = new Map<string, CommentNode>();
  for (const comment of comments) nodes.set(comment.id, { comment, depth: 0, children: [], descendants: 0 });
  const roots: CommentNode[] = [];
  for (const comment of comments) {
    const node = nodes.get(comment.id)!;
    const parent = comment.parent_id && comment.parent_id !== comment.id ? nodes.get(comment.parent_id) : undefined;
    // A parent that appears later in the list would mean a cycle; parents are always older, so treat it as top level.
    if (parent && parent !== node && !isAncestor(nodes, node, parent)) parent.children.push(node);
    else roots.push(node);
  }
  const settle = (node: CommentNode, depth: number): number => {
    node.depth = depth;
    node.descendants = node.children.reduce((n, child) => n + 1 + settle(child, depth + 1), 0);
    return node.descendants;
  };
  roots.forEach((root) => settle(root, 0));
  return roots;
};

const isAncestor = (nodes: Map<string, CommentNode>, maybeAncestor: CommentNode, of: CommentNode): boolean => {
  const seen = new Set<string>();
  let current: CommentNode | undefined = of;
  while (current && !seen.has(current.comment.id)) {
    if (current === maybeAncestor) return true;
    seen.add(current.comment.id);
    const parentId: string | null = current.comment.parent_id;
    current = parentId ? nodes.get(parentId) : undefined;
  }
  return false;
};

/** The "[ + ] handle (2 replies collapsed)" line. */
export const collapsedSummary = (name: string, replies: number): string =>
  replies === 0 ? `${name} (collapsed)` : `${name} (${replies} ${replies === 1 ? "reply" : "replies"} collapsed)`;

/**
 * The [OP] pill. Comments don't carry an author id (names are resolved server-side), so a comment is OP's when it is
 * mine and so is the post, or when neither is mine and the displayed name and role match.
 */
export const isOriginalPoster = (post: Pick<CommunityPost, "is_mine" | "author_name" | "author_role">, comment: Pick<CommunityComment, "is_mine" | "author_name" | "author_role">): boolean =>
  post.is_mine || comment.is_mine ? post.is_mine && comment.is_mine : post.author_name === comment.author_name && post.author_role === comment.author_role;
