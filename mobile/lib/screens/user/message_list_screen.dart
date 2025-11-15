import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/user_service.dart';
import 'chat/message_chat_screen.dart';

class MessageListScreen extends StatefulWidget {
  const MessageListScreen({super.key});

  @override
  State<MessageListScreen> createState() => _MessageListScreenState();
}

class _MessageListScreenState extends State<MessageListScreen> {
  String? _currentUserId;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadUserId();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadUserId() async {
    final userId = await UserService.getUserId();
    if (mounted) {
      setState(() {
        _currentUserId = userId;
      });
    }
  }

  // Test function to create a test chat room
  Future<void> _createTestChat() async {
    if (_currentUserId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Chưa có user ID')));
      return;
    }

    try {
      // Get current user name
      String? userName;
      try {
        final userProfile = await UserService.getUserProfile();
        final userData = userProfile['data'];
        userName =
            userData['driverDetail']?['fullName'] ??
            userData['adminDetail']?['fullName'] ??
            userData['operatorDetail']?['fullName'] ??
            userData['fullName'] ??
            'Test User';
      } catch (e) {
        userName = 'Test User';
      }

      // Create a test peer user ID (you can change this to a real user ID)
      final testPeerId = 'test_peer_${DateTime.now().millisecondsSinceEpoch}';
      final testPeerName = 'Người dùng Test';
      final roomId = _currentUserId!.compareTo(testPeerId) <= 0
          ? '${_currentUserId!}_$testPeerId'
          : '${testPeerId}_${_currentUserId!}';

      // Create room in current user's chatRooms
      final roomRef = FirebaseFirestore.instance
          .collection('chatRooms')
          .doc(_currentUserId!)
          .collection('rooms')
          .doc(roomId);

      await roomRef.set({
        'peerId': testPeerId,
        'peerName': testPeerName,
        'lastMessage': 'Đây là tin nhắn test',
        'updatedAt': FieldValue.serverTimestamp(),
        'unreadCount': 0,
      });

      // Create a test message
      final messagesRef = roomRef.collection('messages');
      await messagesRef.add({
        'text': 'Đây là tin nhắn test',
        'senderId': _currentUserId!,
        'receiverId': testPeerId,
        'timestamp': FieldValue.serverTimestamp(),
        'seen': false,
      });

      // Create room for peer user (if needed for testing)
      final peerRoomRef = FirebaseFirestore.instance
          .collection('chatRooms')
          .doc(testPeerId)
          .collection('rooms')
          .doc(roomId);

      await peerRoomRef.set({
        'peerId': _currentUserId!,
        'peerName': userName,
        'lastMessage': 'Đây là tin nhắn test',
        'updatedAt': FieldValue.serverTimestamp(),
        'unreadCount': 1,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Đã tạo test chat thành công!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
      debugPrint('Error creating test chat: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUserId == null) {
      return AppScaffold(
        showBottomNav: false,
        body: Scaffold(
          appBar: AppBar(
            title: const Text('Tin nhắn'),
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          body: const Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Tin nhắn'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: Column(
          children: [
            // Search bar
            Container(
              padding: const EdgeInsets.all(8.0),
              color: Colors.green,
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm cuộc trò chuyện...',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
                  prefixIcon: const Icon(Icons.search, color: Colors.white),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Colors.white),
                          onPressed: () {
                            _searchController.clear();
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.2),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
              ),
            ),
            // Chat list
            Expanded(
              child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseFirestore.instance
                    .collection('chatRooms')
                    .doc(_currentUserId!)
                    .collection('rooms')
                    .orderBy('updatedAt', descending: true)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (snapshot.hasError) {
                    return Center(child: Text('Lỗi: ${snapshot.error}'));
                  }

                  var chats = snapshot.data?.docs ?? [];

                  // Filter by search query
                  if (_searchQuery.isNotEmpty) {
                    chats = chats.where((doc) {
                      final data = doc.data();
                      final peerName = (data['peerName'] ?? '')
                          .toString()
                          .toLowerCase();
                      final lastMessage = (data['lastMessage'] ?? '')
                          .toString()
                          .toLowerCase();
                      return peerName.contains(_searchQuery) ||
                          lastMessage.contains(_searchQuery);
                    }).toList();
                  }

                  if (chats.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _searchQuery.isEmpty
                                ? 'Chưa có cuộc trò chuyện nào'
                                : 'Không tìm thấy cuộc trò chuyện nào',
                          ),
                          const SizedBox(height: 16),
                          // Test button
                          ElevatedButton.icon(
                            onPressed: _createTestChat,
                            icon: const Icon(Icons.add),
                            label: const Text('Tạo test chat'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    itemCount: chats.length,
                    itemBuilder: (context, index) {
                      final chatDoc = chats[index];
                      final chatData = chatDoc.data();

                      final peerId = chatData['peerId'] as String? ?? '';
                      final peerName =
                          chatData['peerName'] as String? ?? 'Người dùng';
                      final lastMessage =
                          chatData['lastMessage'] as String? ?? '';
                      final updatedAt = chatData['updatedAt'] as Timestamp?;
                      final unreadCount = chatData['unreadCount'] as int? ?? 0;

                      return ListTile(
                        leading: const Icon(
                          Icons.person,
                          color: Colors.green,
                          size: 40,
                        ),
                        title: Text(
                          peerName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          lastMessage,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (updatedAt != null)
                              Text(
                                _formatTime(updatedAt.toDate()),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            if (unreadCount > 0)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.green,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  unreadCount.toString(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => MessageChatScreen(
                                peerUserId: peerId,
                                peerDisplayName: peerName,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Hôm qua';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
