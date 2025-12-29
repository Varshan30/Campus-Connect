# Campus Connect 🎓

<div align="center">

![Campus Connect](https://img.shields.io/badge/Campus-Connect-purple?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Backend-orange?style=flat-square&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**A modern, real-time web application to help students report and find lost & found items on campus.**

🔗 **[Live Demo](https://campus-connect-b8059.web.app)**

</div>

---

## 📸 Screenshots

| Home Page | Browse Items | Report Item |
|:---------:|:------------:|:-----------:|
| Landing page with recent items | Search and filter functionality | Easy item reporting form |

---

## ✨ Features

### 🔐 Authentication
- **Secure Login/Signup** - Email and password authentication
- **User Profiles** - Customizable display names and profile settings
- **Session Management** - Persistent login with Firebase Auth

### 📦 Lost & Found Management
- **Report Items** - Submit lost or found items with detailed information
- **Rich Details** - Add name, description, category, location, and contact info
- **Real-time Updates** - See new items appear instantly without page refresh
- **Smart Search** - Find items by name, description, or category
- **Category Filters** - Filter by Electronics, Books, Accessories, ID Cards, etc.

### ✏️ Item Management
- **Full Control** - Edit or delete your own reported items
- **Authorization** - Only item creators can modify their listings
- **Status Tracking** - Mark items as claimed or resolved

### 🤝 Claim System
- **Easy Claims** - Claim found items with a personalized message
- **Owner Notifications** - Item owners receive instant claim alerts
- **Approve/Reject** - Owners can approve or reject claims
- **Status Updates** - Real-time claim status tracking

### 🔔 Smart Notifications
- **In-App Bell** - Real-time notification badge with unread count
- **Telegram Bot** - Instant notifications via @CampusConnect25_bot
- **Email Alerts** - Email notifications for important claim events

### 🔄 Auto-Matching System
- **Smart Matching** - Automatic matching between lost and found items
- **Similarity Scoring** - AI-powered matching based on name, description, and category
- **Match Notifications** - Get notified when potential matches are found

### 🎨 Modern UI/UX
- **Dark Theme** - Eye-friendly dark mode with gradient accents
- **Animated Buttons** - Gradient hover effects and smooth transitions
- **Grid Patterns** - Animated background patterns for visual appeal
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Framer Motion** - Smooth animations throughout the app

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Animations** | Framer Motion |
| **Backend** | Firebase (Auth, Firestore) |
| **Hosting** | Firebase Hosting |
| **Notifications** | Telegram Bot API, Formspree |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm installed
- Firebase account (for backend services)

### Installation

```bash
# Clone the repository
git clone https://github.com/Varshan30/campus-connect.git

# Navigate to the project directory
cd campus-connect

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at `http://localhost:8080`

### Environment Setup

Create a Firebase project and update `src/firebase.js` with your config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
campus-connect/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI (buttons, dialogs, inputs)
│   │   ├── Header.tsx      # Navigation with search & notifications
│   │   ├── Footer.tsx      # App footer
│   │   ├── ItemCard.tsx    # Item display card
│   │   ├── AuthForm.tsx    # Login/Signup form
│   │   ├── ClaimDialog.tsx # Claim submission dialog
│   │   └── EditItemDialog.tsx
│   ├── pages/              # Page components
│   │   ├── Landing.tsx     # Home page
│   │   ├── Browse.tsx      # Browse all items
│   │   ├── ReportItem.tsx  # Report lost/found item
│   │   ├── Settings.tsx    # User settings
│   │   └── Auth.tsx        # Authentication page
│   ├── lib/                # Utility functions
│   │   ├── matching.ts     # Auto-matching algorithm
│   │   ├── notifications.ts # Telegram & email notifications
│   │   └── utils.ts        # Helper functions
│   ├── hooks/              # Custom React hooks
│   ├── firebase.js         # Firebase configuration
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
└── package.json
```

---

## 🔒 Security

- **Firebase Authentication** - Secure user authentication
- **Firestore Rules** - Database-level authorization
- **Protected Routes** - Only authenticated users can report/claim items
- **Owner Verification** - Only item creators can edit/delete their listings

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Varshan**

- GitHub: [@Varshan30](https://github.com/Varshan30)

---

<div align="center">

⭐ **Star this repo if you find it helpful!** ⭐



</div>
