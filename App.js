import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Moon,
  Pin,
  PlusCircle,
  Search,
  Send,
  Settings,
  Sun,
  Users,
  Volume2,
  VolumeX,
  Edit3,
  Trash2,
} from 'lucide-react';

const PERSONAS = {
  'Game Designer': {
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    icon: '🎮',
    description: 'Expert in game mechanics and systems design',
  },
  'Game Player': {
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    icon: '🎯',
    description: 'Experienced gamer with player perspective',
  },
  'Game Researcher': {
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    icon: '📊',
    description: 'Analyst focused on gaming trends and metrics',
  },
};

function App() {
  const [selectedPersona, setSelectedPersona] = useState('Game Designer');
  const [prompt, setPrompt] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState(() => {
    const savedConversations = localStorage.getItem('conversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
  });
  const [messages, setMessages] = useState(() => {
    const savedMessages = JSON.parse(localStorage.getItem('allMessages')) || {};
    return savedMessages;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('isDarkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const savedSound = localStorage.getItem('soundEnabled');
    return savedSound ? JSON.parse(savedSound) : true;
  });
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [newChatPersona, setNewChatPersona] = useState('Game Designer');
  const [newChatPrompt, setNewChatPrompt] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('allMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const initializeBedrockSession = async (conversationId, gameIdea, persona) => {
    try {
      const response = await fetch('https://<AWS-BEDROCK-ENDPOINT>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          gameIdea,
          persona,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Bedrock session initialized:', result);
      } else {
        console.error('Bedrock initialization failed:', result);
      }
    } catch (error) {
      console.error('Error initializing Bedrock session:', error);
    }
  };
  const NewChatPopup = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={`w-full max-w-md p-6 rounded-lg shadow-lg ${
          PERSONAS[newChatPersona].color
        } text-white`}
      >
        <h3 className="text-lg font-semibold mb-4">Start a New Game Idea</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Persona</label>
          <select
            value={newChatPersona}
            onChange={(e) => setNewChatPersona(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
          >
            {Object.keys(PERSONAS).map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Game Idea (Prompt)</label>
          <textarea
            value={newChatPrompt}
            onChange={(e) => setNewChatPrompt(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
            placeholder="Type your game idea..."
          ></textarea>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowNewChatPopup(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleNewChatSubmit}
            className={`px-4 py-2 rounded-lg ${
              PERSONAS[newChatPersona]?.hoverColor || ''
            } hover:opacity-90`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );

  const handleNewChatSubmit = () => {
    if (!newChatPrompt.trim()) {
      alert('Game Idea is required.');
      return;
    }

    const newConv = {
      id: Date.now(),
      title: newChatPrompt,
      lastMessage: 'Just now',
      pinned: false,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv.id);

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: newChatPrompt,
      timestamp: new Date().toLocaleTimeString(),
      persona: newChatPersona,
    };

    setMessages((prev) => ({
      ...prev,
      [newConv.id]: [userMessage],
    }));

    setNewChatPrompt('');
    setShowNewChatPopup(false);

    initializeBedrockSession(newConv.id, newChatPrompt, newChatPersona);
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
      persona: selectedPersona,
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), userMessage],
    }));

    setPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('https://<AWS-BEDROCK-ENDPOINT>/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation,
          message: userMessage.content,
        }),
      });

      const aiMessage = await response.json();

      setMessages((prev) => ({
        ...prev,
        [activeConversation]: [...(prev[activeConversation] || []), aiMessage],
      }));
    } catch (error) {
      console.error('Error sending message to Bedrock agent:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const togglePin = (convId, e) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((conv) => (conv.id === convId ? { ...conv, pinned: !conv.pinned } : conv))
    );
  };

  const switchConversation = (convId) => {
    setActiveConversation(convId);
  };

  const renameConversation = (convId) => {
    const currentTitle = conversations.find((conv) => conv.id === convId)?.title || '';
    const newTitle = window.prompt('Rename your idea:', currentTitle);
    if (newTitle && newTitle.trim()) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId ? { ...conv, title: newTitle.trim() } : conv
        )
      );
    }
  };

  const deleteConversation = (convId) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== convId));
    setMessages((prev) => {
      const updatedMessages = { ...prev };
      delete updatedMessages[convId];
      return updatedMessages;
    });
    if (activeConversation === convId) {
      setActiveConversation(null);
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {showNewChatPopup && <NewChatPopup />}
      {/* Left Sidebar */}
      <div className={`w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r`}>
        <div className="p-4 border-b">
          <button
            onClick={() => setShowNewChatPopup(true)}
            className={`w-full flex items-center justify-center gap-2 ${
              PERSONAS[selectedPersona].color
            } text-white px-4 py-2 rounded-lg hover:opacity-90`}
          >
            <PlusCircle size={20} />
            New Idea
          </button>
          <div className="mt-4 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-145px)]">
          {sortedConversations
            .filter((conv) => conv.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((conv) => (
              <div
                key={conv.id}
                className={`group p-4 cursor-pointer ${
                  activeConversation === conv.id
                    ? isDarkMode
                      ? 'bg-gray-700'
                      : 'bg-blue-50'
                    : isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => switchConversation(conv.id)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare
                    size={20}
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {conv.title}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  <button
                    onClick={(e) => togglePin(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pin
                      size={16}
                      className={conv.pinned ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    />
                  </button>
                  <Edit3
                    size={14}
                    className="text-gray-500 hover:text-blue-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      renameConversation(conv.id);
                    }}
                  />
                  <Trash2
                    size={14}
                    className="text-gray-500 hover:text-red-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this idea?'))
                        deleteConversation(conv.id);
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b`}>
          <div className="flex justify-between items-center">
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Game Idea-nator
            </h1>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {(messages[activeConversation] || []).map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === 'user'
                    ? `${PERSONAS[message.persona].color} text-white`
                    : isDarkMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs mt-2 block">{message.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white border'}`}>
                <Loader2 className="animate-spin" size={24} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t`}>
          <div className="flex gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your game idea prompt..."
              className={`flex-1 min-h-[80px] p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
              } border`}
            />
            <button onClick={handleSendMessage} className={`px-6 py-3 ${PERSONAS[selectedPersona].color} text-white`}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;