import React, { useState } from 'react';
import api from '../config/api';

export default function SuggestionForm() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/api/submit_suggestion/', {
        suggestion: text.trim()
      });

      setMessage(response.data.message || 'Thank you for your feedback!');
      setText('');
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }

    // Clear messages after 3 seconds
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <textarea
        required
        placeholder="Your feedback..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={loading}
        className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
        maxLength={1000}
      />
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {text.length}/1000 characters
        </span>
        
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 hover:translate-y-[-1px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>
    </form>
  );
}