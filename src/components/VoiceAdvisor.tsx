import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Mic, Play, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      console.error("ElevenLabs error:", error);
      const msg = typeof error === "string" ? error : (error as any)?.message ?? JSON.stringify(error);
      toast({
        title: "Connection Error",
        description: msg || "Failed to connect. See browser console for details.",
        variant: "destructive",
      });
    },
  });

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;
  const isListening = conversation.isListening;

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

  const state = !isConnected
    ? "idle"
    : isSpeaking
    ? "speaking"
    : isListening
    ? "listening"
    : "ready";

  const stateConfig = {
    idle: {
      Icon: Play,
      label: "Start Voice Chat",
      buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
      pulse: false,
    },
    ready: {
      Icon: Mic,
      label: "Connected…",
      buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
      pulse: true,
    },
    listening: {
      Icon: Mic,
      label: "Advisor listening…",
      buttonClass: "bg-green-500 hover:bg-green-600 text-white",
      pulse: true,
    },
    speaking: {
      Icon: Mic,
      label: "Advisor speaking…",
      buttonClass: "bg-orange-500 hover:bg-orange-600 text-white",
      pulse: true,
    },
  };

  const { Icon, label, buttonClass, pulse } = stateConfig[state];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          Voice Advisor
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Talk directly to your AI financial advisor
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-4">
        <div className="relative flex items-center justify-center">
          {pulse && (
            <>
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary/20 animate-ping" />
              <span className="absolute inline-flex h-24 w-24 rounded-full bg-primary/10 animate-ping [animation-delay:0.4s]" />
            </>
          )}
          <button
            onClick={handleToggle}
            className={cn(
              "relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95",
              buttonClass
            )}
          >
            <Icon size={26} />
          </button>
        </div>

        <span className="text-sm font-medium text-muted-foreground">{label}</span>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
            )}
          />
          {isConnected ? "Connected · WebRTC" : "Disconnected"}
        </div>

        {isConnected && (
          <button
            onClick={() => conversation.endSession()}
            className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors mt-1"
          >
            <PhoneOff size={12} />
            End session
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function VoiceAdvisor() {
  return (
    <ConversationProvider>
      <VoiceAdvisorInner />
    </ConversationProvider>
  );
}
