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
  final int _pageSize = 10;
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
    _initData();
  }

  Future<void> _initData() async {
    await _loadCurrentAccountId();
    await _loadComments(refresh: true);
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  // --- Logic Xử lý Dữ liệu ---

  Future<void> _loadCurrentAccountId() async {
    try {
      final userProfile = await UserService.getUserProfile();
      if (userProfile['data'] != null) {
        setState(
          () => _currentAccountId = userProfile['data']['_id']?.toString(),
        );
      }
    } catch (e) {
      print('⚠️ Error loading account ID: $e');
    }
  }

  Future<void> _loadComments({bool refresh = false}) async {
    if (widget.parkingLotId.isEmpty || _isLoading) return;

    setState(() {
      _isLoading = true;
      if (refresh) {
        _currentPage = 1;
        _comments = [];
      }
    });

    try {
      final response = await CommentService.getCommentsByParkingLot(
        parkingLotId: widget.parkingLotId,
        page: _currentPage,
        pageSize: _pageSize,
      );

      final dynamic commentsData = response['data'];
      List<Map<String, dynamic>> fetchedComments = [];
      int totalPages = 1;

      if (commentsData is Map && commentsData.containsKey('data')) {
        fetchedComments = List<Map<String, dynamic>>.from(commentsData['data']);
        totalPages = commentsData['totalPages'] ?? 1;
      }

      setState(() {
        _comments.addAll(fetchedComments);
        _hasMore = _currentPage < totalPages;
        _isLoading = false;
      });
      _checkUserHasCommented();
    } catch (e) {
      setState(() => _isLoading = false);
      _showSnackBar('Lỗi tải bình luận: $e', Colors.red);
    }
  }

  void _checkUserHasCommented() {
    if (_currentAccountId == null) return;
    setState(() {
      _hasUserCommented = _comments.any(
        (c) =>
            c['accountId']?.toString() == _currentAccountId &&
            c['parentId'] == null,
      );
    });
  }

  // --- UI Components ---

  Widget _buildCommentItem(
    Map<String, dynamic> comment, {
    bool isReply = false,
  }) {
    final String creatorName = comment['creatorName'] ?? 'Người dùng';
    final String content = comment['content'] ?? '';
    final String createdAt = comment['createdAt'] ?? '';
    final String? role = comment['creatorRole'];
    final int? star = comment['star'];
    final String commentId = comment['_id'] ?? '';
    final List replies = comment['replies'] ?? [];

    bool isMyComment =
        _currentAccountId != null && comment['accountId'] == _currentAccountId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: EdgeInsets.only(bottom: 8, left: isReply ? 40 : 0),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isReply ? Colors.grey.shade50 : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: isReply
                        ? Colors.blue.shade100
                        : Colors.green.shade100,
                    child: Text(
                      creatorName[0].toUpperCase(),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green.shade800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              creatorName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            if (role == 'Operator') ...[
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade600,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Chủ bãi',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        Text(
                          _formatDate(createdAt),
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (star != null && !isReply) _buildMiniStars(star),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(top: 8, left: 42),
                child: Text(
                  content,
                  style: const TextStyle(fontSize: 14, height: 1.4),
                ),
              ),
              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (!isReply)
                    _smallTextButton(
                      'Trả lời',
                      Icons.reply,
                      () => _startReply(comment),
                    ),
                  if (isMyComment) ...[
                    _smallTextButton(
                      'Sửa',
                      Icons.edit,
                      () => _startEdit(comment),
                    ),
                    _smallTextButton(
                      'Xóa',
                      Icons.delete,
                      () => _deleteComment(commentId),
                      color: Colors.red,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
        // Render REPLIES recursively
        if (replies.isNotEmpty)
          ...replies
              .map((reply) => _buildCommentItem(reply, isReply: true))
              .toList(),
      ],
    );
  }

  Widget _buildMiniStars(int count) {
    return Row(
      children: List.generate(
        5,
        (i) => Icon(
          i < count ? Icons.star : Icons.star_border,
          size: 14,
          color: Colors.amber,
        ),
      ),
    );
  }

  Widget _smallTextButton(
    String label,
    IconData icon,
    VoidCallback onTap, {
    Color? color,
  }) {
    return TextButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 14, color: color ?? Colors.grey.shade700),
      label: Text(
        label,
        style: TextStyle(fontSize: 12, color: color ?? Colors.grey.shade700),
      ),
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 8),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          if (_replyingToUserName != null)
            _buildStatusIndicator(
              'Đang trả lời: $_replyingToUserName',
              Colors.green,
              _cancelReply,
            ),
          if (_editingCommentId != null)
            _buildStatusIndicator(
              'Đang chỉnh sửa bình luận',
              Colors.blue,
              _cancelEdit,
            ),

          if (!_hasUserCommented ||
              _editingCommentId != null ||
              _replyingToId != null)
            _buildCommentForm(),

          const Divider(height: 32),
          _isLoading && _comments.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: _comments.map((c) => _buildCommentItem(c)).toList(),
                ),

          if (_hasMore && _comments.isNotEmpty)
            Center(
              child: TextButton(
                onPressed: () => _loadMoreComments(),
                child: const Text('Xem thêm'),
              ),
            ),
        ],
      ),
    );
  }

  // --- Hỗ trợ khác ---

  Widget _buildHeader() {
    return Row(
      children: [
        const Icon(Icons.rate_review_outlined, color: Colors.green),
        const SizedBox(width: 8),
        Text(
          'Đánh giá & Bình luận (${_comments.length})',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator(
    String text,
    Color color,
    VoidCallback onCancel,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: color, fontWeight: FontWeight.w500),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 16),
            onPressed: onCancel,
          ),
        ],
      ),
    );
  }

  Widget _buildCommentForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_replyingToId == null) ...[
            const Text(
              'Đánh giá của bạn',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            _buildStarPicker(),
            const SizedBox(height: 8),
          ],
          TextFormField(
            controller: _commentController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Chia sẻ trải nghiệm của bạn...',
              fillColor: Colors.grey.shade50,
              filled: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitComment,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
              child: Text(_isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStarPicker() {
    return Row(
      children: List.generate(
        5,
        (index) => IconButton(
          icon: Icon(
            index < (_selectedStar ?? 0) ? Icons.star : Icons.star_border,
            color: Colors.amber,
            size: 30,
          ),
          onPressed: () => setState(() => _selectedStar = index + 1),
        ),
      ),
    );
  }

  // --- Helpers ---
  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
      if (diff.inHours < 24) return '${diff.inHours} giờ trước';
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  // Các hàm logic khác (giữ nguyên hoặc tối ưu nhẹ từ code cũ của bạn)
  void _startReply(Map<String, dynamic> comment) {
    setState(() {
      _replyingToId = comment['_id'];
      _replyingToUserName = comment['creatorName'];
      _editingCommentId = null;
      _commentController.clear();
    });
  }

  void _cancelReply() => setState(() {
    _replyingToId = null;
    _replyingToUserName = null;
  });
  void _cancelEdit() => setState(() {
    _editingCommentId = null;
    _commentController.clear();
  });

  void _startEdit(Map<String, dynamic> comment) {
    setState(() {
      _editingCommentId = comment['_id'];
      _commentController.text = comment['content'] ?? '';
      _selectedStar = comment['star'];
      _replyingToId = null;
    });
  }

  Future<void> _loadMoreComments() async {
    if (_hasMore && !_isLoading) {
      _currentPage++;
      await _loadComments();
    }
  }

  // Submit Logic... (Tương tự code của bạn nhưng gọi refresh: true sau khi xong)
  Future<void> _submitComment() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      if (_editingCommentId != null) {
        await CommentService.updateComment(
          id: _editingCommentId!,
          content: _commentController.text.trim(),
          star: _selectedStar,
        );
      } else {
        await CommentService.createComment(
          targetId: widget.parkingLotId,
          content: _commentController.text.trim(),
          targetType: 'ParkingLot',
          parentId: _replyingToId,
          star: _selectedStar,
        );
      }
      _commentController.clear();
      setState(() {
        _selectedStar = null;
        _replyingToId = null;
        _editingCommentId = null;
      });
      await _loadComments(refresh: true);
      _showSnackBar('Thành công', Colors.green);
    } catch (e) {
      _showSnackBar('Lỗi: $e', Colors.red);
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _deleteComment(String id) async {
    try {
      await CommentService.deleteComment(id: id);
      await _loadComments(refresh: true);
      _showSnackBar('Đã xóa', Colors.green);
    } catch (e) {
      _showSnackBar('Lỗi xóa', Colors.red);
    }
  }
}
