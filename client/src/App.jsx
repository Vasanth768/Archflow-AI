import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ArchFlowProvider } from './context/ArchFlowContext';
import MarketingLayout from './components/MarketingLayout';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Home from './pages/Home';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import UseCases from './pages/UseCases';
import Pricing from './pages/Pricing';
import Demo from './pages/Demo';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';

import Dashboard from './pages/Dashboard';
import MyProjects from './pages/MyProjects';
import NewProject from './pages/NewProject';
import ProjectDetails from './pages/ProjectDetails';
import Editor from './pages/Editor';
import Viewer from './pages/Viewer';
import StyleVariations from './pages/StyleVariations';
import Export from './pages/Export';
import Templates from './pages/Templates';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Docs from './pages/Docs';

export default function App() {
    return (
        <ArchFlowProvider>
            <Router>
                <Routes>
                    {/* Marketing Routes */}
                    <Route element={<MarketingLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/features" element={<Features />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/use-cases" element={<UseCases />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/demo" element={<Demo />} />
                        <Route path="/contact" element={<Contact />} />
                    </Route>

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Dashboard Routes */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/my-projects" element={<MyProjects />} />
                        <Route path="/new-project" element={<NewProject />} />
                        <Route path="/project-details" element={<ProjectDetails />} />
                        <Route path="/editor" element={<Editor />} />
                        <Route path="/viewer" element={<Viewer />} />
                        <Route path="/style-variations" element={<StyleVariations />} />
                        <Route path="/export" element={<Export />} />
                        <Route path="/templates" element={<Templates />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/docs" element={<Docs />} />
                    </Route>
                </Routes>
            </Router>
        </ArchFlowProvider>
    );
}
