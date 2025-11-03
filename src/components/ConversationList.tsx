import { useState, useEffect } from 'react';
import { Trash2, Archive, Edit2, Calendar } from 'lucide-react';
import { Conversation } from '../types';
import { API_CONFIG, getHeaders } from '../lib/config';

interface ConversationListProps {
  onSelectConversation?: (conversation: Conversation) => void;
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_CONFIG.conversations}?limit=50`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await fetch(`${API_CONFIG.conversations}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      setConversations(conversations.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${API_CONFIG.conversations}/${id}/archive`, {
        method: 'POST',
        headers: getHeaders(),
      });
      setConversations(conversations.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500">No conversations yet</p>
        <p className="text-sm text-slate-400 mt-1">Start a voice session to create one</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation?.(conversation)}
          className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 truncate">{conversation.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {formatDate(conversation.started_at)}
              </p>
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {conversation.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleArchive(conversation.id, e)}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={(e) => handleDelete(conversation.id, e)}
                className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
