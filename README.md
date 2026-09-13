# TalSource - Sourcing project

A small utility for treating incoming webook messages from `Microsoft Graph` API via webhooks.

How it works:
- an email is received by Microsoft Office Exchange Server, once that email is received a webhook message is fired
- when the API will receive a request from the webhook it will parse the payload 
- messages are used as triggers for inside business logic

# Before getting started

1. Make sure you have nvm (Node Version Manager) installed, more info [here](https://www.nvmnode.com/)
2. **Not required for development.** Make sure you have installed globally `pm2`, [more info](https://pm2.io/docs/runtime/guide/installation/)
3. Create an account with [OpenRouter](https://openrouter.ai/) - Generate an API Key and use that inside `.env`

## Get started

1. Copy `.env.exmaple` in `.env` - `cp .env.example .env`
2. Modify `.env` with the required information
3. Run `yarn install`
4. To start in development mode use: `yarn start:dev` 
5. Starting the project in production mode is done via PM2 - make sure you have it installed it as a global dependency
  - `npm install pm2 --global`
  - run `pm2` inside the current folder - This will make sure the process will be started in case of machine restart - 
  - `pm2 save all` - is needed to save the processes to plist
6. This project usses seem.io for webhook forwarding for local development, to start the script for webhook FW run `yarn start:webhook`
7. 

