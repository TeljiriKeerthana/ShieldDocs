import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Layout from "./components/Layout"
import Vault from "./pages/Vault"
import CreateShare from "./pages/CreateShare"
import ViewDocument from "./pages/ViewDocument"
import TrustScores from "./pages/TrustScores"
import Activity from "./pages/Activity"
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Navigate to="/login" />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Vault />} />
          <Route path="/share" element={<CreateShare />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/trust-scores" element={<TrustScores />} />
        </Route>

        <Route path="/view/:id" element={<ViewDocument />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App