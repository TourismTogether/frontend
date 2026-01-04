'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [formData, setFormData] = useState({
    destinationId: '',
    title: '',
    content: '',
    tags: '',
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destination')
        .select('id_destination, name')
        .order('name', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Destinations query error:', error);
        console.error('Error details:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
        });
        throw error;
      }
      
      setDestinations(data || []);
    } catch (error: any) {
      console.error('Error fetching destinations:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      // Set empty array on error so UI doesn't break
      setDestinations([]);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const generateId = (length: number = 6) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to create a post');
      return;
    }

    if (!formData.destinationId) {
      alert('Please select a destination');
      return;
    }

    setLoading(true);
    try {
      // Get user's id_user from account
      const { data: accountData, error: accountError } = await supabase
        .from('account')
        .select('id_user')
        .eq('email', user.email || '')
        .maybeSingle();

      if (accountError) {
        console.error('Account query error:', accountError);
        throw new Error(`Failed to get user account: ${accountError.message}`);
      }

      if (!accountData?.id_user) {
        throw new Error('User account not found. Please make sure you are logged in correctly.');
      }

      // Verify user exists in traveller table (required for post foreign key)
      const { data: travellerData, error: travellerError } = await supabase
        .from('traveller')
        .select('id_user')
        .eq('id_user', accountData.id_user)
        .maybeSingle();

      if (travellerError) {
        console.error('Traveller query error:', travellerError);
        throw new Error(`Failed to verify traveller: ${travellerError.message}`);
      }

      if (!travellerData) {
        throw new Error('Traveller profile not found. Please contact support.');
      }

      // Get destination's id_destination (formData.destinationId is already id_destination)
      const { data: destinationData, error: destinationError } = await supabase
        .from('destination')
        .select('id_destination, name')
        .eq('id_destination', formData.destinationId)
        .single();

      if (destinationError) {
        console.error('Destination query error:', destinationError);
        throw new Error(`Failed to get destination: ${destinationError.message}`);
      }

      if (!destinationData?.id_destination) {
        throw new Error('Destination not found');
      }

      // Generate unique post ID
      let postId = generateId(6);
      let attempts = 0;
      // Check if post ID already exists (retry up to 5 times)
      while (attempts < 5) {
        const { data: existingPost } = await supabase
          .from('post')
          .select('id_post')
          .eq('id_post', postId)
          .maybeSingle();
        
        if (!existingPost) break;
        postId = generateId(6);
        attempts++;
      }

      // Create post
      const { data: newPost, error: insertError } = await supabase
        .from('post')
        .insert([
          {
            id_post: postId,
            id_user: accountData.id_user,
            id_destination: destinationData.id_destination,
            title: formData.title,
            content: formData.content,
            tags: formData.tags || `destination:${destinationData.name}`,
            total_likes: 0,
            total_views: 0,
          },
        ])
        .select();

      if (insertError) {
        console.error('Post insert error:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message,
        });
        throw new Error(`Failed to create post: ${insertError.message || insertError.details || 'Unknown error'}`);
      }

      if (!newPost || newPost.length === 0) {
        throw new Error('Post was not created. Please try again.');
      }

      console.log('Post created successfully:', newPost[0]);
      onPostCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      const errorMessage = error.message || error.details || 'Failed to create post. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Destination <span className="text-destructive">*</span>
            </label>
            {loadingDestinations ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-post"></div>
              </div>
            ) : (
              <select
                value={formData.destinationId}
                onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-post bg-background text-foreground"
                required
              >
                <option value="">Choose a destination...</option>
                {destinations.map((dest) => (
                  <option key={dest.id_destination} value={dest.id_destination}>
                    {dest.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-post bg-background text-foreground"
              placeholder="Give your post a title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-post bg-background text-foreground"
              placeholder="Share your experience, tips, or questions about this destination..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags (optional, comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-post bg-background text-foreground"
              placeholder="travel, tips, review"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.destinationId}
              className="px-4 py-2 bg-post hover:bg-post/90 text-white rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

