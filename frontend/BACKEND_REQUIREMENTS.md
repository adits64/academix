# Academix — Backend Requirements & Missing Endpoints

During the comprehensive inspection of the existing backend (`student/backend`), the frontend architecture was built strictly adhering to the backend API structure. The following missing endpoints and backend enhancements have been identified to support complete, production-grade frontend features without inventing fake APIs:

---

## 1. Missing Self User Profile Endpoint (`GET /users/me` or `/auth/me`)

- **Current Backend Support:** The backend provides `GET /users/:id` restricted to `admin` and `teacher` roles.
- **Affected Frontend Feature:** Student profile view/edit, self-user data refresh.
- **Required Change:** Add `GET /users/me` endpoint accessible to all authenticated roles (`admin`, `teacher`, `student`) that returns the current logged-in user document (excluding password).

---

## 2. Missing Registered Fee API Handlers/Routes (`/fees`)

- **Current Backend Support:** The backend includes a complete Fee database model (`models/fee.js`), but does NOT register any fee handlers or routes in `handlers/index.js` or `handlers/fee.js`.
- **Affected Frontend Feature:** Student fee balance display (`totalFee`, `paidAmount`, `dueAmount`) and Admin fee management page.
- **Required Change:** Implement `handlers/fee.js` with endpoints:
  - `GET /fees/my` (Student own fee details)
  - `GET /fees` (Admin fee list)
  - `POST /fees`, `PATCH /fees/:id` (Admin fee management)

---

## 3. Student Enrolled Courses Endpoint (`GET /enrollments/my` or `/courses/enrolled`)

- **Current Backend Support:** Students can fetch notes via `GET /notes/my` and attendance via `GET /attandances/my`, but there is no direct endpoint for students to list their currently enrolled courses.
- **Affected Frontend Feature:** Student "My Courses" section.
- **Required Change:** Add `GET /enrollments/my` or `GET /courses/enrolled` returning the student's active course and batch details.

---

## 4. Null-Safety & Population in Notes API (`services/notes.js`)

- **Current Backend Support:** `getMyNotes` in `services/notes.js` assumes `enrollment.courseId` is always populated. If an enrollment references a deleted course or missing batch, it throws a null reference exception.
- **Required Change:** Add optional chaining / populate checks in `services/notes.js` for robust error handling.

---

## 5. Mongoose Model Reference Fix in Fee Model (`models/fee.js`)

- **Current Backend Support:** `models/fee.js` references `ref: "Student"` and `ref: "course"`.
- **Required Change:** Correct model references to `ref: "User"` and `ref: "Course"`.

---

## Summary Policy

The frontend will NOT invent fake APIs or hardcode mock data for missing endpoints. The frontend UI strictly accounts for these backend constraints and will seamlessly consume these routes as soon as they are added to the backend.
