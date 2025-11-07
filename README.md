# spectra

Spectra is a multiplayer game where users battle openly in an arena where everyone can see each other's work live. 

There are 3 battle types planned: 
- draw : excalidraw canvas where users sketch out the best drawing of a choosen picture/diagram and voters vote for the best at the end
- code : self-explanatory but coming soon
- typing test : self-explanatory but coming soon

There are diff modes:
- pvp : upto 4 players
- duo mode : 2v2

This is made possible with convex for a reactive database backend, tanstack start serving as a meta-framework for react and cloudflare's Durable Objects for real-time the wss func.

npm - pnpm - bun
npx - bunx

## login to cf wrangler if haven't already
```bash
npx wrangler login
```

## login to convex if havne't already
```bash
npx convex login
```

## run project locally
### both f.e and b.e
```bash
npm run dev 
```
or
### running seperately
```bash
npm run dev:web
npm run dev:convex
```


## deploy the project
```bash
npm run deploy
```
