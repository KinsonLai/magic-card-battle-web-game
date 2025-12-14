
# Magic Card Battle (魔法卡片對戰)

A multiplayer, turn-based strategy card game built with React, TypeScript, and TailwindCSS. Players manage an economy, cast elemental spells, and engage in tactical warfare to defeat their opponents.

## 🌟 Features

*   **Turn-Based Strategy**: Manage Gold (Money) and Mana (Magic) resources each turn.
*   **Dynamic Economy**: Build industries (Farms, Mines, Shops) to generate passive income.
*   **Elemental System**: 
    *   **5 Elements**: Fire, Water, Earth, Air, Neutral.
    *   **Reaction Mechanics**: Use elemental attacks to Prime opponents with marks, then detonate them with different elements for massive effects (Explosion, Freeze, etc.).
*   **Physical Combat System (v3.0)**:
    *   **30+ Unique Weapons**: From Holy Swords to Cursed Daggers.
    *   **Alignment Bonuses**: Physical weapons are Neutral but have an Alignment (Holy/Evil).
    *   **Soul Scale Integration**: If your Soul aligns with the weapon (e.g., Holy Soul using a Holy Sword), damage is boosted. If opposed, you suffer HP penalties.
*   **Soul Scale**: A dynamic balance meter. Playing Holy cards shifts you to Light, Evil cards to Darkness. Reaching extremes (+3/-3) unlocks powerful passive effects and Rituals.
*   **Card Types**:
    *   **Attacks**: Physical (Neutral) and Magic (Elemental) attacks.
    *   **Defense**: Counter-attack (Repel) incoming damage with your own attack cards.
    *   **Rituals**: High-cost cards that trigger global game events (Disasters or Blessings) based on your Soul State.
    *   **Artifacts**: Passive equipment providing permanent buffs (Income, Mana Regen, Damage).
*   **Rarity System**: Common, Rare, Epic, and Legendary cards. Higher rarity cards appear more frequently as the game progresses.
*   **Game Events**: Random global events (Inflation, Earthquakes, Blessings) that shake up the gameplay every 5 turns.

## 🧠 AI Training (New!)

Includes a Jupyter Notebook (`train_ai.ipynb`) to train a Deep Learning model based on the game data.

1.  Open the game and go to **Simulation Mode**.
2.  Set `Target Games` to 100+ and click **START** (use Headless mode for speed).
3.  Click **JSON** to download the `mcts_training_data_xxxx.json`.
4.  Place the JSON file in the project root folder.
5.  Open `train_ai.ipynb` in VS Code or Jupyter Lab and run all cells.
6.  The script will train a ResNet-MLP model and output `best_model.pth`.

## 🎮 How to Play

1.  **Start/Host**: Create a room and wait for players (or add AI bots).
2.  **Action Phase**:
    *   Play **Industry** cards to build your economy.
    *   Play **Attack** cards to damage opponents. 
    *   Use **Magic** to create elemental reactions.
    *   Play **Rituals** to trigger game-changing events when your Soul is at max level.
    *   Visit the **Shop** to buy new cards.
3.  **Defense Phase**:
    *   When attacked, you must play **Attack** cards to **Repel** (Counter-attack).
    *   If your counter-attack damage > incoming damage, you reflect the difference back.
4.  **Winning**: Reduce all opponents' HP to 0 to be the last one standing.

## 🛠️ Technical Stack

*   **Frontend**: React 18, TypeScript, Vite
*   **Styling**: TailwindCSS
*   **Icons**: Lucide React
*   **State Management**: React Hooks (Context-free for this scale)
*   **AI**: MCTS (Simulation), PyTorch (Training)

## 🚀 Deployment Guide (Netlify)

This project is ready to be deployed directly to Netlify.

### Steps to Deploy:

1.  **Push to GitHub**:
    *   Initialize a git repository: `git init`
    *   Add files: `git add .`
    *   Commit: `git commit -m "Initial commit"`
    *   Push to your GitHub repository.

2.  **Connect to Netlify**:
    *   Log in to [Netlify](https://www.netlify.com/).
    *   Click **"Add new site"** -> **"Import an existing project"**.
    *   Select **GitHub**.
    *   Choose your repository.

3.  **Configure Build Settings**:
    *   **Base directory**: (Leave empty)
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist` (This is the default output for Vite)

4.  **Deploy**:
    *   Click **"Deploy site"**.
    *   Netlify will detect the `package.json` and build the application. Once finished, you will get a live URL.

### Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start development server:
    ```bash
    npm run dev
    ```
3.  Open browser at `http://localhost:5173`.

## 📜 License

MIT License. Free to use and modify.
