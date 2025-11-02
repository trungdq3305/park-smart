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
    // Get current user's name
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
      // Initialize room when user ID is loaded
      await _initializeRoom();
    }
  }

  Future<void> _initializeRoom() async {
    if (_currentUserId == null) return;
    final roomRef = _roomRef();
    if (roomRef == null) return;

    // Create room if it doesn't exist
    final roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      await roomRef.set({
        'peerId': widget.peerUserId,
        'peerName': widget.peerDisplayName,
        'lastMessage': '',
        'updatedAt': FieldValue.serverTimestamp(),
        'unreadCount': 0,
      });
    }
  }

  String _chatId(String a, String b) {
    // Stable chat id for two users regardless of order
    return (a.compareTo(b) <= 0) ? '${a}_$b' : '${b}_$a';
  }

  // Get room document reference
  DocumentReference<Map<String, dynamic>>? _roomRef() {
    if (_currentUserId == null) return null;
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    return FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(roomId);
  }

  // Get messages subcollection reference
  CollectionReference<Map<String, dynamic>>? _messagesRef() {
    if (_currentUserId == null) return null;
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    return FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(roomId)
        .collection('messages');
  }

  // Get or create room for peer user
  Future<DocumentReference<Map<String, dynamic>>?>
  _getOrCreatePeerRoom() async {
    if (_currentUserId == null || _currentUserName == null) return null;
    final roomId = _chatId(_currentUserId!, widget.peerUserId);
    final peerRoomRef = FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(widget.peerUserId)
        .collection('rooms')
        .doc(roomId);

    // Check if room exists
    final peerRoomDoc = await peerRoomRef.get();
    if (!peerRoomDoc.exists) {
      // Create room for peer user
      await peerRoomRef.set({
        'peerId': _currentUserId!,
        'peerName': _currentUserName!,
        'lastMessage': '',
        'updatedAt': FieldValue.serverTimestamp(),
        'unreadCount': 0,
      });
    }
    return peerRoomRef;
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending || _currentUserId == null) return;

    final messagesRef = _messagesRef();
    final roomRef = _roomRef();
    if (messagesRef == null || roomRef == null) return;

    setState(() => _isSending = true);
    try {
      final now = FieldValue.serverTimestamp();

      // Add message to subcollection
      await messagesRef.add({
        'text': text,
        'senderId': _currentUserId!,
        'receiverId': widget.peerUserId,
        'timestamp': now,
        'seen': false,
      });

      // Update or create room document
      await roomRef.set({
        'peerId': widget.peerUserId,
        'peerName': widget.peerDisplayName,
        'lastMessage': text,
        'updatedAt': now,
        'unreadCount': 0,
      }, SetOptions(merge: true));

      // Update peer's room
      final peerRoomRef = await _getOrCreatePeerRoom();
      if (peerRoomRef != null && _currentUserName != null) {
        await peerRoomRef.update({
          'peerId': _currentUserId!,
          'peerName': _currentUserName!,
          'lastMessage': text,
          'updatedAt': now,
          'unreadCount': FieldValue.increment(1),
        });
      }

      _textController.clear();
      // Scroll to bottom after a short delay so the new item is laid out
      await Future.delayed(const Duration(milliseconds: 50));
      if (mounted && _scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
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
          elevation: 0,
        ),
        body: _currentUserId == null
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  Expanded(
                    child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream: _messagesRef()!
                          .orderBy('timestamp', descending: true)
                          .limit(200)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }

                        final docs = snapshot.data?.docs ?? [];
                        if (docs.isEmpty) {
                          return const Center(
                            child: Text('Hãy bắt đầu cuộc trò chuyện...'),
                          );
                        }

                        return ListView.builder(
                          controller: _scrollController,
                          reverse: true,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          itemCount: docs.length,
                          itemBuilder: (context, index) {
                            final data = docs[index].data();
                            final isMe = data['senderId'] == _currentUserId!;
                            final text = (data['text'] ?? '').toString();
                            final ts = (data['timestamp'] as Timestamp?);
                            final time = ts != null
                                ? TimeOfDay.fromDateTime(
                                    ts.toDate(),
                                  ).format(context)
                                : '';

                            return Align(
                              alignment: isMe
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                constraints: BoxConstraints(
                                  maxWidth:
                                      MediaQuery.of(context).size.width * 0.75,
                                ),
                                decoration: BoxDecoration(
                                  color: isMe
                                      ? Colors.green.shade100
                                      : Colors.grey.shade200,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: isMe
                                      ? CrossAxisAlignment.end
                                      : CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      text,
                                      style: const TextStyle(fontSize: 15),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      time,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),

                  // Input area
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _textController,
                              minLines: 1,
                              maxLines: 5,
                              textInputAction: TextInputAction.newline,
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
                            onPressed: (_isSending || _currentUserId == null)
                                ? null
                                : _sendMessage,
                            style: IconButton.styleFrom(
                              backgroundColor: _isSending
                                  ? Colors.grey.shade300
                                  : Colors.green,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.send),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
