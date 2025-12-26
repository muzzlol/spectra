## TypeScript

- MAKE use of function guards wherenver possible.
- Try to keep things in one function unless composable or reusable
- Type checking is strict - resolve all TypeScript errors 
- DO NOT do unnecessary destructuring of variables
- DO NOT use `else` statements unless necessary
- DO NOT use `try`/`catch` if it can be avoided
- AVOID using `any` type
- AVOID `let` statements
- PREFER single word variable names where possible
- Only create an abstraction if it's actually needed
- Prefer clear function/variable names over inline comments
- use bun as package manager and don't edit package.json manually, use bun commands.

## React

- Avoid massive JSX blocks and compose smaller components
- Colocate code that changes together
- Avoid `useEffect` unless absolutely needed


## Tailwind

- Follow best practices
- Avoid unnecessary utilities - keep it as minimal as possible
- Utilize custom themes - create if needed
- Always use v4 + global CSS file format + shadcn/ui