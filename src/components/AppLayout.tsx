import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, Settings, HelpCircle, Wallet, Plus, Check } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export default function AppLayout() {
  const { walletBalance, addFunds } = usePortfolio();

  const [depositOpen,  setDepositOpen]  = useState(false);
  const [depositInput, setDepositInput] = useState("");
  const [justAdded,    setJustAdded]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openDeposit() {
    setDepositOpen(true);
    setDepositInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function confirmDeposit() {
    const amount = parseFloat(depositInput);
    if (!isNaN(amount) && amount > 0) {
      addFunds(amount);
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        setDepositOpen(false);
        setDepositInput("");
      }, 1200);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirmDeposit();
    if (e.key === "Escape") { setDepositOpen(false); setDepositInput(""); }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-[60px] flex items-center gap-3 border-b border-border bg-white px-5 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors mr-1" />

            {/* User info */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                J
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">Jiten Bhalavat</span>
                  <span className="text-[10px] font-semibold bg-primary text-white px-1.5 py-0.5 rounded-full">PRO</span>
                </div>
                <div className="text-xs text-muted-foreground">@jiten_finwise</div>
              </div>
            </div>

            {/* Wallet button + Add Funds inline */}
            <div className="relative ml-1">
              {!depositOpen ? (
                /* Wallet balance pill — click to open deposit panel */
                <button
                  onClick={openDeposit}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-sm shadow-primary/25"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </button>
              ) : justAdded ? (
                /* Success flash */
                <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
                  <Check className="h-3.5 w-3.5" /> Added!
                </div>
              ) : (
                /* Inline "Add Funds" input */
                <div className="flex items-center gap-1.5 bg-white border-2 border-primary rounded-full px-2 py-1 shadow-sm shadow-primary/20">
                  <span className="text-xs text-muted-foreground font-medium pl-1">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    placeholder="Amount"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (!depositInput) { setDepositOpen(false); } }}
                    className="w-24 text-sm font-semibold text-foreground outline-none bg-transparent placeholder:text-muted-foreground/50"
                  />
                  <button
                    onClick={confirmDeposit}
                    disabled={!depositInput || isNaN(parseFloat(depositInput)) || parseFloat(depositInput) <= 0}
                    className="flex items-center gap-1 bg-primary disabled:opacity-40 text-white text-xs font-bold px-2.5 py-1 rounded-full transition-all hover:bg-primary/90"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              )}

              {/* Tooltip hint when closed */}
              {!depositOpen && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-muted-foreground pointer-events-none opacity-0 group-hover:opacity-100">
                  click to add funds
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative hidden lg:flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                placeholder="Search here..."
                className="h-9 pl-9 pr-4 w-52 rounded-full bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1">
              <button className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-white" />
              </button>
              <button className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-muted transition-colors">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:block">Help</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
