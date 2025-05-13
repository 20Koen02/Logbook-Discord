# Logbook Discord Bot

Logbook Discord is a simple bot designed to help manage and log activities in your Discord server.

## Features

- Set up activity categories and subcategories as an administrator.
- Let users log events in these categories.
- Maintain a scoreboard. Tallying up the amount of events in each category.
- Let administrators delete events.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/20Koen02/Logbook-Discord.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file with your bot token, client id and other configurations.

## Development

Start the bot with:

```bash
npm run db:push
npm run start:dev
```

Invite the bot to your server and configure it as needed.

## Deployment

To deploy the bot, run:

```bash
npm run db:push
npm run build
npm run start
```

Invite the bot to your server and configure it as needed.

## Contributing

Feel free to submit issues or pull requests to improve the project.

## License

This project is licensed under the LGPL-3.0 License.
