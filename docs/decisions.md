# Implementation decisions

- The app is intentionally forgetful. It has no persistence layer of any kind — no server, no filesystem, no database, no browser storage. `/send` clears the page; there is nothing to save.
- "Slash is the interface." Actions are `/` commands typed into the editor rather than visible buttons. Configuration (goal-bar size, ghost prompts) appears as popups triggered by slash commands.
- The goal bar rewards momentum, not raw volume: adding lines or characters increases `fill`, time decays it, and deleting text never subtracts. This keeps it forgiving — you only lose ground by pausing. The fill math lives in `app/utils/bar.ts` and is unit tested in isolation.
- The bar is a draggable HUD pill (`app/components/MomentumBar.vue`), not fixed chrome — it should feel like an object sitting on the page. Its position is plain in-memory state, consistent with the no-storage rule; it resets to the top-right corner on reload.
- Ghost lines (the faint prompts on the empty page) default from `app/utils/ghosts.ts`; user-added prompts are session-only, consistent with the no-storage rule.
