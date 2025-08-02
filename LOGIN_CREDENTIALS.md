# Login Credentials for PLP-456

Since you're running on localhost and can't use Telegram authentication (it requires HTTPS), here are the options:

## Available User Accounts

### 1. Administrator
- **Email**: admin@openplp.com
- **Password**: admin123
- **Role**: ADMINISTRATOR

### 2. Provincial Director
- **Email**: provincial@openplp.com
- **Password**: provincial123
- **Role**: PROVINCIAL

### 3. District Director  
- **Email**: district@openplp.com
- **Password**: district123
- **Role**: ZONE

### 4. Mentor
- **Email**: mentor@openplp.com
- **Password**: mentor123
- **Role**: MENTOR

### 5. Teacher
- **Email**: teacher@openplp.com
- **Password**: teacher123
- **Role**: TEACHER

### 6. Officer
- **Email**: officer@openplp.com
- **Password**: officer123
- **Role**: OFFICER

### System Admin (Original)
- **Email**: chhinhs@gmail.com
- **Password**: admin123
- **Role**: ADMINISTRATOR

## Why Telegram Login Doesn't Work on Localhost

Telegram login requires:
1. **HTTPS connection** - Telegram's security policy doesn't allow authentication over HTTP
2. **Public domain** - The callback needs to be accessible from Telegram's servers
3. **Bot configuration** - The bot must have the domain configured in BotFather

## How to Test Login Locally

1. Use the email/password form on the login page
2. Enter one of the credentials above
3. You'll be redirected to the dashboard

## Setting Up Test Users

If the users don't exist yet, you need to:

1. First, ensure the database tables are created:
   ```bash
   npx prisma db push --skip-seed
   ```

2. Then run the seed script:
   ```bash
   npm run prisma:seed
   ```

If you get errors about existing tables, you may need to work with the database administrator to either:
- Get existing user credentials
- Add new users to the existing database
- Set up a local development database

## For Production Telegram Login

When deploying to production with HTTPS:
1. Update `TELEGRAM_BOT_TOKEN` in `.env`
2. Update `TELEGRAM_BOT_USERNAME` in `.env`
3. Configure your domain in BotFather
4. Ensure HTTPS is enabled
5. The Telegram login button will then work properly