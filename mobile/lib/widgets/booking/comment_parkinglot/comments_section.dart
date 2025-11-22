import 'package:flutter/material.dart';
import '../../../../services/comment_service.dart';
import '../../../../services/user_service.dart';

class CommentsSection extends StatefulWidget {
  final String parkingLotId;

  const CommentsSection({super.key, required this.parkingLotId});

  @override
  State<CommentsSection> createState() => _CommentsSectionState();
}

class _CommentsSectionState extends State<CommentsSection> {
  final _commentController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  List<Map<String, dynamic>> _comments = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  int _currentPage = 1;
  int _pageSize = 10;
  bool _hasMore = true;
  int? _selectedStar;
  String? _replyingToId;
  String? _replyingToUserName;
  String? _currentAccountId;
  bool _hasUserCommented = false;
  String? _editingCommentId;

  @override
  void initState() {
    super.initState();
    _loadCurrentAccountId();
    _loadComments();
  }

  /// Load current account ID from token or user data
  Future<void> _loadCurrentAccountId() async {
    try {
      // Try to get from user profile API
      final userProfile = await UserService.getUserProfile();
      if (userProfile['data'] != null && userProfile['data']['_id'] != null) {
        setState(() {
          _currentAccountId = userProfile['data']['_id'] as String;
        });
        print('✅ Current account ID: $_currentAccountId');
        return;
      }

      // Fallback: decode from token
      final token = await UserService.getToken();
      if (token != null) {
        final claims = await UserService.decodeJWTToken(token);
        if (claims != null) {
          final accountId =
              claims['sub'] ??
              claims['id'] ??
              claims['_id'] ??
              claims['accountId'] ??
              claims['userId'];
          if (accountId != null) {
            setState(() {
              _currentAccountId = accountId.toString();
            });
            print('✅ Current account ID from token: $_currentAccountId');
            return;
          }
        }
      }

      // Try from userData
      final userData = await UserService.getUserData();
      if (userData != null) {
        final accountId =
            userData['accountId'] ??
            userData['user']?['_id'] ??
            userData['user']?['id'];
        if (accountId != null) {
          setState(() {
            _currentAccountId = accountId.toString();
          });
          print('✅ Current account ID from userData: $_currentAccountId');
        }
      }
    } catch (e) {
      print('⚠️ Error loading account ID: $e');
    }
  }

  /// Check if current user has already commented
  void _checkUserHasCommented() {
    if (_currentAccountId == null) return;

    final hasCommented = _comments.any((comment) {
      final commentAccountId = comment['accountId']?.toString();
      return commentAccountId == _currentAccountId &&
          comment['parentId'] == null;
    });

    setState(() {
      _hasUserCommented = hasCommented;
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadComments({bool refresh = false}) async {
    // Validate parking lot ID
    if (widget.parkingLotId.isEmpty) {
      print('⚠️ Parking lot ID is empty');
      setState(() {
        _errorMessage = 'ID bãi đỗ xe không hợp lệ';
        _isLoading = false;
      });
      return;
    }

    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMore = true;
        _comments = [];
      });
    }

    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('📥 Loading comments for parking lot: ${widget.parkingLotId}');

      final response = await CommentService.getCommentsByParkingLot(
        parkingLotId: widget.parkingLotId,
        page: _currentPage,
        pageSize: _pageSize,
      );

      print('📦 Response structure: ${response.keys}');

      // Handle nested data structure: response['data']['data'] or response['data']
      dynamic commentsData = response['data'];
      List<Map<String, dynamic>> newComments = [];

      // Check if data is nested (data.data structure)
      if (commentsData is Map && commentsData.containsKey('data')) {
        final nestedData = commentsData['data'];
        if (nestedData is List) {
          newComments = List<Map<String, dynamic>>.from(nestedData);
        }
        // Get pagination from nested structure
        final totalItems = commentsData['totalItems'] ?? 0;
        final totalPages = commentsData['totalPages'] ?? 1;
        final currentPage = commentsData['currentPage'] ?? 1;

        print(
          '📊 Pagination (nested): totalItems=$totalItems, totalPages=$totalPages, currentPage=$currentPage',
        );

        setState(() {
          if (refresh) {
            _comments = newComments;
          } else {
            _comments.addAll(newComments);
          }
          _hasMore = _currentPage < totalPages;
          _isLoading = false;
        });
        _checkUserHasCommented();
      } else if (commentsData is List) {
        // Direct array structure
        newComments = List<Map<String, dynamic>>.from(commentsData);

        final pagination = response['pagination'];
        final totalPages = pagination?['totalPages'] ?? 1;

        print('📊 Pagination (direct): totalPages=$totalPages');

        setState(() {
          if (refresh) {
            _comments = newComments;
          } else {
            _comments.addAll(newComments);
          }
          _hasMore = _currentPage < totalPages;
          _isLoading = false;
        });
        _checkUserHasCommented();
      } else {
        // No comments found or unexpected structure
        print('⚠️ Unexpected data structure: ${commentsData.runtimeType}');
        setState(() {
          if (refresh) {
            _comments = [];
          }
          _hasMore = false;
          _isLoading = false;
        });
        _checkUserHasCommented();
      }

      print('✅ Loaded ${newComments.length} comments (page $_currentPage)');
    } catch (e) {
      print('❌ Error loading comments: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải bình luận: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadMoreComments() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _currentPage++;
    });

    await _loadComments();
  }

  Future<void> _submitComment() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_commentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập nội dung bình luận'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Check if editing existing comment
    if (_editingCommentId != null) {
      await _updateComment();
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await CommentService.createComment(
        targetId: widget.parkingLotId,
        content: _commentController.text.trim(),
        targetType: 'ParkingLot',
        parentId: _replyingToId,
        star: _selectedStar,
      );

      // Clear form and hide it
      _commentController.clear();
      setState(() {
        _selectedStar = null;
        _replyingToId = null;
        _replyingToUserName = null;
        _hasUserCommented = true; // Hide form after successful comment
      });

      // Reload comments
      await _loadComments(refresh: true);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã thêm bình luận thành công'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Error submitting comment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi thêm bình luận: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _updateComment() async {
    if (_editingCommentId == null) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      await CommentService.updateComment(
        id: _editingCommentId!,
        content: _commentController.text.trim(),
        star: _selectedStar,
      );

      // Clear form
      _commentController.clear();
      setState(() {
        _selectedStar = null;
        _editingCommentId = null;
      });

      // Reload comments
      await _loadComments(refresh: true);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã cập nhật bình luận thành công'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Error updating comment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi cập nhật bình luận: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _deleteComment(String commentId) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: const Text('Bạn có chắc chắn muốn xóa bình luận này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await CommentService.deleteComment(id: commentId);

      // Reload comments - this will also update _hasUserCommented
      await _loadComments(refresh: true);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã xóa bình luận thành công'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Error deleting comment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi xóa bình luận: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _startEdit(Map<String, dynamic> comment) {
    setState(() {
      _editingCommentId = comment['_id'] ?? comment['id'];
      _commentController.text = comment['content'] ?? '';
      _selectedStar = comment['star'] as int?;
      _replyingToId = null;
      _replyingToUserName = null;
    });
  }

  void _cancelEdit() {
    setState(() {
      _editingCommentId = null;
      _commentController.clear();
      _selectedStar = null;
    });
  }

  void _cancelReply() {
    setState(() {
      _replyingToId = null;
      _replyingToUserName = null;
    });
  }

  void _startReply(Map<String, dynamic> comment) {
    final creatorName =
        comment['creatorName'] ??
        comment['userId']?['name'] ??
        comment['userId']?['email'] ??
        'Người dùng';
    setState(() {
      _replyingToId = comment['_id'] ?? comment['id'];
      _replyingToUserName = creatorName;
    });
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          if (difference.inMinutes == 0) {
            return 'Vừa xong';
          }
          return '${difference.inMinutes} phút trước';
        }
        return '${difference.inHours} giờ trước';
      } else if (difference.inDays == 1) {
        return 'Hôm qua';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} ngày trước';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateString;
    }
  }

  Widget _buildStarRating({
    required int? selectedStar,
    required Function(int) onStarSelected,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starValue = index + 1;
        return GestureDetector(
          onTap: () => onStarSelected(starValue),
          child: Icon(
            selectedStar != null && starValue <= selectedStar
                ? Icons.star
                : Icons.star_border,
            color: selectedStar != null && starValue <= selectedStar
                ? Colors.amber
                : Colors.grey.shade400,
            size: 28,
          ),
        );
      }),
    );
  }

  Widget _buildCommentCard(Map<String, dynamic> comment) {
    // Use creatorName from comment, fallback to userId.name
    final creatorName =
        comment['creatorName'] ??
        comment['userId']?['name'] ??
        comment['userId']?['email'] ??
        'Người dùng';
    final content = comment['content'] ?? '';
    final createdAt = comment['createdAt'] ?? '';
    final star = comment['star'] as int?;
    final isReply = comment['parentId'] != null;
    final commentAccountId = comment['accountId']?.toString();
    final commentId = comment['_id'] ?? comment['id'];
    final isOwner =
        _currentAccountId != null &&
        commentAccountId != null &&
        commentAccountId == _currentAccountId &&
        !isReply; // Only allow edit/delete for main comments, not replies

    return Container(
      margin: EdgeInsets.only(bottom: 12, left: isReply ? 40 : 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isReply ? Colors.grey.shade50 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: Colors.green.shade100,
                child: Text(
                  creatorName.isNotEmpty ? creatorName[0].toUpperCase() : 'U',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      creatorName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      _formatDate(createdAt),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              if (star != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ...List.generate(5, (index) {
                      return Icon(
                        index < star ? Icons.star : Icons.star_border,
                        size: 16,
                        color: index < star
                            ? Colors.amber
                            : Colors.grey.shade300,
                      );
                    }),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade800,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (!isReply)
                TextButton.icon(
                  onPressed: () => _startReply(comment),
                  icon: const Icon(Icons.reply, size: 16),
                  label: const Text('Trả lời'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.green.shade600,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              if (isOwner) ...[
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () => _startEdit(comment),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Sửa'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.blue.shade600,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () => _deleteComment(commentId),
                  icon: const Icon(Icons.delete, size: 16),
                  label: const Text('Xóa'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red.shade600,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Icon(Icons.comment, color: Colors.green.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Bình luận',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              if (_comments.isNotEmpty)
                Text(
                  '${_comments.length} bình luận',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                ),
            ],
          ),
          const SizedBox(height: 20),

          // Reply indicator
          if (_replyingToUserName != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.reply, size: 16, color: Colors.green.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đang trả lời: $_replyingToUserName',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: _cancelReply,
                    color: Colors.green.shade700,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

          // Edit indicator
          if (_editingCommentId != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.edit, size: 16, color: Colors.blue.shade700),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Đang chỉnh sửa bình luận',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.blue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: _cancelEdit,
                    color: Colors.blue.shade700,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

          // Comment form - only show if user hasn't commented yet or is editing/replying
          if (!_hasUserCommented ||
              _editingCommentId != null ||
              _replyingToId != null)
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Star rating
                  const Text(
                    'Đánh giá (tùy chọn)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildStarRating(
                    selectedStar: _selectedStar,
                    onStarSelected: (star) {
                      setState(() {
                        _selectedStar = star;
                      });
                    },
                  ),
                  const SizedBox(height: 16),

                  // Comment input
                  TextFormField(
                    controller: _commentController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: _replyingToUserName != null
                          ? 'Nhập phản hồi của bạn...'
                          : 'Nhập bình luận của bạn...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: Colors.green.shade600,
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: Colors.grey.shade50,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng nhập nội dung bình luận';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submitComment,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Icon(Icons.send),
                      label: Text(
                        _isSubmitting
                            ? 'Đang gửi...'
                            : _editingCommentId != null
                            ? 'Cập nhật bình luận'
                            : 'Gửi bình luận',
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 24),
          const Divider(),

          // Comments list
          if (_isLoading && _comments.isEmpty)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_errorMessage != null && _comments.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Không thể tải bình luận',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => _loadComments(refresh: true),
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              ),
            )
          else if (_comments.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(
                      Icons.comment_outlined,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chưa có bình luận nào',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              children: [
                ..._comments.map((comment) => _buildCommentCard(comment)),
                if (_isLoading && _comments.isNotEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_hasMore && _comments.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: TextButton(
                      onPressed: _loadMoreComments,
                      child: const Text('Xem thêm bình luận'),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}
