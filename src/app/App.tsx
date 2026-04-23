import Router from '../router';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}