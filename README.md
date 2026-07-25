# Gator 🐊

**Gator** is a multi-user CLI RSS feed aggregator written in TypeScript and powered by Node.js and PostgreSQL. It allows users to register local accounts, subscribe to RSS feeds, continuously fetch posts in the background, and read sanitized updates directly from their terminal.

---

## 📋 What You Need to Run the CLI

Before running Gator, ensure your environment meets the following requirements:

* **Node.js**: Version 18.0.0 or higher.
* **Package Manager**: `npm` (included with Node.js), `pnpm`, or `yarn`.
* **PostgreSQL Database**: A running PostgreSQL instance (local or remote) to store users, feeds, subscriptions, and cached posts.

---

## ⚙️ How to Set Up the Config File & Run the Program

### 1. Configuration File Setup

Gator reads database credentials and tracks your active user session using a JSON configuration file stored in your home directory: **`~/.gatorconfig.json`**.

Create the file in your home directory:

```bash
touch ~/.gatorconfig.json
```

Populate `~/.gatorconfig.json` with your PostgreSQL connection URL and an active username:

```json
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
  "current_user_name": "your_username"
}
```

* **`db_url`**: Connection string to your PostgreSQL instance.
* **`current_user_name`**: The username used for active CLI commands.

---

### 2. Running the Application

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/monazak/gator.git
   cd gator
   npm install
   ```

2. **Apply database schema migrations:**
   ```bash
   npm run migrate
   ```

3. **Execute CLI commands:**
   Run commands using `npm run start`:
   ```bash
   npm run start <command> [arguments...]
   ```

---

## 💻 Available Commands

Here are a few essential commands you can run to interact with Gator:

### Account & Session Commands
* **`register <username>`**: Registers a new user account and sets it as the active user in `~/.gatorconfig.json`.
  ```bash
  npm run start register alex
  ```
* **`login <username>`**: Switches the current active session in `~/.gatorconfig.json` to an existing user.
  ```bash
  npm run start login alex
  ```
* **`users`**: Displays a list of all registered users in the database and highlights the currently logged-in user.
  ```bash
  npm run start users
  ```

### Feed & Subscription Commands
* **`addfeed <name> <url>`**: Saves a new RSS feed to the database and automatically subscribes the active user.
  ```bash
  npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
  ```
* **`follow <url>`**: Subscribes the current user to an existing feed by its URL.
  ```bash
  npm run start follow "https://news.ycombinator.com/rss"
  ```
* **`following`**: Lists all feeds currently followed by the logged-in user.
  ```bash
  npm run start following
  ```

### Feed Aggregation & Reading
* **`agg <time_between_reqs>`**: Runs the background worker process that continuously polls followed feeds for new articles at a specified interval (e.g., `1m`, `30s`, `1h`).
  ```bash
  npm run start agg 1m
  ```
* **`browse [limit]`**: Displays the latest cleaned posts from feeds followed by the current user. Accepts an optional limit (defaults to 2).
  ```bash
  npm run start browse 5
  ```