import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MarkdownRenderer from "./AIMessageHandler";
interface Message {
  sender: "user" | "ai";
  text: string;
}

interface ChatModalProps {
  stackId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal = ({ stackId, isOpen, onClose }: ChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [waitingIndex, setWaitingIndex] = useState(0);
  const waitingTexts = [
    "Generating Response...",
    "Thinking through your query...",
    "Still Thinking...",
    "Getting best answer for you...",
    "Almost done, preparing answer...",
  ];
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${backendUrl}/api/v1/stacks/${stackId}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from the stack.");
      }

      const result = await response.json();
      const aiMessage: Message = { sender: "ai", text: result.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        sender: "ai",
        text: "Sorry, something went wrong.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!isLoading) {
      setWaitingIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setWaitingIndex((prev) => (prev + 1) % waitingTexts.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isLoading]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with Stack</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 border rounded-md overflow-scroll">
          {messages.length ? (
            <div className="space-y-6 w-full">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-center gap-3`}>
                  {msg.sender === "ai" ? (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {msg.sender === "user" ? (
                    <div className={`rounded-lg p-3 w-full text-black`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  ) : (
                    <div className={`rounded-lg p-3 w-full text-black`}>
                      <MarkdownRenderer rawMarkdown={msg.text} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-3 max-w-sm">
                    <p className="text-sm">{waitingTexts[waitingIndex]}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[70vh] flex justify-center items-center flex-col">
              <div className="font-semibold">GenAI Stack Chat</div>
              <div>Start a conversation with your Stack.</div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <div className="w-full flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
