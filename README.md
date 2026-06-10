# Trash2Cash.lk – Recyclable Waste Management Platform

Trash2Cash.lk is a MERN Stack based recyclable waste management platform developed for the IT2080 Information Technology Project module at SLIIT. The system is designed to support digital recyclable waste collection in Sri Lanka by connecting customers, pickup agents, pickup partners, recyclers, and administrators through one organized platform.

The project focuses on improving the traditional waste collection process by making it more transparent, scheduled, traceable, and environmentally responsible.

## Project Overview

In many areas, recyclable waste collection is still handled through informal and unplanned methods. This can lead to unclear pricing, missed pickups, poor tracking, and inefficient recycling. Trash2Cash.lk provides a digital solution where users can register, manage recyclable waste, schedule pickups, and allow recyclers or pickup partners to manage waste collection more efficiently.

The platform supports role-based dashboards for different users and includes features such as waste categorization, pickup scheduling, recycler management, finance tracking, admin management, and IoT smart-bin support.

## Key Features

### Customer Features
- User registration and login
- Manage recyclable waste details
- Schedule waste pickups
- View assigned bin details and bin status
- Track waste collection history
- View waste collection analytics

### Pickup Agent Features
- View assigned pickup tasks
- View pickup locations using map-based interface
- Update pickup status
- Add collected waste records
- Manage profile details

### Pickup Partner Features
- Manage pickup agents
- Assign pickup tasks
- Monitor available waste in warehouse
- Track collected waste records
- View revenue and performance details

### Recycler Features
- Recycler registration and login
- View available waste types and quantities
- Place purchase requests for recyclable materials
- View completed orders
- Track waste purchase statistics
- Generate waste purchase reports

### Admin Features
- Manage users and platform roles
- Manage pickup partners, pickup agents, and recyclers
- Monitor system activity
- Manage waste prices
- View dashboard analytics
- Handle complaints and reports

### Additional System Features
- JWT-based authentication
- Role-based dashboards
- Waste categorization
- Location-based pickup support
- Google Maps integration
- Finance dashboard
- IoT smart-bin support using ESP32 and ultrasonic sensors
- REST API integration between frontend and backend

## My Contribution

My main contribution was helping set up the recycler functionality of the system. This included supporting recycler-related workflows such as recycler registration and login, recycler dashboard features, available waste viewing, waste purchase/order handling, and connecting recycler pages with backend API functionality.

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- REST APIs

### Other Tools and Integrations
- Google Maps API
- IoT smart-bin concept with ESP32 and ultrasonic sensors
- Git and GitHub
- Postman
- Visual Studio Code

## Project Structure

```bash
IT-Project/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── assets/
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/gayan957/IT-Project.git
cd IT-Project
```

### 2. Setup the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and add the required environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:

```bash
npm start
```

### 3. Setup the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on the local development server shown in the terminal.

## Future Improvements

- Improve recycler marketplace features
- Add real-time notifications
- Add advanced AI-based waste price suggestions
- Improve route optimization for pickup agents
- Add payment gateway support
- Add mobile app support
- Improve analytics dashboards for admins and recyclers

## Team

This project was developed as a group project for the IT2080 Information Technology Project module at SLIIT.

## Repository

GitHub Repository: https://github.com/gayan957/IT-Project

## License

This project was developed for academic purposes.
