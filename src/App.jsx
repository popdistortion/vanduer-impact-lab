import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// --- Constants ---
const API_KEY = "AIzaSyAv4ooCtOTpgu3iTGMLqZgc9XnEiNiaQxc"; // User will provide API key if needed for models other than gemini-2.0-flash
const API_URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
const PDF_JS_VERSION = "3.4.120"; // A specific version for stability
const PDF_JS_LIB_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.min.js`;
const PDF_JS_WORKER_URL_TEMPLATE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.js`;


// --- Helper Functions ---

// Function to dynamically load a script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(); // Script already loaded
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}


// Function to make API call to Gemini
async function callGeminiAPI(prompt, setLoading, setError, setResults) {
    setLoading(true);
    setError(null);

    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };

    try {
        const response = await fetch(API_URL_GEMINI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || response.statusText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setResults(text);
        } else {
            console.error("Unexpected API response structure:", result);
            throw new Error("Failed to extract text from API response. The response structure might be unexpected or content is missing.");
        }
    } catch (err) {
        console.error("Error calling Gemini API:", err);
        setError(err.message);
        setResults('');
    } finally {
        setLoading(false);
    }
}

// --- Icon Components (Simple SVGs) ---
const ScanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-3.028-4.028.75.75 0 11-1.06-1.06 4.5 4.5 0 014.528 5.528.75.75 0 01-1.06-1.061zM14.47 16.122a3 3 0 00-4.028-3.028.75.75 0 01-1.06-1.06 4.5 4.5 0 015.528 4.528.75.75 0 11-1.06-1.061zM9.53 9.878a3 3 0 003.028 4.028.75.75 0 111.06 1.06 4.5 4.5 0 01-4.528-5.528.75.75 0 011.06 1.06zM14.47 9.878a3 3 0 004.028 3.028.75.75 0 011.06 1.06 4.5 4.5 0 01-5.528-4.528.75.75 0 111.06 1.06z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const ClarityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const QuoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1M2.25 9l1.5 2.5M18.75 3l-1.5 2.5m-6 15V3.75" />
    </svg>
);

const EmotionIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const ClearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


// --- Main App Component ---
function App() {
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [analysisType, setAnalysisType] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // For API calls
    const [isPdfProcessing, setIsPdfProcessing] = useState(false); // For PDF parsing specifically
    const [error, setError] = useState(null);
    const [results, setResults] = useState('');
    const [activeTab, setActiveTab] = useState('input');
    const [isPdfJsReady, setIsPdfJsReady] = useState(false);
    const [pdfJsLoadError, setPdfJsLoadError] = useState(null);

    // Effect to load PDF.js library
    useEffect(() => {
        let isMounted = true;
        loadScript(PDF_JS_LIB_URL)
            .then(() => {
                if (isMounted) {
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL_TEMPLATE;
                        setIsPdfJsReady(true);
                        console.log("PDF.js library loaded and worker configured.");
                    } else {
                        throw new Error("window.pdfjsLib is not defined after script load.");
                    }
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Failed to load PDF.js:", err);
                    setPdfJsLoadError(err.message);
                }
            });
        
        return () => {
            isMounted = false;
            // Optional: remove script if desired, though often not necessary
            // const scriptElement = document.querySelector(`script[src="${PDF_JS_LIB_URL}"]`);
            // if (scriptElement) document.body.removeChild(scriptElement);
        };
    }, []);
// Effect to send iframe size
useEffect(() => {
  const resizeObserver = new ResizeObserver(() => {
    window.parent.postMessage(
      {
        type: 'resize-iframe',
        height: document.body.scrollHeight,
      },
      '*'
    );
  });

  resizeObserver.observe(document.body);

  return () => resizeObserver.disconnect();
}, []);


    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            if (!isPdfJsReady) {
                setError(pdfJsLoadError || "PDF processing library is still loading or failed to load. Please wait or try refreshing.");
                setIsPdfProcessing(false);
                return;
            }
            if (!window.pdfjsLib) { // Should be redundant if isPdfJsReady is true, but as a safeguard
                setError("PDF processing library (pdf.js) is not available. Please try refreshing.");
                setIsPdfProcessing(false);
                return;
            }

            setSelectedFile(file.name);
            setInputText('');
            setError(null);
            setIsPdfProcessing(true);

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(" ");
                        fullText += pageText + "\n\n";
                    }
                    setInputText(fullText.trim());
                    setError(null);
                } catch (pdfError) {
                    console.error("Error parsing PDF:", pdfError);
                    setError(`Failed to parse PDF: ${pdfError.message}. Please ensure it's a valid PDF file.`);
                    setInputText('');
                    setSelectedFile(null);
                } finally {
                    setIsPdfProcessing(false);
                }
            };
            reader.onerror = () => {
                setError("Failed to read the selected file.");
                setIsPdfProcessing(false);
                setSelectedFile(null);
                setInputText('');
            }
            reader.readAsArrayBuffer(file);
        } else if (file) {
            setError("Invalid file type. Please select a PDF file.");
            setSelectedFile(null);
            setInputText('');
            event.target.value = null;
        }
    };

    const clearAllInput = () => {
        setInputText('');
        setSelectedFile(null);
        setError(null);
        const fileInput = document.getElementById('fileUpload');
        if (fileInput) {
            fileInput.value = null;
        }
    };

    const handleAnalyse = (type) => {
        if (!inputText.trim()) {
            setError("Please enter some text or upload a PDF to analyse.");
            setResults('');
            setActiveTab('input');
            return;
        }
        setAnalysisType(type);
        setError(null);
        setResults('');
        setActiveTab('results');
        
        let prompt = ""; // Define prompt here
        switch (type) {
            case 'narrative':
                prompt = `As a Narrative Strategist, analyse the following text from a sustainability report. Extract 3-5 potential narrative storylines, key themes, human moments, and underlying values. For each storyline, briefly suggest a target audience mindset it might appeal to. Format your output clearly with headings for each storyline. Text: "${inputText}"`;
                break;
            case 'clarity':
                prompt = `As a Communications Expert, review the following text for vague language, excessive jargon, and potentially risk-prone sustainability claims. Provide specific examples from the text. For each example, suggest 1-2 concise improvements for clarity, credibility, and impact. Format as: - Problematic Phrase: "[phrase]" | Suggestion: "[suggestion]". Text: "${inputText}"`;
                break;
            case 'quote':
                prompt = `As a Content Curator, from the following text, identify and extract up to 3-5 strong human-centered quotes, compelling case study summaries (1-2 sentences each), or impactful metrics that could be used for a social media post or campaign. Clearly label each extracted item. Text: "${inputText}"`;
                break;
            case 'emotion':
                prompt = `As a Brand Storyteller, the following text is factual and potentially dry. Suggest 2-3 distinct ways to add emotional framing or metaphors to make it more engaging, while staying true to the original facts. For each suggestion, explain the emotional angle (e.g., hope, impact, connection) and how it aligns with a professional yet empathetic brand tone. Text: "${inputText}"`;
                break;
            default:
                setError("Invalid analysis type selected.");
                setActiveTab('input');
                return; // Ensure we don't call API if type is invalid
        }
        // Only call API if prompt was successfully generated
        if (prompt) {
            callGeminiAPI(prompt, setIsLoading, setError, setResults);
        }
    };

    const formatResults = (text) => {
  if (!text) return null;

  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();

    // Bullet point detection (keep formatting)
    if (trimmed.startsWith('* ')) {
      return (
        <li key={index} style={{ marginBottom: '0.5rem' }}>
          {trimmed.replace(/^\* /, '')}
        </li>
      );
    }

    // Bold label pattern, like "**1. Human-Centered Quote:**"
    if (/^\*\*(.+?)\*\*:/.test(trimmed)) {
      const label = trimmed.match(/^\*\*(.+?)\*\*:/)[1];
      const content = trimmed.replace(/^\*\*(.+?)\*\*: */, '');
      return (
        <p key={index}>
          <strong>{label}:</strong> {content}
        </p>
      );
    }
// Tone & Clarity format: "- Problematic Phrase: ... | Suggestion: ..."
    if (/^- Problematic Phrase:/.test(trimmed)) {
      const match = trimmed.match(/^- Problematic Phrase: "(.*?)"\s*\|\s*Suggestion: "(.*?)"(.*)?/);
      if (match) {
        const phrase = match[1];
        const suggestion = match[2];
        const extra = match[3] || '';
        return (
          <div key={index} className="mb-4">
            <p><strong>Problematic Phrase:</strong><br />“{phrase}”</p>
            <p><strong>Suggestion:</strong><br />“{suggestion}” {extra.trim()}</p>
          </div>
        );
      }
    }

    // Bullet point (leave unchanged)
    if (trimmed.startsWith('* ')) {
      return (
        <li key={index} style={{ marginBottom: '0.5rem' }}>
          {trimmed.replace(/^\* /, '')}
        </li>
      );
    }

    // Bold label like "**Something:**"
    if (/^\*\*(.+?)\*\*:/.test(trimmed)) {
      const label = trimmed.match(/^\*\*(.+?)\*\*:/)[1];
      const content = trimmed.replace(/^\*\*(.+?)\*\*: */, '');
      return (
        <p key={index}>
          <strong>{label}:</strong> {content}
        </p>
      );
    }

    // Remove rogue **bold**
    const cleanLine = trimmed.replace(/\*\*/g, '');

    return (
      <p key={index} style={{ marginBottom: '1rem' }}>
        {cleanLine}
      </p>
    );
  }
}
    // Catch any leftover markdown-style bold text and remove the ** marks
    const cleanLine = trimmed.replace(/\*\*/g, '');

    return (
      <p key={index} style={{ marginBottom: '1rem' }}>
        {cleanLine}
      </p>
    );
  });
};

    
    const getAnalysisTitle = () => {
        switch (analysisType) {
            case 'narrative': return "Narrative Scan Results";
            case 'clarity': return "Tone & Clarity Review";
            case 'quote': return "Quote & Proof Extraction";
            case 'emotion': return "Emotion Builder Suggestions";
            default: return "Analysis Results";
        }
    };

    const isAnyLoading = isLoading || isPdfProcessing;

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 to-cyan-700 text-gray-800 flex flex-col items-center p-4 md:p-8 font-sans">
            {/* <header className="w-full max-w-4xl mb-8 text-center">
  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">VANDUER ANALYSER</h1>
  <p className="text-lg text-teal-100">Turn Sustainability Reports into Powerful Narratives</p>
</header> */}

            <main className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6 md:p-8">
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('input')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'input' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Input Text
                        </button>
                        <button
                            onClick={() => setActiveTab('results')}
                            disabled={!results && !isAnyLoading && !error && !analysisType}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'results' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Analysis Results
                        </button>
                    </nav>
                </div>

                <div className="min-h-[450px]">
                    {activeTab === 'input' && (
                        <div>
                            <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <UploadIcon /> Upload a PDF Document (Optional)
                                </label>
                                <input
                                    type="file"
                                    id="fileUpload"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    disabled={!isPdfJsReady || isPdfProcessing}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {!isPdfJsReady && !pdfJsLoadError && (
                                    <p className="text-xs text-amber-700 mt-2">PDF library loading, please wait...</p>
                                )}
                                {pdfJsLoadError && (
                                    <p className="text-xs text-red-700 mt-2">Failed to load PDF library: {pdfJsLoadError}. PDF upload is disabled.</p>
                                )}
                                {selectedFile && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-600">Selected: <span className="font-medium">{selectedFile}</span></p>
                                    </div>
                                )}
                                {isPdfProcessing && (
                                    <div className="mt-2 flex items-center text-sm text-teal-700">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal-500 mr-2"></div>
                                        Processing PDF...
                                    </div>
                                )}
                            </div>
                            
                            <div className="mb-1 relative">
                                <label htmlFor="inputText" className="block text-sm font-medium text-gray-700 mb-1">
                                    {selectedFile ? "Text extracted from PDF (edit if needed):" : "Or paste your sustainability report text here:"}
                                </label>
                                <textarea
                                    id="inputText"
                                    value={inputText}
                                    onChange={(e) => {
                                        setInputText(e.target.value);
                                        if (selectedFile && e.target.value === '') {
                                            setSelectedFile(null);
                                            const fileInput = document.getElementById('fileUpload');
                                            if (fileInput) fileInput.value = null;
                                        } else if (!selectedFile && e.target.value !== '') {
                                            const fileInput = document.getElementById('fileUpload');
                                            if (fileInput) fileInput.value = null;
                                        }
                                    }}
                                    rows="10"
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150 ease-in-out"
                                    placeholder={selectedFile ? "Text from PDF will appear here..." : "Enter text manually..."}
                                />
                                {(inputText || selectedFile) && (
                                     <button
                                        onClick={clearAllInput}
                                        className="absolute top-0 right-0 mt-1 mr-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
                                        title="Clear text and selection"
                                    >
                                        Clear All <ClearIcon/>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                                {['narrative', 'clarity', 'quote', 'emotion'].map((analysis) => {
                                    const icons = { narrative: <ScanIcon />, clarity: <ClarityIcon />, quote: <QuoteIcon />, emotion: <EmotionIcon /> };
                                    const titles = { narrative: "Narrative Scanner", clarity: "Tone & Clarity Review", quote: "Quote & Proof Extractor", emotion: "Emotion Builder" };
                                    const colors = { narrative: "bg-teal-500 hover:bg-teal-600", clarity: "bg-teal-500 hover:bg-teal-600", quote: "bg-sky-500 hover:bg-sky-600", emotion: "bg-rose-500 hover:bg-rose-600"};
                                    return (
                                        <button
                                            key={analysis}
                                            onClick={() => handleAnalyse(analysis)}
                                            disabled={isAnyLoading || !inputText.trim()}
                                            className={`flex items-center justify-center w-full text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${colors[analysis]}`}
                                        >
                                            {icons[analysis]} {titles[analysis]}
                                        </button>
                                    );
                                })}
                            </div>
                            {(error && activeTab === 'input') && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">
                                    <p className="font-medium">Error:</p>
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{getAnalysisTitle()}</h2>
                           {isLoading && (
  <div className="flex flex-col justify-center items-center p-10">
    <p className="text-gray-700 text-base flex items-center">
      {analysisType ? `Analysing your text for ${analysisType}` : "Loading"}
      <span className="spinner" />
    </p>
  </div>
)}

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">
                                    <p className="font-medium">Error:</p>
                                    <p>{error}</p>
                                </div>
                            )}
                            {!isLoading && !error && results && (
                                <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap">
                                    {formatResults(results)}
                                </div>
                            )}
                             {!isLoading && !error && !results && analysisType && (
                                <p className="text-gray-500 text-center py-8">No specific results were returned for this analysis. The input might have been too short or did not contain relevant information for the selected analysis type.</p>
                            )}
                            {!isLoading && !error && !results && !analysisType && (
                                 <p className="text-gray-500 text-center py-8">No analysis performed yet. Please input text or upload a PDF and select an analysis type from the 'Input Text' tab.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <footer className="w-full max-w-4xl mt-12 text-center">
                <p className="text-sm text-teal-200">&copy; {new Date().getFullYear()} VANDUER. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default App;
