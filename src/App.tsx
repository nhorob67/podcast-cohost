import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import Dashboard from './pages/Dashboard';
import VoiceChatWebRTC from './pages/VoiceChatWebRTC';
import Status from './pages/Status';

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<VoiceChatWebRTC />} />
        <Route path="/status" element={<Status />} />
      </Routes>
    </Router>
  );
}

export default App;
