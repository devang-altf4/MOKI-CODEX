import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './components/Theme';
import '@fontsource-variable/manrope';
import '@fontsource-variable/dm-sans';
import './styles.css';
import './refinements.css';
import './motion.css';
import './chapters.css';
import './mobile.css';
import './theme.css';
import './responsive.css';
import './concierge.css';
import './demo.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ThemeProvider><BrowserRouter><App /></BrowserRouter></ThemeProvider></React.StrictMode>,
);
