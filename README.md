# Ricey n Ramen

A pixel-art tag-team platformer starring Ricey (Maine Coon) and Ramen (Shiba Inu).
Built with Phaser 3, TypeScript and Vite.

Ricey and Ramen can't find Nien-Nien. They search the backyard and the bush,
find an old ticket to Taipei, fly to Taiwan (night market, Jiufen), come home,
and find Nien-Nien was in the bathroom all along.

## Play

```sh
npm install
npm run dev      # http://localhost:5173 (also served on the LAN)
npm run build    # static build in dist/
```

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / A D | D-pad / left stick |
| Jump | Space / Z / W / Up | A |
| Swap pets | C / Shift / K | Y / bumpers |
| Ramen's dash | X / J | X |
| Drop through a ledge | Down + Jump | Down + A |
| Restart from checkpoint | R | |

Ricey climbs walls (walk into one). Ramen runs faster and can dash once per jump.
The pet you aren't controlling follows along behind. Jump on enemies (or dash
through them as Ramen) to knock them out.

Add `?step=N` to the URL to jump to a point in the story (see `FLOW` in `src/story.ts`).

## Layout

- `src/scenes/GameScene.ts`: movement, tag-team following, enemies, pickups, checkpoints
- `src/scenes/StoryScene.ts`, `src/story.ts`: cutscene dialogue and the order of the game
- `src/levels.ts`: levels as text maps (legend at the top of the file)
- `src/art/`: pixel art as character maps (`pets.ts`, `props.ts`) and per-level themes (`themes.ts`)
