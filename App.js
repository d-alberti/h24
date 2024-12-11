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
  Trash2
} from 'lucide-react';

// AWS API Gateway endpoint for Bedrock Agent
const API_ENDPOINT = 'https://ygpxw3ywk7.execute-api.us-east-1.amazonaws.com/prod/gameidea';

const PERSONAS = {
  'Game Designer': {
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    icon: '🎮',
    description: 'Expert in game mechanics and systems design'
  },
  'Game Player': {
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    icon: '🎯',
    description: 'Experienced gamer with player perspective'
  },
  'Game Researcher': {
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    icon: '📊',
    description: 'Analyst focused on gaming trends and metrics'
  }
};

function App() {
  const [selectedPersona, setSelectedPersona] = useState('Game Designer');
  const [prompt, setPrompt] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);

  const [playerAge, setPlayerAge] = useState('');
  const [researchType, setResearchType] = useState('Survey');
  const [showAgeField, setShowAgeField] = useState(false);
  const [showResearchField, setShowResearchField] = useState(false);

  const RESEARCH_TYPES = {
    'Survey': 'Survey',
    'Focus Group': 'Focus Group'
  };

  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false);
  const [newIdeaPrompt, setNewIdeaPrompt] = useState('');
  const [newIdeaPersona, setNewIdeaPersona] = useState('Game Designer');

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
  const [showPersonaInfo, setShowPersonaInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New state for Bedrock sessions
  const [conversationSessions, setConversationSessions] = useState({});

  const messagesEndRef = useRef(null);
  // useEffect hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('conversationSessions', JSON.stringify(conversationSessions));
  }, [conversationSessions]);

  useEffect(() => {
    localStorage.setItem('allMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Main message handling function
  const handleSendMessage = async () => {
    if (!prompt.trim() || isLoading || !activeConversation) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
      persona: selectedPersona
    };

    setMessages(prev => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), userMessage]
    }));
    
    setPrompt('');
    setIsLoading(true);

    try {
      // Debug log the request
      // Replace this part in handleSendMessage
      const requestBody = {
        prompt: selectedPersona === 'Game Player' && playerAge 
          ? `[From a ${playerAge}-year-old player's perspective] ${prompt}`
          : selectedPersona === 'Game Researcher' && researchType
          ? `[Using ${researchType} research methodology] ${prompt}`
          : prompt,
        persona: selectedPersona,
        sessionId: conversationSessions[activeConversation]
      };
      console.log('Sending request to Bedrock:', requestBody);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from Bedrock');
      }

      if (data.sessionId) {
        setConversationSessions(prev => ({
          ...prev,
          [activeConversation]: data.sessionId
        }));
      }

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: `${PERSONAS[selectedPersona].icon} ${data.response}`,
        timestamp: new Date().toLocaleTimeString(),
        persona: selectedPersona
      };

      setMessages(prev => ({
        ...prev,
        [activeConversation]: [...(prev[activeConversation] || []), aiMessage]
      }));

      // Update conversation timestamp
      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeConversation
            ? { ...conv, lastMessage: 'Just now' }
            : conv
        )
      );

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString(),
        persona: selectedPersona
      };

      setMessages(prev => ({
        ...prev,
        [activeConversation]: [...(prev[activeConversation] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewIdeaSubmit = () => {
    if (!newIdeaPrompt.trim()) return;
  
    // Validate required fields
    if (newIdeaPersona === 'Game Player' && !playerAge) {
      alert('Please enter the player age');
      return;
    }
  
    const formattedPrompt = newIdeaPersona === 'Game Player' && playerAge 
      ? `[From a ${playerAge}-year-old player's perspective] ${newIdeaPrompt}`
      : newIdeaPersona === 'Game Researcher' && researchType
      ? `[Using ${researchType} research methodology] ${newIdeaPrompt}`
      : newIdeaPrompt;
  
    const newConv = {
      id: Date.now(),
      title: newIdeaPrompt.length > 30 
        ? newIdeaPrompt.substring(0, 30) + '...' 
        : newIdeaPrompt,
      lastMessage: 'Just now',
      pinned: false
    };
  
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv.id);
  
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: formattedPrompt,
      timestamp: new Date().toLocaleTimeString(),
      persona: newIdeaPersona
    };
  
    setMessages(prev => ({
      ...prev,
      [newConv.id]: [userMessage]
    }));
  
    setNewIdeaPrompt('');
    setShowNewIdeaForm(false);
  
    handleInitialResponse(newConv.id, formattedPrompt, newIdeaPersona);
  };

  const handleInitialResponse = async (convId, prompt, persona) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          persona,
          sessionId: null // New conversation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // Store session ID
      if (data.sessionId) {
        setConversationSessions(prev => ({
          ...prev,
          [convId]: data.sessionId
        }));
      }

      const aiMessage = {
        id: Date.now(),
        sender: 'ai',
        content: `${PERSONAS[persona].icon} ${data.response}`,
        timestamp: new Date().toLocaleTimeString(),
        persona: persona
      };

      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), aiMessage]
      }));

    } catch (error) {
      console.error('Error getting initial response:', error);
      const errorMessage = {
        id: Date.now(),
        sender: 'ai',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        persona: persona
      };

      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Persona change handler
  const handlePersonaChange = (e) => {
    const newPersona = e.target.value;
    setSelectedPersona(newPersona);
    
    // Show/hide dynamic fields based on persona
    setShowAgeField(newPersona === 'Game Player');
    setShowResearchField(newPersona === 'Game Researcher');
    
    if (activeConversation) {
      let additionalInfo = '';
      if (newPersona === 'Game Player' && playerAge) {
        additionalInfo = ` (Age: ${playerAge})`;
      } else if (newPersona === 'Game Researcher' && researchType) {
        additionalInfo = ` (${researchType})`;
      }
  
      const notificationMessage = {
        id: Date.now(),
        sender: 'ai',
        content: `${PERSONAS[newPersona].icon} Switching perspective to ${newPersona}${additionalInfo}. I'll now analyze your game ideas from this new viewpoint.`,
        timestamp: new Date().toLocaleTimeString(),
        persona: newPersona
      };
  
      setMessages(prev => ({
        ...prev,
        [activeConversation]: [...(prev[activeConversation] || []), notificationMessage]
      }));
    }
  };

  // Pin conversation
  const togglePin = (convId, e) => {
    e.stopPropagation();
    setConversations(prev =>
      prev.map(conv =>
        conv.id === convId ? { ...conv, pinned: !conv.pinned } : conv
      )
    );
  };

  // Switch between conversations
  const switchConversation = (convId) => {
    setActiveConversation(convId);
  };

  // Rename conversation
  const renameConversation = (convId) => {
    const currentTitle = conversations.find(conv => conv.id === convId)?.title || '';
    const newTitle = window.prompt('Rename your idea:', currentTitle);
    if (newTitle && newTitle.trim()) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === convId ? { ...conv, title: newTitle.trim() } : conv
        )
      );
    }
  };

  // Delete conversation
  const deleteConversation = (convId) => {
    if (window.confirm('Are you sure you want to delete this idea?')) {
      setConversations(prev => prev.filter(conv => conv.id !== convId));
      
      // Clean up messages
      setMessages(prev => {
        const updatedMessages = { ...prev };
        delete updatedMessages[convId];
        return updatedMessages;
      });
      
      // Clean up sessions
      setConversationSessions(prev => {
        const updatedSessions = { ...prev };
        delete updatedSessions[convId];
        return updatedSessions;
      });
      
      if (activeConversation === convId) {
        setActiveConversation(null);
      }
    }
  };

  // Sort conversations with pinned ones first
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Settings handlers
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const togglePersonaInfo = () => {
    setShowPersonaInfo(!showPersonaInfo);
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Left Sidebar */}
      <div className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
        <div className="p-4 border-b border-gray-200">
          <button 
            onClick={() => setShowNewIdeaForm(true)}
            className={`w-full flex items-center justify-center gap-2 ${PERSONAS[selectedPersona].color} text-white px-4 py-2 rounded-lg hover:opacity-90`}
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
                isDarkMode 
                  ? 'bg-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-145px)]">
          {sortedConversations
            .filter(conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(conv => (
              <div 
                key={conv.id}
                className={`group p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} cursor-pointer hover:bg-opacity-80 transition-all ${
                  activeConversation === conv.id 
                    ? isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                    : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => switchConversation(conv.id)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {conv.pinned && <Pin size={14} className="text-blue-500" />}
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                        {conv.title}
                      </h3>
                      <Edit3 
                        size={14} 
                        className="text-gray-500 hover:text-blue-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          renameConversation(conv.id);
                        }}
                      />
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  <button
                    onClick={(e) => togglePin(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pin size={16} className={conv.pinned ? 'text-blue-500' : 'text-gray-500'} />
                  </button>
                  <Trash2 
                    size={14} 
                    className="text-gray-500 hover:text-red-500 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
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
        <div className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
          <div className="flex justify-between items-center">
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Game Idea-nator
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Users size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <select 
                    value={selectedPersona}
                    onChange={handlePersonaChange}
                    className={`border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {Object.keys(PERSONAS).map(persona => (
                      <option key={persona}>{persona}</option>
                    ))}
                  </select>
                  <AlertCircle 
                    size={16}
                    className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-pointer`}
                    onClick={togglePersonaInfo}
                  />
                  </select>
                    {showAgeField && (
                      <div className="mt-2">
                        <label 
                          className={`block text-sm font-medium ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          Player Age
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={playerAge}
                          onChange={(e) => setPlayerAge(e.target.value)}
                          className={`mt-1 block w-full rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-900 border-gray-300'
                          } border px-3 py-2`}
                          placeholder="Enter age"
                        />
                      </div>
                    )}

                    {showResearchField && (
                      <div className="mt-2">
                        <label 
                          className={`block text-sm font-medium ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          Question Type
                        </label>
                        <select
                          value={researchType}
                          onChange={(e) => setResearchType(e.target.value)}
                          className={`mt-1 block w-full rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-900 border-gray-300'
                          } border px-3 py-2`}
                        >
                          {Object.entries(RESEARCH_TYPES).map(([key, value]) => (
                            <option key={key} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>
                {showPersonaInfo && (
                  <div className={`absolute right-0 mt-2 w-64 p-4 rounded-lg shadow-lg z-10 ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  }`}>
                    <h3 className="font-medium mb-2">{selectedPersona}</h3>
                    <p className="text-sm">{PERSONAS[selectedPersona].description}</p>
                  </div>
                )}
              </div>
              <button
                onClick={toggleSound}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                ) : (
                  <VolumeX size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                )}
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
              >
                {isDarkMode ? (
                  <Sun size={20} className="text-gray-400" />
                ) : (
                  <Moon size={20} className="text-gray-500" />
                )}
              </button>
              <button
                onClick={toggleSettings}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
              >
                <Settings size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {(messages[activeConversation] || []).map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-4 ${
                message.sender === 'user' 
                  ? `${PERSONAS[message.persona].color} text-white` 
                  : isDarkMode 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white border border-gray-200'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className={`text-xs mt-2 block ${
                  message.sender === 'user' 
                    ? 'text-white/70' 
                    : isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-500'
                }`}>
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-lg p-4 ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200'
              }`}>
                <Loader2 className="animate-spin" size={24} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
          <div className="flex gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your game idea prompt..."
              className={`flex-1 min-h-[80px] p-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white text-gray-900 placeholder-gray-500'
              } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !prompt.trim()}
              className={`self-end px-6 py-3 rounded-lg text-white flex items-center gap-2 ${
                PERSONAS[selectedPersona].color
              } ${
                (isLoading || !prompt.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              Send
            </button>
          </div>
        </div>
        {/* Add this inside your main JSX, before the closing div */}
  {showNewIdeaForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          New Game Idea
        </h2>
        <div className="space-y-4">
          <div>
            <label 
              className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              Select Persona
            </label>
            <select
              value={newIdeaPersona}
              onChange={(e) => setNewIdeaPersona(e.target.value)}
              className={`w-full rounded-lg px-3 py-2 border ${
                isDarkMode 
                  ? 'bg-gray-700 text-white border-gray-600' 
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              {Object.keys(PERSONAS).map(persona => (
                <option key={persona} value={persona}>{persona}</option>
              ))}
            </select>
          </div>
          <div>
            <label 
              className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              Game Idea
            </label>
            <textarea
              value={newIdeaPrompt}
              onChange={(e) => setNewIdeaPrompt(e.target.value)}
              placeholder="Describe your game idea..."
              className={`w-full min-h-[100px] rounded-lg px-3 py-2 border ${
                isDarkMode 
                  ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                  : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
              }`}
            />
            {newIdeaPersona === 'Game Player' && (
            <div className="mt-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Player Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={playerAge}
                onChange={(e) => setPlayerAge(e.target.value)}
                className={`mt-1 block w-full rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border px-3 py-2`}
                placeholder="Enter age"
                required
              />
            </div>
          )}

          {newIdeaPersona === 'Game Researcher' && (
            <div className="mt-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Question Type
              </label>
              <select
                value={researchType}
                onChange={(e) => setResearchType(e.target.value)}
                className={`mt-1 block w-full rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border px-3 py-2`}
              >
                {Object.entries(RESEARCH_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
              </select>
            </div>
          )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleNewIdeaSubmit}
              disabled={!newIdeaPrompt.trim()}
              className={`flex-1 py-2 rounded-lg text-white ${
                newIdeaPrompt.trim() 
                  ? PERSONAS[newIdeaPersona].color 
                  : 'bg-gray-400'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setShowNewIdeaForm(false)}
              className={`flex-1 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
      </div>
    </div>
  );
}

export default App;