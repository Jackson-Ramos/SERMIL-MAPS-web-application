import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import LoginPage from '../shared/pages/LoginPage';

import AdminLayout from '../modules/admin/AdminLayout';
import DashboardPage from '../modules/admin/pages/DashboardPage';
import VisitasPage from '../modules/admin/pages/VisitasPage';
import QuadrasLotesPage from '../modules/admin/pages/QuadrasLotesPage';
import MoradoresPage from '../modules/admin/pages/MoradoresPage';
import QrCodePage from '../modules/admin/pages/QrCodePage';
import ConfiguracoesPage from '../modules/admin/pages/ConfiguracoesPage';

import PorteiroLayout from '../modules/porteiro/PorteiroLayout';
import PainelPage from '../modules/porteiro/pages/PainelPage';
import HistoricoPage from '../modules/porteiro/pages/HistoricoPage';
import RegistroManualPage from '../modules/porteiro/pages/RegistroManualPage';
import RamalPage from '../modules/porteiro/pages/RamalPage';

import HomePage from '../modules/visitante/pages/HomePage';
import TelaIdentificacao from '../modules/visitante/pages/TelaIdentificacao';
import TelaQuadras from '../modules/visitante/pages/TelaQuadras';
import TelaLotes from '../modules/visitante/pages/TelaLotes';
import TelaNavegacao from '../modules/visitante/pages/TelaNavegacao';
import TelaMapa from '../modules/visitante/pages/TelaMapa';
import TelaChegada from '../modules/visitante/pages/TelaChegada';
import DirecaoPage from '../modules/visitante/pages/DirecaoPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/visitas" element={<ProtectedRoute roleRequired="admin"><AdminLayout><VisitasPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/quadras-lotes" element={<ProtectedRoute roleRequired="admin"><AdminLayout><QuadrasLotesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/moradores" element={<ProtectedRoute roleRequired="admin"><AdminLayout><MoradoresPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/qrcode" element={<ProtectedRoute roleRequired="admin"><AdminLayout><QrCodePage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/configuracoes" element={<ProtectedRoute roleRequired="admin"><AdminLayout><ConfiguracoesPage /></AdminLayout></ProtectedRoute>} />

        <Route path="/porteiro" element={<ProtectedRoute roleRequired="porteiro"><PorteiroLayout><PainelPage /></PorteiroLayout></ProtectedRoute>} />
        <Route path="/porteiro/historico" element={<ProtectedRoute roleRequired="porteiro"><PorteiroLayout><HistoricoPage /></PorteiroLayout></ProtectedRoute>} />
        <Route path="/porteiro/registro" element={<ProtectedRoute roleRequired="porteiro"><PorteiroLayout><RegistroManualPage /></PorteiroLayout></ProtectedRoute>} />
        <Route path="/porteiro/ramal" element={<ProtectedRoute roleRequired="porteiro"><PorteiroLayout><RamalPage /></PorteiroLayout></ProtectedRoute>} />

        <Route path="/visitante" element={<TelaIdentificacao />} />
        <Route path="/visitante/quadras" element={<TelaQuadras />} />
        <Route path="/visitante/lotes" element={<TelaLotes />} />
        <Route path="/visitante/navegacao" element={<TelaNavegacao />} />
        <Route path="/visitante/mapa" element={<TelaMapa />} />
        <Route path="/visitante/chegada" element={<TelaChegada />} />
        <Route path="/visitante/direto" element={<DirecaoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
