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

  // --- LOGIC XỬ LÝ DỮ LIỆU ---

  Future<void> _loadCurrentAccountId() async {
    try {
      final userProfile = await UserService.getUserProfile();
      if (userProfile['data'] != null && userProfile['data']['_id'] != null) {
        setState(
          () => _currentAccountId = userProfile['data']['_id'].toString(),
        );
      }
    } catch (e) {
      debugPrint('⚠️ Error loading account ID: $e');
    }
  }

  Future<void> _loadComments({bool refresh = false}) async {
    if (widget.parkingLotId.isEmpty) return;

    if (refresh) {
      setState(() {
        _currentPage = 1;
        _comments = [];
        _hasMore = true;
      });
    }

    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await CommentService.getCommentsByParkingLot(
        parkingLotId: widget.parkingLotId,
        page: _currentPage,
        pageSize: _pageSize,
      );

      final dynamic commentsData = response['data'];
      List<Map<String, dynamic>> newComments = [];
      int totalPages = 1;

      if (commentsData is Map && commentsData.containsKey('data')) {
        newComments = List<Map<String, dynamic>>.from(commentsData['data']);
        totalPages = commentsData['totalPages'] ?? 1;
      }

      setState(() {
        _comments.addAll(newComments);
        _hasMore = _currentPage < totalPages;
        _isLoading = false;
      });
      _checkUserHasCommented();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
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

  // --- UI COMPONENTS ---

  Widget _buildCommentItem(
    Map<String, dynamic> comment, {
    bool isReply = false,
  }) {
    final String creatorName = comment['creatorName'] ?? 'Người dùng';
    final String content = comment['content'] ?? '';
    final String createdAt = comment['createdAt'] ?? '';
    final String? role = comment['creatorRole'];
    final int? star = comment['star'];
    final String commentId = comment['_id'] ?? comment['id'] ?? '';
    final List replies = comment['replies'] ?? [];
    bool isMyComment =
        _currentAccountId != null &&
        comment['accountId']?.toString() == _currentAccountId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: isReply ? 20 : 0, top: 12),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isReply)
                  Container(
                    width: 2,
                    margin: const EdgeInsets.only(
                      right: 12,
                      bottom: 10,
                      top: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: isReply ? 14 : 18,
                            backgroundColor: Colors.green.shade50,
                            child: Text(
                              creatorName.isNotEmpty
                                  ? creatorName[0].toUpperCase()
                                  : 'U',
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
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
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: isReply ? 13 : 14,
                                      ),
                                    ),
                                    if (role == 'Operator') ...[
                                      const SizedBox(width: 6),
                                      _buildRoleBadge(),
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
                      Container(
                        margin: const EdgeInsets.only(top: 6, left: 2),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isReply
                              ? Colors.transparent
                              : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          content,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.black87,
                            height: 1.4,
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          const SizedBox(width: 8),
                          _smallActionText(
                            'Trả lời',
                            () => _startReply(comment),
                          ),
                          if (isMyComment) ...[
                            _smallActionText('Sửa', () => _startEdit(comment)),
                            _smallActionText(
                              'Xóa',
                              () => _deleteComment(commentId),
                              color: Colors.red.shade400,
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (replies.isNotEmpty)
          ...replies
              .map((reply) => _buildCommentItem(reply, isReply: true))
              .toList(),
        if (!isReply) const Divider(height: 24, thickness: 0.5),
      ],
    );
  }

  Widget _buildRoleBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.blue.shade200, width: 0.5),
      ),
      child: Text(
        'Chủ bãi',
        style: TextStyle(
          color: Colors.blue.shade700,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
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

  Widget _smallActionText(String label, VoidCallback onTap, {Color? color}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color ?? Colors.grey.shade600,
          ),
        ),
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
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
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

          const SizedBox(height: 16),
          _isLoading && _comments.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : _comments.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: _comments.map((c) => _buildCommentItem(c)).toList(),
                ),

          if (_hasMore && _comments.isNotEmpty)
            Center(
              child: TextButton(
                onPressed: () => _loadComments(),
                child: const Text('Xem thêm bình luận'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Icon(Icons.chat_bubble_outline, color: Colors.green.shade600),
        const SizedBox(width: 8),
        const Text(
          'Bình luận',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const Spacer(),
        if (_comments.isNotEmpty)
          Text(
            '${_comments.length} bình luận',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
          ),
      ],
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
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 4),
            _buildStarPicker(),
          ],
          const SizedBox(height: 12),
          TextFormField(
            controller: _commentController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Nhập nội dung...',
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitComment,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                _isSubmitting
                    ? 'Đang gửi...'
                    : (_editingCommentId != null
                          ? 'Cập nhật'
                          : 'Gửi bình luận'),
              ),
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
        (index) => GestureDetector(
          onTap: () => setState(() => _selectedStar = index + 1),
          child: Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Icon(
              index < (_selectedStar ?? 0) ? Icons.star : Icons.star_border,
              color: Colors.amber,
              size: 28,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator(
    String text,
    Color color,
    VoidCallback onCancel,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          GestureDetector(
            onTap: onCancel,
            child: Icon(Icons.close, size: 16, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          children: [
            Icon(
              Icons.speaker_notes_off_outlined,
              size: 48,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 8),
            Text(
              'Chưa có bình luận nào',
              style: TextStyle(color: Colors.grey.shade500),
            ),
          ],
        ),
      ),
    );
  }

  // --- LOGIC HELPERS ---

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inSeconds < 60) return 'Vừa xong';
      if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
      if (diff.inHours < 24) return '${diff.inHours} giờ trước';
      if (diff.inDays == 1) return 'Hôm qua';
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  void _startReply(Map<String, dynamic> comment) {
    setState(() {
      _replyingToId = comment['_id'] ?? comment['id'];
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
    _selectedStar = null;
  });

  void _startEdit(Map<String, dynamic> comment) {
    setState(() {
      _editingCommentId = comment['_id'] ?? comment['id'];
      _commentController.text = comment['content'] ?? '';
      _selectedStar = comment['star'];
      _replyingToId = null;
      _replyingToUserName = null;
    });
  }

  Future<void> _submitComment() async {
    if (_commentController.text.trim().isEmpty) return;
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
        _replyingToUserName = null;
      });
      await _loadComments(refresh: true);
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _deleteComment(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận'),
        content: const Text('Bạn có muốn xóa bình luận này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await CommentService.deleteComment(id: id);
      await _loadComments(refresh: true);
    } catch (e) {
      debugPrint('Error deleting: $e');
    }
  }
}
