import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Send, User, ArrowLeft, Loader2, MessageCircle, Reply, Edit, Trash2, MoreVertical } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const Comment = ({ comment, onReply, user, postId, refreshComments, updateCommentVote }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    
    setSubmitting(true)
    try {
      await fetch(`${BACKEND_API_URL}/api/coopforum/comments/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ 
          content: replyContent, 
          post: postId,
          parent: comment.id 
        })
      })
      setReplyContent('')
      setShowReplyForm(false)
      refreshComments()
    } catch (err) {
      console.error("Error adding reply:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (e) => {
    e.preventDefault()
    if (!editContent.trim()) return
    
    setSubmitting(true)
    try {
      await fetch(`${BACKEND_API_URL}/api/coopforum/comments/${comment.id}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ content: editContent })
      })
      setIsEditing(false)
      refreshComments()
    } catch (err) {
      console.error("Error editing comment:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await fetch(`${BACKEND_API_URL}/api/coopforum/comments/${comment.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 
          'X-CSRFToken': getCookie('csrftoken')
        }
      })
      refreshComments()
    } catch (err) {
      console.error("Error deleting comment:", err)
    }
  }

  // Modify handleVote to use the optimistic update function
  const handleVote = async (e, value) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!user) {
      alert('Please log in to vote')
      return
    }
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/coopforum/comments/${comment.id}/vote/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ value })
      })

      if (!response.ok) {
        throw new Error('Vote failed')
      }

      // Get data from response and update just this comment
      const updatedComment = await response.json()
      updateCommentVote(comment.id, updatedComment)

    } catch (err) {
      console.error("Error voting on comment:", err)
      alert('Failed to vote. Please try again.')
    }
  }

  return (
    <div className="border-l-2 border-gray-200 pl-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <User className="w-4 h-4 text-neutral-400 mr-1" />
          <span className="font-semibold text-neutral-700">{comment.user?.username || "Anonymous"}</span>
          <span className="mx-2 text-neutral-400">•</span>
          <span className="text-xs text-neutral-500">
            {comment.created_at ? new Date(comment.created_at).toLocaleString() : "Unknown date"}
          </span>
        </div>
        {/* Direct edit/delete buttons */}
        {user && user.id === comment.user?.id && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDeleteComment}
              className="text-xs text-red-600 hover:text-red-800 flex items-center"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <form onSubmit={handleEditComment} className="mb-2">
          <textarea
            className="w-full mb-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setEditContent(comment.content)
              }}
              className="px-3 py-1 mr-2 text-xs rounded-md border border-neutral-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-primary-500 text-white rounded-md flex items-center"
              style={{ backgroundColor: '#456882' }}
              disabled={submitting || !editContent.trim()}
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </button>
          </div>
        </form>
      ) : (
        <p className="text-neutral-700 mb-2">{comment.content}</p>
      )}
      
      <div className="flex items-center space-x-4 mb-2">
        <div className="flex items-center">
        <button
        onClick={(e) => handleVote(e, 1)}
        className={`text-sm transition-colors ${
            comment.user_vote === 1 ? 'text-green-600' : 'text-neutral-400 hover:text-green-600'
        }`}
        disabled={!user}
        >
        <ArrowUp className="w-4 h-4" />
        </button>
        <span className="mx-1 text-sm font-medium">{comment.score || 0}</span>
        <button
        onClick={(e) => handleVote(e, -1)}
        className={`text-sm transition-colors ${
            comment.user_vote === -1 ? 'text-red-600' : 'text-neutral-400 hover:text-red-600'
        }`}
        disabled={!user}
        >
        <ArrowDown className="w-4 h-4" />
        </button>
        </div>
        
        <button 
          onClick={() => setShowReplyForm(!showReplyForm)} 
          className="text-sm text-primary-600 flex items-center hover:underline"
          disabled={!user}
        >
          <Reply className="w-3 h-3 mr-1" /> Reply
        </button>
      </div>
      
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} className="mb-4">
          <textarea
            className="w-full mb-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1 mr-2 text-sm rounded-md border border-neutral-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm bg-primary-500 text-white rounded-md flex items-center"
              style={{ backgroundColor: '#456882' }}
              disabled={submitting || !replyContent.trim()}
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Submit
            </button>
          </div>
        </form>
      )}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-3 ml-4">
          {comment.children.map(childComment => (
            <Comment 
              key={childComment.id} 
              comment={childComment} 
              onReply={onReply}
              user={user}
              postId={postId}
              refreshComments={refreshComments}
              updateCommentVote={updateCommentVote}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const PostPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [error, setError] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [showPostDropdown, setShowPostDropdown] = useState(false)
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editPostData, setEditPostData] = useState({})

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  // Fetch post details
  const fetchPost = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${id}/`, { 
        credentials: 'include' 
      })
      
      if (!res.ok) {
        throw new Error('Failed to load post')
      }
      
      const data = await res.json()
      setPost(data)
    } catch (err) {
      console.error("Error fetching post:", err)
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Fetch comments for the post
  const fetchComments = useCallback(async () => {
    setCommentLoading(true)
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${id}/comments/`, { 
        credentials: 'include' 
      })
      
      if (!res.ok) {
        throw new Error('Failed to load comments')
      }
      
      const data = await res.json()
      
      // Process comments to create a nested structure for replies
      const commentMap = {}
      const rootComments = []
      
      // First pass - create a map of all comments by id
      data.forEach(comment => {
        commentMap[comment.id] = { ...comment, children: [] }
      })
      
      // Second pass - structure comments into parent/child relationships
      data.forEach(comment => {
        if (comment.parent) {
          // This is a reply - add to its parent's children array
          if (commentMap[comment.parent]) {
            commentMap[comment.parent].children.push(commentMap[comment.id])
          }
        } else {
          // This is a root comment
          rootComments.push(commentMap[comment.id])
        }
      })
      
      setComments(rootComments)
    } catch (err) {
      console.error("Error fetching comments:", err)
      setComments([])
    } finally {
      setCommentLoading(false)
    }
  }, [id])

  // Load post and comments on component mount
  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [fetchPost, fetchComments])

  // Handle voting on a post with optimistic updates
  const handleVote = async (value) => {
    if (!user) {
      alert('Please log in to vote')
      return
    }

    if (!post) return

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${id}/vote/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ value })
      })

      if (!response.ok) {
        throw new Error('Vote failed')
      }

      // Get the updated post data from backend
      const postResponse = await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${id}/`, {
        credentials: 'include'
      })
      
        if (postResponse.ok) {
        const updatedPost = await postResponse.json()
        setPost(updatedPost)
        }
    } catch (err) {
      console.error("Error voting:", err)
      alert('Failed to vote. Please try again.')
    }
  }

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (!user) {
      alert('Please log in to comment')
      return
    }
    if (!commentContent.trim()) return
    
    setCommentLoading(true)
    try {
      await fetch(`${BACKEND_API_URL}/api/coopforum/comments/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ content: commentContent, post: id })
      })
      setCommentContent('')
      fetchComments() // Refresh comments
    } catch (err) {
      console.error("Error adding comment:", err)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleEditPost = () => {
    setEditPostData({
      title: post.title,
      content: post.content,
      job_title: post.job_title || '',
      organization: post.organization || '',
      job_term: post.job_term || '',
      job_location: post.job_location || ''
    })
    setIsEditingPost(true)
    setShowPostDropdown(false)
  }

  const handleUpdatePost = async (e) => {
    e.preventDefault()
    
    try {
      await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${id}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(editPostData)
      })
      setIsEditingPost(false)
      fetchPost()
    } catch (err) {
      console.error("Error updating post:", err)
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await fetch(`${BACKEND_API_URL}/api/coopforum/posts/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 
          'X-CSRFToken': getCookie('csrftoken')
        }
      })
      navigate('/coop-forum')
    } catch (err) {
      console.error("Error deleting post:", err)
    }
    setShowPostDropdown(false)
  }

  const renderPostActions = () => {
    if (!user || !post || user.id !== post.user?.id) return null

    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={handleEditPost}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={handleDeletePost}
          className="text-sm text-red-600 hover:text-red-800 flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    )
  }

  // First, add this function to the PostPage component
  const updateCommentVote = (commentId, updatedComment) => {
    // Function to update a comment in the nested tree
    const updateCommentInTree = (commentsArray) => {
      return commentsArray.map(comment => {
        // If this is the comment we're voting on
        if (comment.id === commentId) {
          return { ...comment, ...updatedComment }
        }
        
        // If this comment has children, check them recursively
        if (comment.children && comment.children.length > 0) {
          return {
            ...comment,
            children: updateCommentInTree(comment.children)
          }
        }
        
        // Otherwise return the comment unchanged
        return comment
      })
    }
    
    // Update the state with the modified comment tree
    setComments(prevComments => updateCommentInTree(prevComments))
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E5E0D8' }}>
        <Navbar />
        <div className="pt-32 pb-12 px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E5E0D8' }}>
        <Navbar />
        <div className="pt-32 pb-12 px-4 max-w-4xl mx-auto">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
            <p className="text-red-800">{error || 'Post not found'}</p>
            <Link to="/coop-forum" className="mt-4 inline-flex items-center text-primary-600 hover:underline">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Forum
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E5E0D8' }}>
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link 
              to="/coop-forum" 
              className="inline-flex items-center text-primary-600 hover:underline"
              style={{ color: '#456882' }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Forum
            </Link>
          </div>
          
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isEditingPost ? (
              <form onSubmit={handleUpdatePost} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold" style={{ color: '#456882' }}>Edit Post</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingPost(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg"
                  placeholder="Title"
                  value={editPostData.title}
                  onChange={e => setEditPostData({ ...editPostData, title: e.target.value })}
                  required
                />
                
                <textarea
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg resize-none"
                  placeholder="Content"
                  rows={6}
                  value={editPostData.content}
                  onChange={e => setEditPostData({ ...editPostData, content: e.target.value })}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Job Title (optional)"
                    value={editPostData.job_title}
                    onChange={e => setEditPostData({ ...editPostData, job_title: e.target.value })}
                  />
                  <input
                    type="text"
                    className="px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Organization (optional)"
                    value={editPostData.organization}
                    onChange={e => setEditPostData({ ...editPostData, organization: e.target.value })}
                  />
                  <input
                    type="text"
                    className="px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Term (e.g. Fall 2024)"
                    value={editPostData.job_term}
                    onChange={e => setEditPostData({ ...editPostData, job_term: e.target.value })}
                  />
                  <input
                    type="text"
                    className="px-4 py-2 border border-neutral-200 rounded-lg"
                    placeholder="Location (optional)"
                    value={editPostData.job_location}
                    onChange={e => setEditPostData({ ...editPostData, job_location: e.target.value })}
                  />
                </div>
                
                <button
                  type="submit"
                  className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-all"
                  style={{ backgroundColor: '#456882' }}
                >
                  Update Post
                </button>
              </form>
            ) : (
              <div className="flex gap-6">
                {/* Voting */}
                <div className="flex flex-col items-center justify-start pt-2">
                  <button
                    className={`transition-colors ${
                      post.user_vote === 1 
                        ? 'text-green-600' 
                        : 'text-neutral-400 hover:text-green-600'
                    }`}
                    onClick={() => handleVote(1)}
                    disabled={!user}
                    title="Upvote"
                  >
                    <ArrowUp className="w-6 h-6" />
                  </button>
                  <span className="font-bold text-lg my-1">{post.score || 0}</span>
                  <button
                    className={`transition-colors ${
                      post.user_vote === -1 
                        ? 'text-red-600' 
                        : 'text-neutral-400 hover:text-red-600'
                    }`}
                    onClick={() => handleVote(-1)}
                    disabled={!user}
                    title="Downvote"
                  >
                    <ArrowDown className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-neutral-400 mr-2" />
                      <span className="font-semibold text-neutral-700">{post.user?.username || "Anonymous"}</span>
                      <span className="mx-2 text-neutral-400">•</span>
                      <span className="text-sm text-neutral-500">
                        {post.created_at ? new Date(post.created_at).toLocaleString() : "Unknown date"}
                      </span>
                    </div>
                    {/* Direct edit/delete buttons */}
                    {user && user.id === post.user?.id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleEditPost}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-2xl font-bold text-primary-700 mb-3">{post.title}</h1>
                  <p className="text-neutral-700 mb-4 whitespace-pre-line">{post.content}</p>
                  
                  {/* Job Info */}
                  {(post.job_title || post.organization || post.job_term || post.job_location) && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-2">Job Details</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {post.job_title && (
                          <div>
                            <span className="text-xs text-neutral-500">Position:</span>
                            <p className="font-semibold">{post.job_title}</p>
                          </div>
                        )}
                        {post.organization && (
                          <div>
                            <span className="text-xs text-neutral-500">Organization:</span>
                            <p className="font-semibold">{post.organization}</p>
                          </div>
                        )}
                        {post.job_term && (
                          <div>
                            <span className="text-xs text-neutral-500">Term:</span>
                            <p className="font-semibold">{post.job_term}</p>
                          </div>
                        )}
                        {post.job_location && (
                          <div>
                            <span className="text-xs text-neutral-500">Location:</span>
                            <p className="font-semibold">{post.job_location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Comments Section */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center mb-6">
              <MessageCircle className="w-5 h-5 mr-2" style={{ color: '#456882' }} />
              <h2 className="text-xl font-bold" style={{ color: '#456882' }}>Comments</h2>
            </div>
            
            {/* Add Comment Form */}
            <div className="mb-8">
              <textarea
                className="w-full mb-3 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#456882' }}
                placeholder={user ? "Add your comment..." : "Please log in to comment"}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                disabled={!user || commentLoading}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddComment}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center hover:bg-primary-600 transition-all"
                  style={{ backgroundColor: '#456882' }}
                  disabled={commentLoading || !commentContent.trim() || !user}
                >
                  {commentLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Post Comment
                </button>
              </div>
            </div>
            
            {/* Comments List */}
            {commentLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map(comment => (
                  <Comment 
                    key={comment.id} 
                    comment={comment}
                    user={user}
                    postId={id}
                    refreshComments={fetchComments}
                    updateCommentVote={updateCommentVote}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default PostPage

