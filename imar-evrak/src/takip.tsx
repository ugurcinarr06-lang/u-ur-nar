import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TakipEkrani } from './components/TakipEkrani';
import './index.css';

const kok = document.getElementById('root');
if (!kok) throw new Error('#root bulunamadı');

createRoot(kok).render(
  <StrictMode>
    <TakipEkrani />
  </StrictMode>,
);
