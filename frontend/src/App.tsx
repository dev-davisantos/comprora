import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Budgets } from './pages/Budgets';
import { Projects } from './pages/Projects';
import { Suppliers } from './pages/Suppliers';
import { Segments } from './pages/Segments';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pedidos" element={<PurchaseOrders />} />
        <Route path="/orcamentos" element={<Budgets />} />
        <Route path="/projetos" element={<Projects />} />
        <Route path="/fornecedores" element={<Suppliers />} />
        <Route path="/segmentos" element={<Segments />} />
      </Routes>
    </Layout>
  );
}
