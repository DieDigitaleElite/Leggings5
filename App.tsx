
import React, { useState, useCallback } from 'react';
import { Product, TryOnState } from './types';
import { MOCK_PRODUCTS, AVAILABLE_SIZES } from './constants';
import { performVirtualTryOn, fileToBase64, urlToBase64, estimateSizeFromImage } from './services/geminiService';
import ProductCard from './components/ProductCard';
import StepIndicator from './components/StepIndicator';

const App: React.FC = () => {
  const [state, setState] = useState<TryOnState>({
    userImage: null,
    selectedProduct: null,
    resultImage: null,
    recommendedSize: null,
    isLoading: false,
    error: null,
  });

  const [step, setStep] = useState(1);

  const handleProductSelect = useCallback((product: Product) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setState(prev => ({ ...prev, userImage: base64, error: null }));
      } catch (err) {
        setState(prev => ({ ...prev, error: "Fehler beim Lesen der Bilddatei." }));
      }
    }
  }, []);

  const handleDownload = () => {
    if (!state.resultImage) return;
    const link = document.createElement('a');
    link.href = state.resultImage;
    link.download = `better-future-look-${state.selectedProduct?.id || 'tryon'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTryOn = async () => {
    if (!state.userImage || !state.selectedProduct) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setStep(3);

    try {
      const productBase64 = await urlToBase64(state.selectedProduct.imageUrl);
      
      const [result, aiRecommendedSize] = await Promise.all([
        performVirtualTryOn(
          state.userImage, 
          productBase64, 
          state.selectedProduct.name
        ),
        estimateSizeFromImage(
          state.userImage,
          state.selectedProduct.name
        )
      ]);
      
      setState(prev => ({ 
        ...prev, 
        resultImage: result, 
        recommendedSize: aiRecommendedSize,
        isLoading: false 
      }));
    } catch (err: any) {
      console.error("Process Error:", err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Ein unerwarteter Fehler ist aufgetreten." 
      }));
    }
  };

  const reset = () => {
    setState({
      userImage: null,
      selectedProduct: null,
      resultImage: null,
      recommendedSize: null,
      isLoading: false,
      error: null,
    });
    setStep(1);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-gray-200 py-4 mb-8 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">Better Future <span className="font-light text-gray-500">Collection</span></span>
          </div>
          <button 
            onClick={reset}
            className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Neustart
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-5xl">
        <StepIndicator currentStep={step} />

        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Wähle deinen Look</h1>
              <p className="mt-3 text-lg text-gray-500">Entdecke die Better Future Collection an dir selbst.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
              {MOCK_PRODUCTS.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  isSelected={state.selectedProduct?.id === product.id}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <button
                disabled={!state.selectedProduct}
                onClick={() => setStep(2)}
                className={`px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                  state.selectedProduct 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Weiter: Foto hochladen
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900">Lade dein Foto hoch</h1>
              <p className="mt-2 text-gray-500 italic text-sm">Unser KI-System analysiert deine Proportionen für eine präzise Größenempfehlung.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
              {state.userImage ? (
                <div className="relative w-full max-w-xs">
                  <img 
                    src={state.userImage} 
                    alt="Vorschau" 
                    className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
                  />
                  <button 
                    onClick={() => setState(prev => ({ ...prev, userImage: null }))}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group py-10">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Foto auswählen oder hierher ziehen</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 rounded-full font-bold text-lg bg-white text-gray-600 border border-gray-200"
              >
                Zurück
              </button>
              <button
                disabled={!state.userImage}
                onClick={handleTryOn}
                className={`px-10 py-3 rounded-full font-bold text-lg transition-all shadow-lg ${
                  state.userImage 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Look anprobieren ✨
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            {state.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 italic">KI ANALYSIERT LOOK...</h2>
                <p className="text-gray-500 max-w-md">Wir berechnen deine optimale Größe und generieren die Vorschau.</p>
              </div>
            ) : state.error ? (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
                <h2 className="text-xl font-bold text-red-900 mb-2">Fehler</h2>
                <p className="text-red-700 mb-6">{state.error}</p>
                <button onClick={() => setStep(2)} className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold">Nochmal versuchen</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-10 items-start">
                <div className="space-y-8">
                  <div className="relative group overflow-hidden rounded-3xl bg-white p-1">
                    <img 
                      src={state.resultImage!} 
                      alt="KI Ergebnis" 
                      className="w-full rounded-[28px] shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                      <div className="bg-indigo-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">
                        AI Vorschau
                      </div>
                      <button 
                        onClick={handleDownload}
                        title="Look speichern"
                        className="bg-white/90 backdrop-blur-sm text-gray-800 p-2.5 rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 mb-4">Wir finden das Set steht dir super! 🎉</h3>
                    <p className="text-gray-700 font-medium mb-6">
                      Sichere dir deine Größe bei der Pre-Order zum halben Preis. 
                      <span className="block mt-2 text-sm text-gray-500 font-normal italic">Über 100 Frauen haben bereits vorbestellt – und das aus gutem Grund:</span>
                    </p>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1 w-5 h-5 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                          <strong>Nachhaltig von Anfang bis Ende</strong> – Recycelte Materialien, faire Löhne in Portugal, klimaneutraler Versand.
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="mt-1 w-5 h-5 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                          <strong>Performance trifft Komfort</strong> – Squat-proof, atmungsaktiv und blickdicht. Entwickelt für dein intensivstes Workout.
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="mt-1 w-5 h-5 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z"></path></svg>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug"><strong>Sichere Zahlung & Kostenlose Retoure</strong></p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex text-yellow-400">
                          {"★★★★★".split("").map((s,i) => <span key={i} className="text-sm">★</span>)}
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">4.9/5 von Early Testern</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Einmaliges Angebot</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-black italic">-50% OFF</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        Nach dem Launch kostet das Set <span className="line-through text-gray-400">108€</span>. Das heißt du sparst <strong>54€</strong>! Bestelle jetzt und gib im Warenkorb einfach den Code ein:
                      </p>
                      <div className="bg-white border-2 border-dashed border-indigo-200 py-3 text-center rounded-xl">
                        <span className="text-2xl font-black text-indigo-600 tracking-[0.2em] uppercase">PRE50</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-28 flex flex-col">
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Better Future Collection</span>
                    <h2 className="text-2xl font-black mt-1 leading-tight">{state.selectedProduct?.name}</h2>
                    <p className="text-lg font-medium text-gray-500 mt-1">Dein virtuelles Fitting</p>
                  </div>

                  <div className="mb-8">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">📏</span>
                        <span className="font-bold text-emerald-900">Größenempfehlung</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="bg-emerald-600 text-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg">
                          {state.recommendedSize}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-emerald-800 leading-snug">
                            Wir empfehlen dir für dieses Set die Größe <strong>{state.recommendedSize}</strong> für den perfekten Fit.
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-2 leading-relaxed italic">
                            Bitte beachte, dass dies natürlich nur eine erste Empfehlung ist. Solltest du dir bei der Größe unsicher sein, schaue dir gerne nochmal unseren Größenberater in der Produktbeschreibung an. :)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Größe anpassen</label>
                      <div className="grid grid-cols-6 gap-2">
                        {AVAILABLE_SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => setState(prev => ({ ...prev, recommendedSize: size }))}
                            className={`py-3 text-xs font-black rounded-xl transition-all ${
                              state.recommendedSize === size 
                                ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 mb-8 leading-relaxed text-sm italic">
                    {state.selectedProduct?.description}
                  </p>

                  <div className="mt-auto space-y-4">
                    <button 
                      onClick={handleDownload}
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-2xl active:scale-[0.98]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>LOOK SPEICHERN</span>
                    </button>
                    <button 
                      onClick={reset}
                      className="w-full text-gray-400 py-2 font-bold hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]"
                    >
                      Anderen Look probieren
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-gray-100 pt-10 text-center">
        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Better Future Collection • Smart Fitting Engine</p>
      </footer>
    </div>
  );
};

export default App;
