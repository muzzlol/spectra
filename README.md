# spectra

Spectra is a multiplayer game where users battle openly in an arena where everyone can see each other's work live. 

There are 3 battle types planned: 
- draw : excalidraw canvas where users sketch out the best drawing of a choosen picture/diagram and voters vote for the best at the end.
- code : self-explanatory - coming soon
- typing test : self-explanatory - coming soon

There are diff modes:
- pvp : upto 4 players
- duo mode : 2v2

This is made possible with convex for a reactive database backend, tanstack-start serving as a meta-framework for react, and cloudflare's Durable Objects for the wss that enables the live arenas.

## dev setup

npm - pnpm - bun |
npx - bunx

### login to cf wrangler if haven't already
```bash
bunx wrangler login
```

### login to convex if havne't already
```bash
bunx convex login
```

### run project locally

```bash
bun i
```

#### both f.e and b.e
```bash
bun run dev 
```
or
#### running seperately
```bash
bun run dev:web
bun run dev:convex
```


### deploy the project
```bash
bun run deploy
```


![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/muzzlol/spectra?utm_source=oss&utm_medium=github&utm_campaign=muzzlol%2Fspectra&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)