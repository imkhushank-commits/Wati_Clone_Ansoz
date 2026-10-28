import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";

import Dashboard from "./pages/Dashboard";
import TemplateLibraryPage from "./pages/TemplateLibraryPage";
import DefineAudience from './pages/DefineAudience';
import YourTemplate from './pages/YourTemplate';
import Inbox from './pages/Inbox';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8f9ff]">

        {/* TOP NAVBAR */}
        <Navbar />

        {/* LEFT SIDEBAR */}
        <Sidebar />

        {/* PAGE CONTENT */}
        <main className="ml-[220px] min-w-0 pt-[72px]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* WhatsApp Inbox Route */}
            <Route path="/inbox" element={<Inbox />} />

            {/* Dashboard Route */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Template Library Route */}
            <Route
              path="/templates"
              element={<TemplateLibraryPage />}
            />

            <Route
              path="/contacts"
              element={<DefineAudience/>}
            />
            <Route
              path="/yourtemplates"
              element={<YourTemplate/>}
            />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
};

export default App;