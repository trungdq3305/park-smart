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
      // Đánh dấu đã xem khi vào chat
      _markAsRead();
    }
  }

  // Tạo ID phòng chat cố định cho 2 người (A_B hoặc B_A)
  String _chatId(String a, String b) {
    return (a.compareTo(b) <= 0) ? '${a}_$b' : '${b}_$a';
  }

  // Collection chứa tin nhắn chung - NƠI DUY NHẤT ĐỂ ĐỌC/GHI TIN NHẮN
  CollectionReference<Map<String, dynamic>> _messagesRef() {
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    return FirebaseFirestore.instance
        .collection('messages')
        .doc(roomId)
        .collection('items');
  }

  Future<void> _initializeRoom() async {
    if (_currentUserId == null) return;

    // Khởi tạo document room cho chính mình để hiện ở MessageList
    final myRoomRef = FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(_chatId(_currentUserId!, widget.peerUserId));

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

      // 1. Ghi vào collection tin nhắn chung
      await _messagesRef().add(payload);

      // 2. Cập nhật room của mình (để hiện tin nhắn cuối)
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

      // 3. Cập nhật room của đối phương (tăng unreadCount)
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
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } catch (e) {
      debugPrint("Send error: $e");
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
        ),
        body: _currentUserId == null
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  Expanded(
                    child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      // Đọc từ collection chung duy nhất
                      stream: _messagesRef()
                          .orderBy('timestamp', descending: true)
                          .limit(100)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (!snapshot.hasData)
                          return const Center(
                            child: CircularProgressIndicator(),
                          );

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
        padding: const EdgeInsets.all(8.0),
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
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.send, color: Colors.green),
              onPressed: _isSending ? null : _sendMessage,
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
      itemCount: docs.length,
      itemBuilder: (context, index) {
        final data = docs[index].data();
        final isMe = data['senderId'] == _currentUserId;
        return _buildChatBubble(data['text'] ?? '', isMe, data['timestamp']);
      },
    );
  }

  Widget _buildChatBubble(String text, bool isMe, dynamic ts) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        decoration: BoxDecoration(
          color: isMe ? Colors.green[100] : Colors.grey[300],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(text),
      ),
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
