import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './Components/HomePage'; 
import TikTokCodingTool from './Components/coding';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/coding" element={<TikTokCodingTool />} />
      </Routes>
    </Router>
  );
}

export default App;
