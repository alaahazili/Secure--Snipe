import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProjectDetector from './pages/ProjectDetector.jsx';
import Visualization from './pages/Visualization.jsx';
import WalletTracking from './pages/WalletTracking.jsx';
import ProjectAlerts from './pages/ProjectAlerts.jsx';
import Navbar from './components/Navbar.jsx';
import TokenDetails from './components/TokenDetails';
import './styles/App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project-detector" element={<ProjectDetector />} />
          <Route path="/project-detector/:poolAddress" element={<TokenDetails />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="/wallet-tracking" element={<WalletTracking />} />
          <Route path="/project-alerts" element={<ProjectAlerts />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;