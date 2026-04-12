import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Mic, Play, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string;

function VoiceAdvisorInner() {
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      toast({ title: "Voice Advisor Connected", description: "Start speaking to your AI financial advisor." });
    },
    onDisconnect: () => {
      toast({ title: "Session Ended", description: "Voice advisor session has ended." });
    },
    onError: (error) => {
      const msg = typeof error === "string" ? error : (error as any)?.message ?? JSON.stringify(error);
      toast({ title: "Connection Error", description: msg || "Failed to connect.", variant: "destructive" });
    },
  });

  const isConnected = conversation.status === "connected";
  const isSpeaking  = conversation.isSpeaking;
  const isListening = conversation.isListening;

  const state = !isConnected ? "idle" : isSpeaking ? "speaking" : isListening ? "listening" : "ready";

  const stateConfig = {
    idle: {
      Icon: Play,
      label: "Tap to start",
      sublabel: "Press and talk to your AI financial advisor",
      ringColor: "bg-primary/20",
      ringColor2: "bg-primary/10",
      buttonGradient: "from-indigo-500 to-purple-600",
      shadow: "shadow-indigo-300/40",
      pulse: false,
      dotColor: "bg-gray-300",
      statusText: "Ready to connect",
    },
    ready: {
      Icon: Mic,
      label: "Connected",
      sublabel: "Speak now — your advisor is listening",
      ringColor: "bg-blue-400/25",
      ringColor2: "bg-blue-400/12",
      buttonGradient: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-300/40",
      pulse: true,
      dotColor: "bg-blue-400",
      statusText: "Connected · WebRTC",
    },
    listening: {
      Icon: Mic,
      label: "Listening…",
      sublabel: "Go ahead, ask anything about investing",
      ringColor: "bg-emerald-400/25",
      ringColor2: "bg-emerald-400/12",
      buttonGradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-300/40",
      pulse: true,
      dotColor: "bg-emerald-400",
      statusText: "Listening · WebRTC",
    },
    speaking: {
      Icon: Mic,
      label: "Advisor speaking…",
      sublabel: "Your AI advisor is responding",
      ringColor: "bg-orange-400/25",
      ringColor2: "bg-orange-400/12",
      buttonGradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-300/40",
      pulse: true,
      dotColor: "bg-orange-400",
      statusText: "Speaking · WebRTC",
    },
  };

  const { Icon, label, sublabel, ringColor, ringColor2, buttonGradient, shadow, pulse, dotColor, statusText } =
    stateConfig[state];

  const handleToggle = async () => {
    if (isConnected) {
      conversation.endSession();
      return;
    }
    if (!agentId || agentId === "your_elevenlabs_agent_id_here") {
      toast({
        title: "Agent ID Required",
        description: "Add your ElevenLabs Agent ID to .env (VITE_ELEVENLABS_AGENT_ID)",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({ agentId, connectionType: "websocket" });
    } catch {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please allow microphone permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">

      {/* Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-4 py-1.5 text-primary text-xs font-semibold">
          <span className={cn("h-1.5 w-1.5 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-primary")} />
          AI-Powered Voice Advisor
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Voice Financial Advisor</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
          Ask anything about stocks, investing strategies, or market analysis in real time.
        </p>
      </div>

      {/* Big mic button with rings */}
      <div className="relative flex items-center justify-center" style={{ height: 260, width: 260 }}>

        {/* Outer pulse ring */}
        {pulse && (
          <>
            <span className={cn("absolute rounded-full animate-ping", ringColor2)} style={{ width: 240, height: 240 }} />
            <span className={cn("absolute rounded-full animate-ping [animation-delay:0.3s]", ringColor)} style={{ width: 200, height: 200 }} />
            <span className={cn("absolute rounded-full animate-ping [animation-delay:0.6s]", ringColor)} style={{ width: 170, height: 170 }} />
          </>
        )}

        {/* Static background ring */}
        <span className={cn("absolute rounded-full opacity-20", ringColor)} style={{ width: 200, height: 200 }} />
        <span className={cn("absolute rounded-full opacity-10", ringColor2)} style={{ width: 230, height: 230 }} />

        {/* Main button */}
        <button
          onClick={handleToggle}
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full text-white transition-all duration-300",
            "shadow-2xl hover:scale-105 active:scale-95",
            `bg-gradient-to-br ${buttonGradient} ${shadow}`
          )}
          style={{ width: 140, height: 140 }}
        >
          <Icon size={52} strokeWidth={1.5} />
        </button>
      </div>

      {/* State label */}
      <div className="text-center space-y-1.5 -mt-4">
        <div className="text-xl font-bold text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">{sublabel}</div>
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 shadow-sm">
        <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor, isConnected && "animate-pulse")} />
        <span className="text-xs font-medium text-muted-foreground">{statusText}</span>
      </div>

      {/* End session */}
      {isConnected && (
        <button
          onClick={() => conversation.endSession()}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-full transition-colors font-medium"
        >
          <PhoneOff size={15} />
          End Session
        </button>
      )}

      {/* Hint */}
      {!isConnected && (
        <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
          Powered by ElevenLabs Conversational AI · Requires microphone access
        </p>
      )}
    </div>
  );
}

export function VoiceAdvisor() {
  return (
    <ConversationProvider>
      <VoiceAdvisorInner />
    </ConversationProvider>
  );
}
