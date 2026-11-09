# Mini Projects integration

The Mini Projects section has been added to the existing Our Vision React + Vite frontend for both admin and member navigation.

## Included projects
- Weather App (Open-Meteo geocoding + current weather; internet required, no API key)
- Random Quotes Generator (built-in quote list)
- Memory Card Game
- Tic Tac Toe (two-player and basic computer mode)
- Typing Speed Test
- Hangman
- Quiz with Timer
- Language Translator (uses a public LibreTranslate endpoint; availability/CORS may vary)
- Snake Game (arrow keys or WASD)

## Run locally
1. Extract this project ZIP.
2. Open a terminal in `our-vision-frontend/our-vision-frontend`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.
6. Sign in to Our Vision and select **Mini Projects** in the sidebar/navigation.

## Notes
- No backend changes are required for these mini projects.
- Weather and translation need an internet connection. The translation provider is a demo endpoint; for production, use a trusted provider and keep any secret API keys on a backend, not in frontend code.
- Game state is kept in component memory and resets when the page is refreshed.
- The uploaded ZIP included platform-specific `node_modules`; they are intentionally excluded here. Install dependencies on your own machine with `npm install`.
