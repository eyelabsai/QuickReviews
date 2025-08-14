# Review Tracking Scripts

This directory contains scripts for testing and managing the review tracking system.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run setup verification:**
   ```bash
   npm run setup
   ```

3. **Run tests:**
   ```bash
   npm run test
   ```

## 📋 Available Scripts

### **Setup & Testing**
- `npm run setup` - Verify Firebase configuration and permissions
- `npm run test` - Run comprehensive tracking system tests

### **Auto-Resend Management**
- `npm run stats` - View tracking statistics
- `npm run resend` - Check and resend expired links
- `npm start` - Run the auto-resend script

## 🔧 Configuration

### **Required Files**
- `serviceAccountKey.json` - Must be in the project root directory
- Download from Firebase Console → Project Settings → Service Accounts

### **Project ID**
The scripts are configured to use project `ezreview-ee8f0`. If you need to change this:
1. Update `projectId` in each script file
2. Or update your Firebase project configuration

## 🧪 Testing

### **Test Coverage**
The test script verifies:
- ✅ Firebase connection
- ✅ Tracking record creation
- ✅ Click simulation
- ✅ Expired link detection
- ✅ Data cleanup

### **Expected Output**
```
🚀 Starting review tracking system tests...

🔌 Testing Firebase connection...
✅ Firebase connection successful

🧪 Creating test tracking record...
✅ Test tracking record created with ID: abc123...
🔗 Tracking URL: http://localhost:5000/tracking.html?tracking=abc123...

🖱️ Simulating click for tracking ID: abc123...
✅ Click simulated successfully

⏰ Testing expired link detection...
✅ Expired tracking record created with ID: def456...
🔍 Found 1 expired links
📊 Test record is correctly detected as expired

📊 Verification Results:
   Clicked: true
   Click count: 1
   Clicked at: [timestamp]

✅ All tests completed successfully!
```

## 🚨 Troubleshooting

### **Common Errors**

**Permission Denied:**
- Check if `serviceAccountKey.json` exists in project root
- Verify service account has Firestore read/write access
- Ensure correct project ID is configured

**Service Account Not Found:**
- Download new service account key from Firebase Console
- Place in project root as `serviceAccountKey.json`

**Firestore Access Failed:**
- Check Firestore security rules
- Verify service account permissions
- Ensure collection can be created

### **Debug Steps**
1. Run `npm run setup` to verify configuration
2. Check Firebase Console for error details
3. Verify service account permissions
4. Test with a simple Firestore operation

## 📁 Files

- `setup-tracking.js` - Configuration verification
- `test-tracking-fixed.js` - Comprehensive testing
- `auto-resend.js` - Automated resend functionality
- `package.json` - Dependencies and scripts

## 🔗 Related

- Main tracking system: `../js/review-tracking.js`
- Tracking page: `../tracking.html`
- Dashboard integration: `../dashboard.html`