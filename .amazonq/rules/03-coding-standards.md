# 03 — Coding Standards

## TypeScript

**Configuration**: `tsconfig.app.json` (not `tsconfig.json` - that's a no-op)

```json
{
  "compilerOptions": {
    "strict": false,
    "strictNullChecks": true  // Required by TanStack Router
  }
}
```

**Run typecheck**: `npx tsc -p tsconfig.app.json --noEmit`

### TypeScript Patterns

- Use explicit types for function parameters and returns
- Avoid `any` - use `unknown` and narrow
- Use Zod schemas for validation, infer types from schemas
- Optional RPC args: pass `undefined` (not `null`)
- Import types from `@supabase/supabase-js` generated types

### Type Generation

**Supabase types**: `src/integrations/supabase/types.ts`

- Generated from live DB schema (not hand-edited)
- Regenerate after migrations: MCP tool `mcp__Supabase__generate_typescript_types`
- Never manually extend this file

## React Patterns

### Component Structure

```typescript
// 1. Imports
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface MyComponentProps {
  userId: string;
  onSave?: () => void;
}

// 3. Component
export const MyComponent = ({ userId, onSave }: MyComponentProps) => {
  // 4. Hooks (top of component body)
  const [state, setState] = useState();
  const { data } = useQuery(...);
  
  // 5. Event handlers
  const handleClick = () => { ... };
  
  // 6. Render
  return <div>...</div>;
};
```

### Lazy Loading

**Always use `lazyWithRetry`** (not `React.lazy`):

```typescript
import { lazyWithRetry } from "@/lib/chunkRecovery";

const AdminDashboard = lazyWithRetry(() => import("@/pages/AdminDashboard"));
```

Handles chunk failures gracefully during deployment updates.

### Hooks

**Custom hooks** go in `src/hooks/`:

- Name with `use` prefix
- Return object with clear names (not tuple)
- Document return types

```typescript
export const useMyFeature = () => {
  return {
    data,
    isLoading,
    error,
    refetch
  };
};
```

### State Management

- **React Query** for server state (preferred)
- **useState/useReducer** for local UI state
- **Zustand** for cross-component state (selective)
- **Context** for theming, auth, cart (avoid for frequent updates)

## File Organization

```
src/
├── components/
│   ├── ui/               # shadcn primitives (don't edit directly)
│   ├── [feature]/        # Feature-specific components
│   └── [ComponentName].tsx
├── pages/                # SPA route pages
├── routes/               # SSR route files (TanStack Start)
├── hooks/                # Custom hooks
├── lib/                  # Pure utility functions
├── data/                 # Static data files
├── integrations/
│   └── supabase/         # Supabase client + types
└── App.tsx               # SPA router + providers
```

### Naming Conventions

- **Components**: PascalCase (`UserDashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (`use-membership.ts`)
- **Utils**: camelCase (`authDialogCopy.ts`)
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## Component Patterns

### UI Components

**Use shadcn/ui primitives** (`src/components/ui/`):

- Don't edit ui/ files directly (they're regenerated)
- Compose with CVA for variants
- Use `cn()` for className merging

```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

<Button 
  variant="outline" 
  className={cn("gradient-border-anim", isActive && "border-transparent")}
>
  Click me
</Button>
```

### Feature Components

Keep feature-specific components in subdirectories:

- `src/components/dashboard/` (dashboard features)
- `src/components/ai-formulator/` (SKYNN AI)
- `src/components/marketplace/` (OpenHaus)
- `src/components/payments/` (checkout)

## Error Handling

### Try-Catch Patterns

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  toast.error("Something went wrong. Please try again.");
  // Never expose internal errors to users
}
```

### Error Boundaries

- `AppErrorBoundary` wraps the entire app
- Resets on navigation
- Logs to console (production: should log to service)

## Async Operations

### React Query

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["user", userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) throw error;
    return data;
  }
});
```

### Mutations

```typescript
const mutation = useMutation({
  mutationFn: async (input) => {
    const { data, error } = await supabase
      .from("table")
      .insert(input);
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["relevant-key"] });
    toast.success("Saved successfully");
  }
});
```

## Environment Variables

**Client-side**: Must have `VITE_` prefix

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

**Never commit**: API keys, secrets, tokens
**Use**: `.env.example` for documentation
