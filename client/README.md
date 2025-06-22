# Elite Replicas - Admin Dashboard

This is the admin dashboard for Elite Replicas, built with Next.js, Firebase, and TypeScript.

## Getting Started

### Prerequisites

- Node.js 16.14.0 or later
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### Environment Setup

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the environment variables in `.env.local` with your Firebase project credentials.

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Maintenance Mode**: Toggle maintenance mode to temporarily take the site offline for maintenance.
- **User Management**: Manage user roles and permissions.
- **Product Management**: Add, edit, and remove products from the catalog.
- **Order Management**: View and process customer orders.
- **System Status**: Monitor the health and status of the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=YOUR_REPOSITORY_URL&project-name=elite-replicas-admin&repository-name=elite-replicas-admin)

### Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase:
   ```bash
   firebase init
   ```

4. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Troubleshooting

- **Firebase Authentication**: Ensure that Firebase Authentication is enabled in your Firebase Console.
- **Firestore Rules**: Make sure your Firestore security rules allow read/write access for admin users.
- **Environment Variables**: Double-check that all required environment variables are set in `.env.local`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
