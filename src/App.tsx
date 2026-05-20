import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FinanceDashboard from './pages/FinanceDashboard';
import DailyDashboard from './pages/DailyDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<FinanceDashboard />} />
          <Route path="/daily" element={<DailyDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
