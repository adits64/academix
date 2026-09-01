# AcadMix — Student Management System

AcadMix is a full-stack **Student Management System** built to manage students, teachers, courses, enrollments, fees, attendance, notes, and communication through a role-based web application.

The application provides separate access and functionality for **Admin, Teacher, and Student** users.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Protected routes
* Role-based access control
* Separate permissions for Admin, Teacher, and Student
* Password hashing and validation

### 👨‍💼 Admin

* Manage users
* Manage students and teachers
* Manage courses
* Manage enrollments
* Manage fees
* View attendance
* Manage notes
* Send notices/emails
* Access administrative dashboard

### 👨‍🏫 Teacher

* View assigned courses
* Manage attendance
* Manage course-related notes
* Send notices
* Access teacher dashboard

### 👨‍🎓 Student

* View courses
* View attendance
* View fees
* View notes
* Access student dashboard
* Manage personal profile/settings

### 📚 Course & Enrollment Management

* Create, read, update, and delete courses
* Manage course batches
* Manage student enrollments
* Associate teachers with courses

### 💰 Fee Management

* Track student fees
* View payment-related information
* Manage fee records

### 📝 Notes & File Management

* Upload notes/files
* Store uploaded files using Cloudinary
* Manage notes based on user roles
* Download uploaded files

### 📧 Communication

* Email/notice functionality
* Backend mail service integration

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript (ES6+)
* React Router
* Tailwind CSS
* Axios
* Shadcn/UI components
* Vite

### Backend

* Node.js
* Express.js
* JavaScript
* REST APIs
* JWT
* Express Validator

### Database

* MongoDB
* Mongoose

### Services

* Cloudinary — File Storage
* Email Service — Application Email/Notice Functionality

### Development Tools

* Git
* GitHub
* VS Code
* REST Client
* npm

---

## 🏗️ Project Structure

```text
AcadMix/
│
├── backend/
│   ├── config/
│   ├── errors/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── api.http
│   ├── index.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

---

## 🔄 Application Architecture

```text
                ┌──────────────────────┐
                │      React.js        │
                │      Frontend        │
                └──────────┬───────────┘
                           │
                           │ REST API
                           ▼
                ┌──────────────────────┐
                │     Express.js       │
                │       Backend        │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌─────────────────┐      ┌─────────────────┐
     │     MongoDB     │      │    Cloudinary   │
     │    Database     │      │  File Storage   │
     └─────────────────┘      └─────────────────┘
```

---

## 🔑 Role-Based Access

| Role        | Main Access                                                   |
| ----------- | ------------------------------------------------------------- |
| **Admin**   | Users, Courses, Enrollments, Fees, Attendance, Notes, Notices |
| **Teacher** | Courses, Attendance, Notes, Notices                           |
| **Student** | Courses, Attendance, Fees, Notes, Profile                     |

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/adits64/academix.git
```

```bash
cd academix
```

---

### 2. Backend Setup

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` folder.

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Add any additional environment variables required by the mail service.

Start the backend:

```bash
npm run dev
```

---

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the required environment file based on:

```text
.env.example
```

Then start the frontend:

```bash
npm run dev
```

---

## 🔒 Environment Variables

Environment variables contain sensitive information and are **not included in this repository**.

Use the provided `.env.example` files as a reference.

Never commit:

```text
.env
```

or any file containing:

* Database credentials
* JWT secrets
* Cloudinary API secrets
* Email credentials
* Other private API keys

---

## 🧪 API Testing

The backend contains an `api.http` file that can be used with a REST client to test the application's API endpoints.

The API supports operations for areas such as:

```text
Authentication
Users
Courses
Enrollments
Attendance
Fees
Notes
Mail
```

---

## 📌 Key Concepts Demonstrated

This project demonstrates practical experience with:

* Full-stack JavaScript development
* React component architecture
* REST API development
* REST API integration
* CRUD operations
* MongoDB database design
* Mongoose models and relationships
* JWT authentication
* Role-based authorization
* Middleware
* Request validation
* Error handling
* File upload and cloud storage
* Email integration
* Protected frontend routes
* Git and GitHub workflow

---

## 🔮 Future Improvements

Potential future improvements include:

* Advanced reporting and analytics
* Online payment integration
* Improved notification system
* More detailed attendance reports
* Automated email notifications
* Deployment and production optimization
* Additional administrative features

---

## 👨‍💻 Developer

**Aditya Pratap Singh**

MERN Stack Developer

* GitHub: https://github.com/adits64
* Email: [adits.rok.64@gmail.com](mailto:adits.rok.64@gmail.com)

---

## 📄 License

This project is developed for learning, portfolio, and demonstration purposes.
