import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

import '../../services/realtime_service.dart';

class CheckRealtimeStatusExample extends StatefulWidget {
  final String parkingLotId;
  final String roomName; // e.g., room_w3gvw8b

  const CheckRealtimeStatusExample({
    super.key,
    required this.parkingLotId,
    required this.roomName,
  });

  @override
  State<CheckRealtimeStatusExample> createState() =>
      _CheckRealtimeStatusExampleState();
}

class _CheckRealtimeStatusExampleState
    extends State<CheckRealtimeStatusExample> {
  final RealtimeService _realtime = RealtimeService();
  StreamSubscription? _sub;
  String _lastPayload = '';

  @override
  void initState() {
    super.initState();
    _sub = _realtime
        .connectAndListen(roomName: widget.roomName)
        .listen(
          (event) {
            setState(() {
              _lastPayload = event.toString();
            });
          },
          onError: (e) {
            setState(() {
              _lastPayload = 'Error: $e';
            });
          },
        );
  }

  @override
  void dispose() {
    _sub?.cancel();
    _realtime.dispose();
    super.dispose();
  }

  Future<void> _triggerCheck({int change = -1}) async {
    final baseUrl = dotenv.env['BASE_URL'] ?? '';
    final url = Uri.parse(
      '$baseUrl/parking/parking-lots/${widget.parkingLotId}/check-real-time-status',
    );
    // This endpoint is POST with body { change }
    await http.post(url, body: {'change': change.toString()});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Realtime Parking Lot Demo')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Room: ${widget.roomName}'),
            const SizedBox(height: 12),
            Text('Last event: $_lastPayload'),
            const SizedBox(height: 24),
            Row(
              children: [
                ElevatedButton(
                  onPressed: () => _triggerCheck(change: -1),
                  child: const Text('Giảm 1 chỗ'),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () => _triggerCheck(change: 1),
                  child: const Text('Tăng 1 chỗ'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
