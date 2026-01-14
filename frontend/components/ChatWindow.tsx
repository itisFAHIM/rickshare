import { useState, useEffect, useRef } from "react";
import api from "../lib/api";

interface ChatWindowProps {
    rideId: number;
    currentUserRole: 'passenger' | 'driver';
    currentUsername: string;
}

export default function ChatWindow({ rideId, currentUserRole, currentUsername }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/rides/${rideId}/messages/`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [rideId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/rides/${rideId}/messages/`, { content: newMessage });
            setNewMessage("");
            fetchMessages(); // Refresh immediately
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-black p-4 text-white">
                <h3 className="font-bold text-lg">Chat with {currentUserRole === 'passenger' ? 'Driver' : 'Passenger'}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg: any) => {
                    const isMe = msg.sender === currentUsername;

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <span className="text-xs text-gray-500 mb-1">{isMe ? "You" : msg.sender}</span>
                            <div className={`${isMe ? "bg-black text-white" : "bg-white text-gray-800"} p-3 rounded-lg shadow-sm border border-gray-100 max-w-[80%] ${isMe ? "rounded-br-none" : "rounded-bl-none"}`}>
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
