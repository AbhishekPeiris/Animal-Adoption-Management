import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.js";
import Home from "./pages/Home.js";
import MedicalRecords from "./pages/MedicalRecords.js";
import PetAdoption from "./pages/PetAdoption.js";
import Login from "./pages/Login.js";
import PetListing from "./pages/Admin/PetListing.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import Footer from "./components/Footer.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import AppointmentBooking from './pages/AppointmentBooking.js';
import Register from "./pages/Register.js";
import RescuedPet from "./pages/RescuedPet.js";
import PetShop from "./pages/User.js";
import AdminDashboard from "./components/AdminDashboard.js";
import UpdateProduct from './pages/UpdateProduct.js';
import EditProduct from './pages/Admin.js';
import Donations from "./pages/Donations.js";
import Volunteers from "./pages/Volunteers.js";

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavbarWithAuth />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<AppointmentBooking />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/pet-profiles" element={<PetListing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rescued-pet" element={<RescuedPet />} />
          <Route path="/products" element={<PetShop />} />
          <Route path="/pet-adoption" element={<PetAdoption />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/volunteers" element={<Volunteers />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route path="edit-product" element={<EditProduct />} />
            <Route path="update-product/:id" element={<UpdateProduct />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

const NavbarWithAuth = () => {
  const { isLoggedIn, logout } = useAuth();
  return <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />;
};

export default App;
