import React, { useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './components/layout/Header';
import { ColorGrid } from './components/layout/ColorGrid';
import { AuthDialog } from './components/auth/AuthDialog';
import { SavedPalettesBottomSheet } from './components/palette/SavedPalettesBottomSheet';
import { SavePaletteDialog } from './components/palette/SavePaletteDialog';
import { ResetPasswordPage } from './pages/ResetPassword';
import { MobileGenerateButton } from './components/layout/MobileGenerateButton';
import { useColorPalette } from './hooks/useColorPalette';
import { useAuthDialog } from './hooks/useAuthDialog';
import { useSavePaletteDialog } from './hooks/useSavePaletteDialog';
import { useSupabaseAuthEffect } from './hooks/useSupabaseAuthEffect';
import { useToast } from './hooks/useToast';
import { useState } from 'react';

export function App() {
  const { isOpen: isAuthOpen, open: openAuth, close: closeAuth } = useAuthDialog();
  const { isOpen: isSaveOpen, open: openSave, close: closeSave } = useSavePaletteDialog();
  const { colors, generateNewPalette, toggleLock, updateColor } = useColorPalette();
  const [showPalettes, setShowPalettes] = useState(false);

  useSupabaseAuthEffect();
  useToast('Press spacebar to generate new colors');

  const handleOpenSave = useCallback(() => {
    openSave();
  }, [openSave]);

  const handleOpenAuth = useCallback(() => {
    openAuth();
  }, [openAuth]);

  // Get the first color's hex for the header background
  const headerBackgroundColor = colors[0]?.hex || '#ffffff';

  return (
    <Router>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={
          <div className="h-[100dvh] flex flex-col">
            <Toaster position="bottom-center" className="bottom-toast-container" />
            
            <Header 
              onOpenSave={handleOpenSave} 
              onOpenAuth={handleOpenAuth}
              backgroundColor={headerBackgroundColor}
            />
            
            <main className="flex-1 flex flex-col min-h-0 pt-14 md:pt-0">
              <ColorGrid 
                colors={colors} 
                onToggleLock={toggleLock} 
                onColorChange={updateColor} 
              />
            </main>
            
            <MobileGenerateButton 
              onClick={generateNewPalette}
              onOpenSave={handleOpenSave}
              onShowPalettes={() => setShowPalettes(true)} 
            />

            <AuthDialog isOpen={isAuthOpen} onClose={closeAuth} />
            <SavePaletteDialog isOpen={isSaveOpen} onClose={closeSave} colors={colors} />
            <SavedPalettesBottomSheet
              isOpen={showPalettes}
              onClose={() => setShowPalettes(false)}
            />
          </div>
        } />
      </Routes>
    </Router>
  );
}