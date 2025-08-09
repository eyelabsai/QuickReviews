# QuickReviews - Patient Feedback Tool

A modern, professional patient feedback tool that helps healthcare practices collect reviews from patients via SMS and email.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Python 3.7+ (for user creation scripts)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QuickReviews-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   ```bash
   firebase login
   firebase use <your-project-id>
   ```

4. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 👤 Creating New Accounts (Internal)

Use the Node invite script to create accounts quickly, optionally assign a username, and enqueue a welcome email with a password reset link.

### Prerequisites
- `serviceAccountKey.json` at the project root (Firebase Console → Project settings → Service accounts → Generate new private key)
- Dependencies installed:
  ```bash
  npm install
  ```

### Create a user (recommended)
```bash
npm run create:user -- \
  --email 'user@example.com' \
  --password 'TempPass123!' \
  --fullName 'First Last' \
  --reviewLink 'https://g.page/r/your-link' \
  --username 'yourusername'
```

Notes:
- `--username` is optional; if provided, it will be claimed if available and stored in the user profile.
- A password reset link will be generated and a welcome email enqueued (from `feedback@ezreviews.app`). Disable sending with `--no-sendEmail`.
- If your shell expands `!`, use single quotes around the password (as above).

Examples:
```bash
# Create Test Two with username and welcome email
npm run create:user -- --email 'test2@gmail.com' --password 'TempPass123!' --fullName 'Test Two' --reviewLink 'https://g.page/r/your-link' --username 'test2'

# Create without sending email
npm run create:user -- --email 'user@example.com' --password 'TempPass123!' --fullName 'User Name' --reviewLink 'https://g.page/r/your-link' --no-sendEmail
```

### Alternative: Python script
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt
python3 scripts/create_user.py --email 'user@example.com' --temp-password 'TempPass123!' --full-name 'User Name' --review-link 'https://g.page/r/your-link'
```
The Python script prints a password reset link you can send manually.

## 🔧 Configuration

### Firebase Setup

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Set up Firestore security rules

2. **Update Firebase configuration**
   - Copy your Firebase config from the project settings
   - Update the config in `index.html` and `dashboard.html`

3. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Environment Variables

Create a `.env` file in the root directory:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## 📱 Using the Application

### Dashboard Overview

The dashboard has two main sections:

1. **Send Review Request Tab**
   - Enter patient information
   - Customize your message
   - Choose delivery method (SMS/Email)
   - Preview your message before sending

2. **Delivery History Tab**
   - View all sent messages
   - Filter by channel (SMS/Email)
   - Track delivery status

### Sending Review Requests

1. **Fill in patient details**
   - Patient's full name
   - Preferred name (for personalization)
   - Phone number (for SMS)
   - Email address (for email)

2. **Customize your message**
   - The app auto-generates a professional message
   - You can customize it as needed
   - Your review link is automatically included

3. **Choose delivery method**
   - Select SMS, Email, or both
   - At least one method must be selected

4. **Send the message**
   - Click "Send Message"
   - Messages are queued for delivery

### Message Templates

The app uses smart templates that:
- Automatically include the patient's preferred name
- Add your review link if not already present
- Maintain professional tone
- Are customizable for your practice

## 🔒 Security & Permissions

### Firestore Rules

The application uses secure Firestore rules that:
- Allow users to only access their own data
- Prevent unauthorized access to other users' information
- Secure delivery logs and user profiles

### User Authentication

- Email/password authentication
- Secure session management
- Automatic logout on inactivity
- Password reset functionality

## 📊 Features

### Core Features
- ✅ **Multi-channel delivery** (SMS & Email)
- ✅ **Message customization** with live preview
- ✅ **Delivery tracking** and history
- ✅ **User management** and profiles
- ✅ **Responsive design** for all devices
- ✅ **Professional UI/UX** with modern design

### Advanced Features
- ✅ **Smart message templates** with auto-personalization
- ✅ **Review link integration** for easy patient access
- ✅ **Delivery filtering** and search
- ✅ **Practice branding** with custom logos
- ✅ **Bulk user creation** via scripts

## 🛠️ Development

### Project Structure
```
QuickReviews-1/
├── index.html          # Login page
├── dashboard.html      # Main dashboard
├── profile.html        # User profile setup
├── reset-password.html # Password reset
├── css/
│   └── style.css      # Main styles
├── js/
│   └── login.js       # Login logic
├── scripts/
│   ├── create_user.py # Python user creation
│   └── createUser.mjs # Node.js user creation
└── Firestore/         # Database exports
```

### Local Development

1. **Start local server**
   ```bash
   firebase serve
   ```

2. **Access the app**
   - Open `http://localhost:5000`

3. **Make changes**
   - Edit HTML, CSS, or JavaScript files
   - Changes are reflected immediately

### Deployment

1. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

2. **Deploy everything**
   ```bash
   firebase deploy
   ```

## 🐛 Troubleshooting

### Common Issues

**"User not found" error**
- Ensure the user account exists in Firebase Auth
- Check if the user profile is properly set up

**Messages not sending**
- Verify Firebase configuration
- Check Firestore rules
- Ensure delivery service is configured

**Login issues**
- Clear browser cache
- Check Firebase Auth settings
- Verify email/password combination

### Getting Help

1. **Check Firebase Console**
   - Monitor Authentication logs
   - Review Firestore data
   - Check hosting deployment status

2. **Review logs**
   - Browser console for client-side errors
   - Firebase Functions logs for server-side issues

## 📞 Support

For technical support or questions:
- Check the Firebase Console for error logs
- Review this README for common solutions
- Contact the development team

## 🔄 Updates

### Recent Updates
- ✅ **New UI/UX design** with tabbed navigation
- ✅ **Dark navy blue theme** for professional appearance
- ✅ **Improved mobile responsiveness**
- ✅ **Better organized dashboard** with separate tabs
- ✅ **Enhanced button styling** and user experience

### Upcoming Features
- 📅 **Analytics dashboard** for delivery metrics
- 📅 **Bulk message sending** for multiple patients
- 📅 **Advanced message templates** with variables
- 📅 **Integration with practice management systems**

---

**QuickReviews** - Making patient feedback collection simple, professional, and effective.
