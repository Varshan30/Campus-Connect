# Campus Connect

A modern web application to help students report and find lost & found items on campus.

🔗 **Live Demo:** [https://campus-connect-b8059.web.app](https://campus-connect-b8059.web.app)

## Features

### 🔐 Authentication
- Email/password login and signup
- User profile management with display name
- Secure Firebase Authentication

### 📦 Lost & Found Management
- Report lost or found items with details (name, description, category, location, contact)
- Browse all items with real-time updates
- Search items by name, description, or category
- Filter by item type (Lost/Found)

### ✏️ Item Management
- Edit your own reported items
- Delete your own items
- Only item creators can modify their listings (authorization)

### 🤝 Claim System
- Claim found items with a message
- Item owners receive claim notifications
- Approve or reject claims
- Real-time status updates

### 🔔 Notifications
- Real-time notification bell with unread count
- Telegram bot notifications for all events
- Email notifications for claims (via Formspree)

### 🔄 Auto-Matching
- Automatic matching between lost and found items
- Similarity scoring based on name, description, and category
- Notifications sent when potential matches are found

### 🎨 Modern UI
- Animated gradient buttons
- Animated grid pattern backgrounds
- Smooth hover effects and transitions
- Responsive design for all devices
- Dark theme with gradient accents

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Animations:** Framer Motion
- **Backend:** Firebase (Authentication, Firestore)
- **Hosting:** Firebase Hosting
- **Notifications:** Telegram Bot API, Formspree

## Getting Started

### Prerequisites
- Node.js & npm installed

### Installation

```sh
# Clone the repository
git clone https://github.com/Varshan30/campus-connect.git

# Navigate to the project directory
cd campus-connect

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

```sh
npm run build
```

### Deploy to Firebase

```sh
firebase deploy --only hosting
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── ui/         # Base UI components (buttons, dialogs, etc.)
│   ├── Header.tsx  # Navigation header with notifications
│   ├── Footer.tsx  # App footer
│   └── ...
├── pages/          # Page components
│   ├── Landing.tsx # Home page with recent items
│   ├── Browse.tsx  # Browse all items
│   ├── ReportItem.tsx # Report lost/found items
│   ├── Settings.tsx # User settings
│   └── Auth.tsx    # Login/Signup page
├── lib/            # Utility functions
│   ├── matching.ts # Auto-matching algorithm
│   └── notifications.ts # Telegram & email notifications
└── firebase.js     # Firebase configuration
```

## License

This project is open source and available under the MIT License.
