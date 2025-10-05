# Lost_n_Found System

A comprehensive web application for university campuses to help students and staff report and recover lost items efficiently.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen) 

## Features

### Core Functionality
- **Post Lost Items**: Report lost belongings with detailed descriptions and images
- **Post Found Items**: Report found items with storage location information
- **Smart Search**: Advanced search with filters by category, location, and date
- **Auto-Matching**: Intelligent matching between lost and found items
- **Image Upload**: Support for item images with preview functionality

### User Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Search**: Instant search results with filtering options
- **Load More**: Infinite scrolling for better user experience
- **Contact System**: Built-in contact functionality for item claims
- **Admin Dashboard**: Comprehensive admin panel for management

### Admin Features
- **Item Management**: Approve, reject, or resolve reported items
- **User Management**: Monitor user activity and reports
- **Statistics Dashboard**: Visual insights with charts and metrics
- **Bulk Operations**: Manage multiple items efficiently

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/lost-n-found.git
cd lost-n-found
```

2. **Install Dependencies**
```bash
npm install
```
3. **Start the Application**
For Development:
```bash
npm run dev
```
This starts the server with nodemon for automatic restart on file changes.

For Production:
```bash
npm start
```
4.  **Access the Application**
Once the server is running, access the application at:

Main Application: http://localhost:3000

Admin Panel: http://localhost:3000/admin/login

Default Admin Credentials:

Username: admin

Password: admin123

## Project Structure
```bash
lost-n-found/
│
├── models/
│ └── Item.js # MongoDB schema for lost/found items
│
├── routes/
│ ├── index.js # Main application routes
│ ├── items.js # Item management routes
│ └── admin.js # Admin panel routes
│
├── views/
│ ├── index.ejs # Homepage template
│ ├── admin/ # Admin panel templates
│ │ ├── dashboard.ejs # Admin dashboard
│ │ └── login.ejs # Admin login page
│ └── error.ejs # Error page template
│
├── public/
│ ├── js/
│ │ └── main.js # Main client-side JavaScript
│ ├── css/
│ │ └── style.css # Additional CSS styles
│ └── uploads/ # Directory for uploaded images
│
├── app.js # Main application entry point
├── package.json # Project dependencies and scripts
└── .env # Environment variables (create this)
```

## ScreenShots
1. **Home page**
<img width="1919" height="866" alt="Screenshot 2025-10-06 005507" src="https://github.com/user-attachments/assets/b2975e61-d7f1-4735-9ec9-616bb6699457" />

2. **Admin login**
<img width="1919" height="866" alt="Screenshot 2025-10-06 005525" src="https://github.com/user-attachments/assets/82180cad-0ccd-4fb2-b19a-4a83bbe6911b" />

3. **Admin dashboard**
<img width="1919" height="868" alt="Screenshot 2025-10-06 005540" src="https://github.com/user-attachments/assets/e1740b81-c861-4e3d-9a8f-06db707354a8" />
