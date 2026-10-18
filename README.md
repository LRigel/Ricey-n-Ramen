# Ricey n Ramen

A pixel-art tag-team platformer starring Ricey (Maine Coon) and Ramen (Shiba Inu).
Built with Phaser 3, TypeScript and Vite.

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
| Restart from checkpoint | R | |

Ricey climbs walls (walk into one). Ramen runs faster and can dash once per jump.
The pet you aren't controlling follows along behind.

## Layout

- `src/GameScene.ts`: movement, tag-team following, pickups, checkpoints
- `src/levels.ts`: levels as text maps (legend at the top of the file)
- `src/sprites.ts`: placeholder pixel art, to be replaced with real sprite sheets
