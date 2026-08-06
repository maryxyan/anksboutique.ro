import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Shield } from "lucide-react";

const STORAGE_KEY = "anks_cookie_consent";

interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, marketing: boolean) {
  const state: ConsentState = {
    necessary: true,
    analytics,
    marketing,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface CategoryRowProps {
  title: string;
  description: string;
  locked?: boolean;
  checked: boolean;
  onChange?: (v: boolean) => void;
}

function CategoryRow({ title, description, locked, checked, onChange }: CategoryRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            aria-label={title}
            disabled={locked}
            onClick={(e) => {
              e.stopPropagation();
              if (!locked && onChange) onChange(!checked);
            }}
            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
              checked ? "bg-foreground" : "bg-border"
            } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                checked ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm font-medium truncate">{title}</span>
          {locked && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 flex-shrink-0">
              Întotdeauna activ
            </span>
          )}
        </div>
        <span className="ml-2 text-muted-foreground flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>
      {open && (
        <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          {description}
        </div>
      )}
    </div>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = loadConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    saveConsent(true, true);
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent(false, false);
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent(analytics, marketing);
    setVisible(false);
  };

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div className="fixed inset-0 bg-black/20 z-[9998] pointer-events-none" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Consimțământ cookie-uri"
        className="fixed bottom-0 left-0 right-0 z-[9999] md:bottom-6 md:left-6 md:right-auto md:max-w-md w-full"
      >
        <div className="min-h-[414px] md:min-h-0 bg-background border border-border shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium uppercase tracking-widest">Cookie-uri & Confidențialitate</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {!showSettings ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizăm cookie-uri pentru a îmbunătăți experiența ta pe site-ul nostru. Unele sunt esențiale pentru funcționarea corectă a magazinului, altele ne ajută să înțelegem cum este utilizat site-ul.
                  <br />
                  <br />
                  Prin alegerea ta, îți exerciți drepturile conform{" "}
                  <strong>Regulamentului GDPR (UE) 2016/679</strong> și legislației românești în vigoare.
                </p>

                {/* Action buttons — equal visual weight */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={rejectAll}
                    className="h-10 border border-border text-sm font-medium uppercase tracking-widest hover:bg-muted transition-colors"
                  >
                    Refuz
                  </button>
                  <button
                    onClick={acceptAll}
                    className="h-10 bg-foreground text-background text-sm font-medium uppercase tracking-widest hover:bg-foreground/80 transition-colors"
                  >
                    Accept Tot
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-center py-1"
                >
                  Personalizează preferințele
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Alege ce categorii de cookie-uri accepți. Cookie-urile necesare nu pot fi dezactivate.
                </p>

                <div className="space-y-2">
                  <CategoryRow
                    title="Cookie-uri necesare"
                    locked
                    checked={true}
                    description="Esențiale pentru funcționarea site-ului: coșul de cumpărături, sesiunea utilizatorului, preferințele de bază. Nu colectăm date personale suplimentare prin aceste cookie-uri."
                  />
                  <CategoryRow
                    title="Cookie-uri de analiză"
                    checked={analytics}
                    onChange={setAnalytics}
                    description="Ne ajută să înțelegem cum interacționezi cu site-ul (pagini vizitate, timp petrecut). Datele sunt anonimizate și folosite exclusiv pentru îmbunătățirea magazinului nostru."
                  />
                  <CategoryRow
                    title="Cookie-uri de marketing"
                    checked={marketing}
                    onChange={setMarketing}
                    description="Permit afișarea de reclame personalizate pe platforme externe (ex. Instagram, Google). Poți refuza fără a afecta funcționalitatea magazinului."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={rejectAll}
                    className="h-10 border border-border text-sm font-medium uppercase tracking-widest hover:bg-muted transition-colors"
                  >
                    Refuz Tot
                  </button>
                  <button
                    onClick={saveCustom}
                    className="h-10 bg-foreground text-background text-sm font-medium uppercase tracking-widest hover:bg-foreground/80 transition-colors"
                  >
                    Salvează
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-center py-1"
                >
                  ← Înapoi
                </button>
              </>
            )}

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Operator: Ank's Boutique · Poți retrage consimțământul oricând din{" "}
              <button
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setVisible(true);
                  setShowSettings(false);
                  setAnalytics(false);
                  setMarketing(false);
                }}
                className="underline underline-offset-1 hover:text-foreground transition-colors"
              >
                setări cookie
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function useCookieConsent() {
  const consent = loadConsent();
  return {
    hasConsent: !!consent,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  };
}
