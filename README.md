# RickShare

RickShare is a modern, AI-powered rickshaw sharing application tailored for Dhaka, Bangladesh. It connects passengers with rickshaw pullers, offering fair pricing algorithms, real-time tracking, and a seamless user experience.

## 🚀 Features Implemented So Far

### Backend (Django & Django REST Framework)
- **User Authentication**: Custom user model supporting both Passengers and Drivers.
- **JWT Authentication**: Secure login and registration endpoints.
- **Ride Management**:
    - Request a ride with pickup and dropoff locations.
    - Fare calculation algorithm based on distance and traffic conditions (simulated).
    - Status updates (Requested, Accepted, Started, Completed, Cancelled).
- **Driver Matching**: Drivers can view available ride requests in their vicinity.

### Frontend (Next.js & Tailwind CSS)
- **Authentication UI**: Login and Signup pages for both Passengers and Drivers.
- **Interactive Map**: Integration with Leaflet (via React-Leaflet) to show user location and ride details.
- **Dashboards**:
    - **Passenger Dashboard**: Book rides, view current ride status, and search for destinations.
    - **Driver Dashboard**: View incoming ride requests, accept rides, and track earnings.
- **Modern UI/UX**: Dark mode aesthetic with glassmorphism effects.

## 🛠️ Tech Stack

- **Backend**: Python, Django, Django REST Framework, Channels (planned for real-time)
- **Frontend**: TypeScript, Next.js, Tailwind CSS, Shadcn UI (components), React-Leaflet
- **Database**: SQLite (Development), PostgreSQL (Production - planned)
- **Maps**: OpenStreetMap / Leaflet

## 🏃‍♂️ Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/itisFAHIM/rickshare.git
   cd rickshare
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   # source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔮 Coming Soon
- Real-time driver tracking via WebSockets.
- Payment gateway integration.
- AI-based continuous route optimization.
