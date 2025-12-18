import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/user_service.dart';

class MessageChatScreen extends StatefulWidget {
  final String peerUserId;
  final String peerDisplayName;

  const MessageChatScreen({
    super.key,
    required this.peerUserId,
    required this.peerDisplayName,
  });

  @override
  State<MessageChatScreen> createState() => _MessageChatScreenState();
}

class _MessageChatScreenState extends State<MessageChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;
  String? _currentUserId;
  String? _currentUserName;

  @override
  void initState() {
    super.initState();
    _loadUserId();
  }

  Future<void> _loadUserId() async {
    final userId = await UserService.getUserId();
    String? userName;
    try {
      final userProfile = await UserService.getUserProfile();
      final userData = userProfile['data'];
      userName =
          userData['driverDetail']?['fullName'] ??
          userData['adminDetail']?['fullName'] ??
          userData['operatorDetail']?['fullName'] ??
          userData['fullName'] ??
          'Người dùng';
    } catch (e) {
      userName = 'Người dùng';
    }

    if (mounted) {
      setState(() {
        _currentUserId = userId;
        _currentUserName = userName;
      });
      await _initializeRoom();
      _markAsRead(); // Reset thông báo khi vào chat
    }
  }

  String _chatId(String a, String b) {
    return (a.compareTo(b) <= 0) ? '${a}_$b' : '${b}_$a';
  }

  // Collection chung duy nhất để cả 2 người cùng đọc/ghi
  CollectionReference<Map<String, dynamic>> _messagesRef() {
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    return FirebaseFirestore.instance
        .collection('messages')
        .doc(roomId)
        .collection('items');
  }

  Future<void> _initializeRoom() async {
    if (_currentUserId == null) return;
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    final myRoomRef = FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(roomId);

    final roomDoc = await myRoomRef.get();
    if (!roomDoc.exists) {
      await myRoomRef.set({
        'peerId': widget.peerUserId,
        'peerName': widget.peerDisplayName,
        'lastMessage': '',
        'updatedAt': FieldValue.serverTimestamp(),
        'unreadCount': 0,
      });
    }
  }

  Future<void> _markAsRead() async {
    if (_currentUserId == null) return;
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    await FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(roomId)
        .update({'unreadCount': 0});
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending || _currentUserId == null) return;

    setState(() => _isSending = true);
    try {
      final now = FieldValue.serverTimestamp();
      final roomId = _chatId(_currentUserId!, widget.peerUserId);

      final payload = {
        'text': text,
        'senderId': _currentUserId!,
        'receiverId': widget.peerUserId,
        'timestamp': now,
        'seen': false,
      };

      // 1. Ghi tin nhắn vào kho chung
      await _messagesRef().add(payload);

      // 2. Cập nhật trạng thái phòng chat của mình
      await FirebaseFirestore.instance
          .collection('chatRooms')
          .doc(_currentUserId!)
          .collection('rooms')
          .doc(roomId)
          .set({
            'lastMessage': text,
            'updatedAt': now,
            'unreadCount': 0,
          }, SetOptions(merge: true));

      // 3. Cập nhật trạng thái phòng chat của đối phương (tăng unreadCount)
      await FirebaseFirestore.instance
          .collection('chatRooms')
          .doc(widget.peerUserId)
          .collection('rooms')
          .doc(roomId)
          .set({
            'peerId': _currentUserId!,
            'peerName': _currentUserName ?? 'Người dùng',
            'lastMessage': text,
            'updatedAt': now,
            'unreadCount': FieldValue.increment(1),
          }, SetOptions(merge: true));

      _textController.clear();
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: Text(widget.peerDisplayName),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
        ),
        body: _currentUserId == null
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  Expanded(
                    child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream: _messagesRef()
                          .orderBy('timestamp', descending: true)
                          .limit(100)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (!snapshot.hasData) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }
                        final docs = snapshot.data!.docs;
                        if (docs.isEmpty) {
                          return const Center(
                            child: Text('Hãy bắt đầu cuộc trò chuyện...'),
                          );
                        }
                        return _buildMessageList(docs);
                      },
                    ),
                  ),
                  _buildInputArea(),
                ],
              ),
      ),
    );
  }

  Widget _buildInputArea() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _textController,
                decoration: InputDecoration(
                  hintText: 'Nhập tin nhắn...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _isSending ? null : _sendMessage,
              style: IconButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.send),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageList(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
  ) {
    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: docs.length,
      itemBuilder: (context, index) {
        final data = docs[index].data();
        final isMe = data['senderId'] == _currentUserId;
        final text = data['text'] ?? '';
        final ts = data['timestamp'] as Timestamp?;

        // Định dạng thời gian gửi
        String timeStr = '';
        if (ts != null) {
          final date = ts.toDate();
          timeStr =
              "${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
        }

        return Align(
          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            decoration: BoxDecoration(
              color: isMe ? Colors.green.shade100 : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: isMe
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                Text(text, style: const TextStyle(fontSize: 15)),
                const SizedBox(height: 4),
                Text(
                  timeStr,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
