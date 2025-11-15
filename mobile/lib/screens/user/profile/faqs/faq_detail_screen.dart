import 'package:flutter/material.dart';
import '../../../../services/faq_service.dart';
import '../../../../services/comment_service.dart';
import '../../../../services/user_service.dart';
import '../../../../widgets/app_scaffold.dart';

class FaqDetailScreen extends StatefulWidget {
  final Map<String, dynamic> faq;

  const FaqDetailScreen({super.key, required this.faq});

  @override
  State<FaqDetailScreen> createState() => _FaqDetailScreenState();
}

class _FaqDetailScreenState extends State<FaqDetailScreen> {
  Map<String, dynamic>? _faqDetail;
  bool _isLoadingFaq = false;
  final _commentController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  List<Map<String, dynamic>> _comments = [];
  bool _isLoadingComments = false;
  bool _isSubmitting = false;
  int _currentPage = 1;
  int _pageSize = 10;
  bool _hasMore = true;
  String? _currentAccountId;
  bool _hasUserCommented = false;

  @override
  void initState() {
    super.initState();
    _faqDetail = widget.faq;
    _loadCurrentAccountId();
    _loadFaqDetail();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  /// Load current account ID from token or user data
  Future<void> _loadCurrentAccountId() async {
    try {
      final userProfile = await UserService.getUserProfile();
      if (userProfile['data'] != null && userProfile['data']['_id'] != null) {
        setState(() {
          _currentAccountId = userProfile['data']['_id'] as String;
        });
        return;
      }

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
          }
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

  Future<void> _loadFaqDetail() async {
    final faqId = widget.faq['_id'] ?? widget.faq['id'];
    if (faqId == null) return;

    setState(() {
      _isLoadingFaq = true;
    });

    try {
      final response = await FaqService.getFaqById(faqId);
      final faqData = response['data'];

      setState(() {
        if (faqData is Map) {
          _faqDetail = Map<String, dynamic>.from(faqData);
        } else {
          _faqDetail = widget.faq;
        }
        _isLoadingFaq = false;
      });
    } catch (e) {
      print('❌ Error loading FAQ detail: $e');
      setState(() {
        _isLoadingFaq = false;
      });
    }
  }

  Future<void> _loadComments({bool refresh = false}) async {
    final faqId = widget.faq['_id'] ?? widget.faq['id'];
    if (faqId == null) return;

    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMore = true;
        _comments = [];
      });
    }

    if (_isLoadingComments) return;

    setState(() {
      _isLoadingComments = true;
    });

    try {
      final response = await CommentService.getCommentsByFaq(
        faqId: faqId,
        page: _currentPage,
        pageSize: _pageSize,
      );

      print('📦 Comments response structure: ${response.keys}');

      dynamic commentsData = response['data'];
      List<Map<String, dynamic>> newComments = [];

      if (commentsData is Map && commentsData.containsKey('data')) {
        final nestedData = commentsData['data'];
        if (nestedData is List) {
          newComments = List<Map<String, dynamic>>.from(nestedData);
        }
        final totalPages = commentsData['totalPages'] ?? 1;

        setState(() {
          if (refresh) {
            _comments = newComments;
          } else {
            _comments.addAll(newComments);
          }
          _hasMore = _currentPage < totalPages;
          if (_hasMore) {
            _currentPage++;
          }
          _isLoadingComments = false;
        });
        _checkUserHasCommented();
      } else if (commentsData is List) {
        newComments = List<Map<String, dynamic>>.from(commentsData);
        final pagination = response['pagination'];
        final totalPages = pagination?['totalPages'] ?? 1;

        setState(() {
          if (refresh) {
            _comments = newComments;
          } else {
            _comments.addAll(newComments);
          }
          _hasMore = _currentPage < totalPages;
          if (_hasMore) {
            _currentPage++;
          }
          _isLoadingComments = false;
        });
        _checkUserHasCommented();
      } else {
        setState(() {
          if (refresh) {
            _comments = [];
          }
          _hasMore = false;
          _isLoadingComments = false;
        });
        _checkUserHasCommented();
      }

      print('✅ Loaded ${newComments.length} comments');
    } catch (e) {
      print('❌ Error loading comments: $e');
      setState(() {
        _isLoadingComments = false;
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

    final faqId = widget.faq['_id'] ?? widget.faq['id'];
    if (faqId == null) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      await CommentService.createComment(
        targetId: faqId,
        content: _commentController.text.trim(),
        targetType: 'FAQ',
      );

      _commentController.clear();
      setState(() {
        _hasUserCommented = true;
      });

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

  Widget _buildCommentCard(Map<String, dynamic> comment) {
    final creatorName =
        comment['creatorName'] ??
        comment['userId']?['name'] ??
        comment['userId']?['email'] ??
        'Người dùng';
    final content = comment['content'] ?? '';
    final createdAt = comment['createdAt'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                Row(
                  children: [
                    Text(
                      creatorName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDate(createdAt),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  content,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade800,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final question =
        _faqDetail?['question'] ?? widget.faq['question'] ?? 'Không có câu hỏi';
    final answer =
        _faqDetail?['answer'] ?? widget.faq['answer'] ?? 'Không có câu trả lời';

    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Chi tiết FAQ'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: _isLoadingFaq
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // FAQ Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.1),
                            spreadRadius: 0,
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  Icons.help_outline,
                                  color: Colors.green.shade700,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Text(
                                  question,
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.grey.shade900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.info_outline,
                                size: 20,
                                color: Colors.blue.shade600,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  answer,
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: Colors.grey.shade800,
                                    height: 1.6,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Comments Section
                    Container(
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
                          Row(
                            children: [
                              Icon(
                                Icons.comment,
                                color: Colors.green.shade600,
                                size: 24,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Bình luận',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const Spacer(),
                              if (_comments.isNotEmpty)
                                Text(
                                  '${_comments.length} bình luận',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Comment form - only show if user hasn't commented yet
                          if (!_hasUserCommented)
                            Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  TextFormField(
                                    controller: _commentController,
                                    maxLines: 4,
                                    decoration: InputDecoration(
                                      hintText: 'Nhập bình luận của bạn...',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: Colors.grey.shade300,
                                        ),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: Colors.grey.shade300,
                                        ),
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
                                      if (value == null ||
                                          value.trim().isEmpty) {
                                        return 'Vui lòng nhập nội dung bình luận';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      onPressed: _isSubmitting
                                          ? null
                                          : _submitComment,
                                      icon: _isSubmitting
                                          ? const SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(Colors.white),
                                              ),
                                            )
                                          : const Icon(Icons.send),
                                      label: Text(
                                        _isSubmitting
                                            ? 'Đang gửi...'
                                            : 'Gửi bình luận',
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.green,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 14,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
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
                          if (_isLoadingComments && _comments.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(20),
                              child: Center(child: CircularProgressIndicator()),
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
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          else
                            Column(
                              children: [
                                ..._comments.map(
                                  (comment) => _buildCommentCard(comment),
                                ),
                                if (_isLoadingComments && _comments.isNotEmpty)
                                  const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                  )
                                else if (_hasMore && _comments.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: TextButton(
                                      onPressed: () => _loadComments(),
                                      child: const Text('Xem thêm bình luận'),
                                    ),
                                  ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
